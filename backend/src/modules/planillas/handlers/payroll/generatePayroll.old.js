import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../../mantenimientos_consultas/shared/transaction.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import {
  calculateHourlyRate,
  calculateDailyRate,
  calcularDíasLaboralesEsperados,
  calcularDuracionTurno,
  calcularRentaProyectada,
  calcularDeduccionesDetallado,
} from "../../shared/calculations.js";
import { ensureEstado } from "../../shared/resolvers.js";
import { roundCurrency, roundDecimal, serializePlanilla } from "../../shared/formatters.js";

dayjs.extend(isSameOrBefore);

const {
  PeriodoPlanilla,
  Contrato,
  JornadaDiaria,
  Planilla,
  Deduccion,
  DeduccionPlanilla,
  Feriado,
} = models;

/* ─────────────────────────────────────────────────────────────────────
   Funciones de obtención de datos
   ───────────────────────────────────────────────────────────────────── */

async function obtenerJornadas({ colaboradorId, fechaInicio, fechaFin, transaction }) {
  const registros = await JornadaDiaria.findAll({
    attributes: [
      "id_jornada",
      "fecha",
      "horas_ordinarias",
      "horas_extra",
      "horas_nocturnas",
      "feriado",
      "incapacidad",
      "vacaciones",
      "permiso",
    ],
    where: {
      id_colaborador: colaboradorId,
      fecha: { [Op.between]: [fechaInicio, fechaFin] },
    },
    include: [
      {
        association: "incapacidadRef",
        attributes: ["porcentaje_patrono", "porcentaje_ccss"],
        required: false,
      },
    ],
    order: [["fecha", "ASC"]],
    raw: false,
    transaction,
  });

  return registros.map((j) => ({
    fecha: dayjs(j.fecha).format("YYYY-MM-DD"),
    horas_ordinarias: Number(j.horas_ordinarias ?? 0),
    horas_extra: Number(j.horas_extra ?? 0),
    horas_nocturnas: Number(j.horas_nocturnas ?? 0),
    es_feriado: j.feriado !== null,
    id_incapacidad: j.incapacidad,
    incapacidad_data: j.incapacidadRef
      ? {
          porcentaje_patrono: Number(j.incapacidadRef.porcentaje_patrono ?? 0),
          porcentaje_ccss: Number(j.incapacidadRef.porcentaje_ccss ?? 0),
        }
      : null,
    id_vacaciones: j.vacaciones,
    id_permiso: j.permiso,
  }));
}

async function obtenerFeriados({ fechaInicio, fechaFin, transaction }) {
  const feriados = await Feriado.findAll({
    where: {
      fecha: { [Op.between]: [fechaInicio, fechaFin] },
      es_obligatorio: true,
    },
    attributes: ["id_feriado", "fecha", "nombre"],
    transaction,
  });

  return feriados.map((f) => ({
    id_feriado: f.id_feriado,
    fecha: dayjs(f.fecha).format("YYYY-MM-DD"),
    nombre: f.nombre,
  }));
}

async function obtenerVacacionesAprobadas({ colaboradorId, fechaInicio, fechaFin, transaction }) {
  return models.SolicitudVacaciones.findAll({
    attributes: ["id_solicitud_vacaciones", "fecha_inicio", "fecha_fin"],
    where: {
      id_colaborador: colaboradorId,
      fecha_inicio: { [Op.lte]: fechaFin },
      fecha_fin: { [Op.gte]: fechaInicio },
      "$estadoSolicitud.estado$": "APROBADO",
    },
    include: [
      { association: "estadoSolicitud", attributes: ["estado"], required: true },
    ],
    transaction,
  });
}

async function obtenerPermisosConGoce({ colaboradorId, fechaInicio, fechaFin, transaction }) {
  return models.SolicitudPermisos.findAll({
    attributes: ["id_solicitud", "fecha_inicio", "fecha_fin", "cantidad_dias"],
    where: {
      id_colaborador: colaboradorId,
      con_goce_salarial: true,
      fecha_inicio: { [Op.lte]: fechaFin },
      fecha_fin: { [Op.gte]: fechaInicio },
      "$estadoSolicitud.estado$": "APROBADO",
    },
    include: [
      { association: "estadoSolicitud", attributes: ["estado"], required: true },
    ],
    transaction,
  });
}

/* ─────────────────────────────────────────────────────────────────────
   Utilidades
   ───────────────────────────────────────────────────────────────────── */

function expandirRangoFechas(registros, campoInicio = "fecha_inicio", campoFin = "fecha_fin") {
  const fechas = new Set();
  for (const r of registros) {
    let actual = dayjs(r[campoInicio]);
    const fin = dayjs(r[campoFin]);
    while (actual.isSameOrBefore(fin)) {
      fechas.add(actual.format("YYYY-MM-DD"));
      actual = actual.add(1, "day");
    }
  }
  return fechas;
}

function parseDiasLaborales(diasLibresStr) {
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  if (!diasLibresStr) return [0, 1, 2, 3, 4];

  const str = diasLibresStr.toUpperCase();
  const libresSet = new Set();
  if (str.includes("L")) libresSet.add(0);
  if (str.includes("M")) libresSet.add(1);
  if (str.includes("K")) libresSet.add(2);
  if (str.includes("J")) libresSet.add(3);
  if (str.includes("V")) libresSet.add(4);
  if (str.includes("S")) libresSet.add(5);
  if (str.includes("D")) libresSet.add(6);
  return allDays.filter((d) => !libresSet.has(d));
}

/* ─────────────────────────────────────────────────────────────────────
   Procesamiento de días del período
   
   Lógica:
   - El salario base quincenal es FIJO = salario_mensual / 2
   - Se DESCUENTA por cada día laboral de ausencia injustificada
   - Se DESCUENTA la porción NO cubierta por incapacidad
   - Se SUMA horas extra, nocturnas y feriado trabajado
   - Feriados obligatorios no trabajados NO descuentan (se pagan)
   - Vacaciones aprobadas NO descuentan (se pagan)
   - Permisos con goce NO descuentan (se pagan)
   ───────────────────────────────────────────────────────────────────── */

function procesarDiasPeriodo({
  fechaInicio,
  fechaFin,
  jornadas,
  feriadosFechas,
  vacacionesFechas,
  permisosConGoceFechas,
  diasLaboralesSet,
  salarioDiario,
}) {
  const jornadaMap = new Map(jornadas.map((j) => [j.fecha, j]));

  // Acumuladores de horas (solo para extras, nocturnas, feriado trabajado)
  let totalHorasExtra = 0;
  let totalHorasNocturnas = 0;
  let totalHorasFeriado = 0;

  // Descuentos
  let diasAusencias = 0;
  let montoDescuentoAusencias = 0;
  let diasIncapacidad = 0;
  let montoDescuentoIncapacidad = 0; // porción NO cubierta por patrono

  // Conteos informativos
  let diasTrabajados = 0;
  let diasFeriado = 0;
  let diasVacaciones = 0;
  let diasPermisosConGoce = 0;
  let diasNoLaborales = 0;

  let actual = dayjs(fechaInicio);
  const fin = dayjs(fechaFin);

  while (actual.isSameOrBefore(fin)) {
    const fechaStr = actual.format("YYYY-MM-DD");
    const jornada = jornadaMap.get(fechaStr);
    // dayjs: 0=domingo, 1=lunes ... 6=sabado
    // Nuestro mapeo: 0=lunes, 1=martes ... 6=domingo
    const dayOfWeek = (actual.day() + 6) % 7;
    const esLaboral = diasLaboralesSet.has(dayOfWeek);

    if (!esLaboral) {
      // Día no laboral (fin de semana, día libre)
      // Si hay jornada con extras (ej: trabajó un sábado con extras aprobadas)
      if (jornada) {
        totalHorasExtra += jornada.horas_extra;
        totalHorasNocturnas += jornada.horas_nocturnas;
      }
      diasNoLaborales++;
    } else if (jornada && jornada.horas_ordinarias > 0) {
      // Día laboral trabajado → no descuenta nada
      diasTrabajados++;
      totalHorasExtra += jornada.horas_extra;
      totalHorasNocturnas += jornada.horas_nocturnas;

      // Si además es feriado obligatorio y trabajó → pago adicional de feriado
      if (jornada.es_feriado) {
        totalHorasFeriado += jornada.horas_ordinarias;
      }
    } else if (feriadosFechas.has(fechaStr)) {
      // Feriado obligatorio no trabajado → se paga, no descuenta
      diasFeriado++;
    } else if (vacacionesFechas.has(fechaStr)) {
      // Vacaciones aprobadas → se paga, no descuenta
      diasVacaciones++;
    } else if (permisosConGoceFechas.has(fechaStr)) {
      // Permiso con goce → se paga, no descuenta
      diasPermisosConGoce++;
    } else if (jornada && jornada.id_incapacidad && jornada.incapacidad_data) {
      // Incapacidad → descontar la porción NO cubierta por el patrono
      const { porcentaje_patrono } = jornada.incapacidad_data;
      diasIncapacidad++;
      if (porcentaje_patrono <= 0) {
        // 0% cobertura → se descuenta el día completo
        montoDescuentoIncapacidad += salarioDiario;
      } else if (porcentaje_patrono < 100) {
        // Cobertura parcial → se descuenta la porción no cubierta
        const porcionNoCubierta = (100 - porcentaje_patrono) / 100;
        montoDescuentoIncapacidad += roundCurrency(salarioDiario * porcionNoCubierta);
      }
      // Si porcentaje_patrono >= 100 → no se descuenta nada
    } else {
      // Día laboral sin jornada y sin justificación → ausencia
      diasAusencias++;
      montoDescuentoAusencias += salarioDiario;
    }

    actual = actual.add(1, "day");
  }

  return {
    // Horas adicionales
    totalHorasExtra: roundCurrency(totalHorasExtra),
    totalHorasNocturnas: roundCurrency(totalHorasNocturnas),
    totalHorasFeriado: roundCurrency(totalHorasFeriado),
    // Descuentos
    diasAusencias,
    montoDescuentoAusencias: roundCurrency(montoDescuentoAusencias),
    diasIncapacidad,
    montoDescuentoIncapacidad: roundCurrency(montoDescuentoIncapacidad),
    totalDescuentosDias: roundCurrency(montoDescuentoAusencias + montoDescuentoIncapacidad),
    // Conteos informativos
    diasTrabajados,
    diasFeriado,
    diasVacaciones,
    diasPermisosConGoce,
    diasNoLaborales,
  };
}

/* ─────────────────────────────────────────────────────────────────────
   Desglose línea a línea para el frontend
   ───────────────────────────────────────────────────────────────────── */

function construirDetallesSalario({
  salarioMensual,
  salarioDiario,
  salarioQuincenal,
  tarifaHora,
  duracionTurno,
  diasLaboralesEsperados,
  resumenDias,
  pagoExtra,
  pagoNocturno,
  pagoFeriado,
  bruto,
  renta,
  deduccionesDetalle,
  neto,
}) {
  const lineas = [];

  // ── Información de referencia ──
  lineas.push({
    item: "Salario mensual",
    cantidad: 1,
    unitario: salarioMensual,
    total: salarioMensual,
  });
  lineas.push({
    item: "Salario quincenal (base)",
    cantidad: 1,
    unitario: salarioQuincenal,
    total: salarioQuincenal,
  });
  lineas.push({
    item: "Salario diario (mensual / 30)",
    cantidad: 1,
    unitario: roundCurrency(salarioDiario),
    total: roundCurrency(salarioDiario),
  });
  lineas.push({
    item: "Tarifa por hora (extras/nocturnos/feriados)",
    cantidad: 1,
    unitario: roundCurrency(tarifaHora),
    total: 0,
  });
  lineas.push({
    item: "Duración turno (hrs)",
    cantidad: duracionTurno,
    unitario: 0,
    total: 0,
  });
  lineas.push({
    item: "Días laborales esperados en período",
    cantidad: diasLaboralesEsperados,
    unitario: 0,
    total: 0,
  });

  // ── Desglose de días ──
  lineas.push({
    item: "Días trabajados",
    cantidad: resumenDias.diasTrabajados,
    unitario: 0,
    total: 0,
  });
  if (resumenDias.diasFeriado > 0) {
    lineas.push({
      item: "Feriados no trabajados (pagados)",
      cantidad: resumenDias.diasFeriado,
      unitario: 0,
      total: 0,
    });
  }
  if (resumenDias.diasVacaciones > 0) {
    lineas.push({
      item: "Días de vacaciones (pagados)",
      cantidad: resumenDias.diasVacaciones,
      unitario: 0,
      total: 0,
    });
  }
  if (resumenDias.diasPermisosConGoce > 0) {
    lineas.push({
      item: "Días permiso con goce (pagados)",
      cantidad: resumenDias.diasPermisosConGoce,
      unitario: 0,
      total: 0,
    });
  }

  // ── Descuentos por ausencias ──
  if (resumenDias.diasAusencias > 0) {
    lineas.push({
      item: "Ausencias injustificadas (-)",
      cantidad: resumenDias.diasAusencias,
      unitario: roundCurrency(salarioDiario),
      total: -resumenDias.montoDescuentoAusencias,
    });
  }

  // ── Descuentos por incapacidad (porción no cubierta) ──
  if (resumenDias.diasIncapacidad > 0) {
    lineas.push({
      item: "Incapacidad – porción no cubierta por patrono (-)",
      cantidad: resumenDias.diasIncapacidad,
      unitario: 0,
      total: -resumenDias.montoDescuentoIncapacidad,
    });
  }

  // ── Adicionales ──
  if (resumenDias.totalHorasExtra > 0) {
    lineas.push({
      item: "Horas extra (×1.5)",
      cantidad: resumenDias.totalHorasExtra,
      unitario: roundCurrency(tarifaHora * 1.5),
      total: pagoExtra,
    });
  }

  if (resumenDias.totalHorasNocturnas > 0) {
    lineas.push({
      item: "Horas nocturnas (×0.25 recargo)",
      cantidad: resumenDias.totalHorasNocturnas,
      unitario: roundCurrency(tarifaHora * 0.25),
      total: pagoNocturno,
    });
  }

  if (resumenDias.totalHorasFeriado > 0) {
    lineas.push({
      item: "Horas feriado trabajado (doble paga)",
      cantidad: resumenDias.totalHorasFeriado,
      unitario: roundCurrency(tarifaHora),
      total: pagoFeriado,
    });
  }

  // ── Salario devengado (bruto) ──
  lineas.push({
    item: "SALARIO DEVENGADO (BRUTO)",
    cantidad: 1,
    unitario: 0,
    total: bruto,
  });

  // ── Deducciones (cargas sociales) ──
  for (const ded of deduccionesDetalle) {
    lineas.push({
      item: `${ded.nombre} (${ded.porcentaje}%) (-)`,
      cantidad: 1,
      unitario: 0,
      total: -ded.monto,
    });
  }

  // ── Renta / IR ──
  if (renta.monto_quincenal > 0) {
    lineas.push({
      item: `Impuesto sobre la renta (-) [proyectado mensual: ₡${renta.proyectado_mensual.toLocaleString("es-CR")}]`,
      cantidad: 1,
      unitario: 0,
      total: -renta.monto_quincenal,
    });
  }

  // ── Salario neto ──
  lineas.push({
    item: "SALARIO NETO A PAGAR",
    cantidad: 1,
    unitario: 0,
    total: neto,
  });

  return lineas;
}

/* ─────────────────────────────────────────────────────────────────────
   Handler principal
   ───────────────────────────────────────────────────────────────────── */

/**
 * Genera la planilla quincenal para uno o más colaboradores.
 *
 * @param {{
 *   id_periodo: number,
 *   colaboradores: number[],
 *   generado_por?: number
 * }} payload
 */
export const generarPlanillaQuincenal = (payload = {}) =>
  runInTransaction(async (transaction) => {
    // ── Validar entrada ──
    const periodoId = requirePositiveInt(payload.id_periodo, "id_periodo");
    const generadoPor = payload.generado_por
      ? requirePositiveInt(payload.generado_por, "generado_por")
      : null;

    if (!Array.isArray(payload.colaboradores) || payload.colaboradores.length === 0) {
      throw new Error("Debe seleccionar al menos un colaborador");
    }

    const colaboradores = Array.from(
      new Set(payload.colaboradores.map((v) => requirePositiveInt(v, "colaboradores")))
    );

    // ── Datos globales del período ──
    const periodo = await PeriodoPlanilla.findByPk(periodoId, { transaction });
    if (!periodo) throw new Error(`No existe un periodo de planilla con id ${periodoId}`);

    const fechaInicio = dayjs(periodo.fecha_inicio).format("YYYY-MM-DD");
    const fechaFin = dayjs(periodo.fecha_fin).format("YYYY-MM-DD");

    const estadoActivo = await ensureEstado("ACTIVO", transaction);

    const deduccionesObligatorias = await Deduccion.findAll({
      where: { es_voluntaria: false },
      transaction,
    });

    // Feriados obligatorios del período
    const feriados = await obtenerFeriados({ fechaInicio, fechaFin, transaction });
    const feriadosFechas = new Set(feriados.map((f) => f.fecha));

    const resultados = { generados: [], errores: [] };

    // ── Iterar colaboradores ──
    for (const colaboradorId of colaboradores) {
      try {
        // 1. Contrato activo
        const contrato = await Contrato.findOne({
          where: { id_colaborador: colaboradorId, estado: estadoActivo.id_estado },
          order: [["fecha_inicio", "DESC"]],
          transaction,
        });

        if (!contrato) throw new Error("El colaborador no tiene un contrato activo");

        const salarioMensual = Number(contrato.salario_base);
        if (!Number.isFinite(salarioMensual) || salarioMensual <= 0) {
          throw new Error("El contrato no tiene un salario base mensual válido");
        }

        const horasSemanales = Number(contrato.horas_semanales);
        if (!Number.isFinite(horasSemanales) || horasSemanales <= 0) {
          throw new Error("El contrato no tiene horas semanales válidas");
        }

        // 2. Horario laboral activo
        const horario = await models.HorarioLaboral.findOne({
          where: { id_contrato: contrato.id_contrato, estado: estadoActivo.id_estado },
          attributes: ["hora_inicio", "hora_fin", "dias_laborales", "dias_libres"],
          transaction,
        });

        if (!horario) throw new Error("El contrato no tiene un horario laboral activo");

        // 3. Tarifas
        const salarioQuincenal = roundCurrency(salarioMensual / 2);
        const salarioDiario = calculateDailyRate({ salarioBase: salarioMensual });
        const tarifaHora = calculateHourlyRate({ salarioBase: salarioMensual, horasSemanales });
        const duracionTurno = calcularDuracionTurno(horario.hora_inicio, horario.hora_fin);

        // 4. Días laborales esperados
        const diasLaborales = parseDiasLaborales(horario.dias_libres);
        const diasLaboralesSet = new Set(diasLaborales);
        const diasLaboralesEsperados = calcularDíasLaboralesEsperados({
          fechaInicio,
          fechaFin,
          diasLaborales,
        });

        // 5. Jornadas registradas
        const jornadas = await obtenerJornadas({
          colaboradorId,
          fechaInicio,
          fechaFin,
          transaction,
        });

        // 6. Vacaciones y permisos con goce
        const vacaciones = await obtenerVacacionesAprobadas({
          colaboradorId, fechaInicio, fechaFin, transaction,
        });
        const permisos = await obtenerPermisosConGoce({
          colaboradorId, fechaInicio, fechaFin, transaction,
        });

        const vacacionesFechas = expandirRangoFechas(vacaciones);
        const permisosConGoceFechas = expandirRangoFechas(permisos);

        // 7. Procesar todos los días del período
        const resumenDias = procesarDiasPeriodo({
          fechaInicio,
          fechaFin,
          jornadas,
          feriadosFechas,
          vacacionesFechas,
          permisosConGoceFechas,
          diasLaboralesSet,
          salarioDiario,
        });

        // 8. Calcular montos
        //    Base quincenal FIJA - descuentos + extras = bruto
        const pagoExtra = roundCurrency(resumenDias.totalHorasExtra * tarifaHora * 1.5);
        const pagoNocturno = roundCurrency(resumenDias.totalHorasNocturnas * tarifaHora * 0.25);
        const pagoFeriado = roundCurrency(resumenDias.totalHorasFeriado * tarifaHora);

        const bruto = roundCurrency(
          salarioQuincenal
          - resumenDias.totalDescuentosDias
          + pagoExtra
          + pagoNocturno
          + pagoFeriado
        );

        // 9. Deducciones obligatorias (cargas sociales sobre bruto)
        const { total: totalDeducciones, detalle: deduccionesDetalle } =
          calcularDeduccionesDetallado(bruto, deduccionesObligatorias);

        // 10. Renta con proyección a 30 días
        const renta = calcularRentaProyectada(bruto);

        // 11. Salario neto
        const totalDescuentos = roundCurrency(totalDeducciones + renta.monto_quincenal);
        const neto = Math.max(0, roundCurrency(bruto - totalDescuentos));

        // 12. Desglose para el frontend
        const detalles_calculo = construirDetallesSalario({
          salarioMensual,
          salarioDiario,
          salarioQuincenal,
          tarifaHora,
          duracionTurno,
          diasLaboralesEsperados,
          resumenDias,
          pagoExtra,
          pagoNocturno,
          pagoFeriado,
          bruto,
          renta,
          deduccionesDetalle,
          neto,
        });

        // 13. Persistir en tabla planilla (upsert)
        const existing = await Planilla.findOne({
          where: { id_periodo: periodoId, id_colaborador: colaboradorId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        let detallePlanilla;
        const dataPlanilla = {
          id_contrato: contrato.id_contrato,
          horas_ordinarias: roundDecimal(
            resumenDias.diasTrabajados * duracionTurno
          ),
          horas_extra: roundDecimal(resumenDias.totalHorasExtra),
          horas_nocturnas: roundDecimal(resumenDias.totalHorasNocturnas),
          horas_feriado: roundDecimal(resumenDias.totalHorasFeriado),
          bruto,
          deducciones: totalDescuentos,
          neto,
        };

        if (existing) {
          await existing.update(dataPlanilla, { transaction });
          detallePlanilla = existing;
        } else {
          detallePlanilla = await Planilla.create(
            { id_periodo: periodoId, id_colaborador: colaboradorId, ...dataPlanilla },
            { transaction }
          );
        }

        // 14. Persistir detalle de deducciones
        await DeduccionPlanilla.destroy({
          where: { id_planilla: detallePlanilla.id_detalle },
          transaction,
        });

        for (const ded of deduccionesDetalle) {
          await DeduccionPlanilla.create(
            {
              id_planilla: detallePlanilla.id_detalle,
              id_deduccion: ded.id,
              monto: ded.monto,
            },
            { transaction }
          );
        }

        // 15. Agregar al resultado
        resultados.generados.push({
          id_colaborador: colaboradorId,
          planilla: serializePlanilla({
            ...detallePlanilla.get({ plain: true }),
            ...dataPlanilla,
            generado_por: generadoPor,
          }),
          salario_quincenal_base: salarioQuincenal,
          descuentos_dias: {
            ausencias: {
              dias: resumenDias.diasAusencias,
              monto: resumenDias.montoDescuentoAusencias,
            },
            incapacidad: {
              dias: resumenDias.diasIncapacidad,
              monto: resumenDias.montoDescuentoIncapacidad,
            },
            total: resumenDias.totalDescuentosDias,
          },
          horas_extra: {
            cantidad: resumenDias.totalHorasExtra,
            total: pagoExtra,
          },
          horas_nocturnas: {
            cantidad: resumenDias.totalHorasNocturnas,
            total: pagoNocturno,
          },
          horas_feriado: {
            cantidad: resumenDias.totalHorasFeriado,
            total: pagoFeriado,
          },
          salario_devengado: bruto,
          deducciones_detalle: deduccionesDetalle,
          renta,
          salario_neto: neto,
          detalles_calculo,
        });
      } catch (error) {
        resultados.errores.push({
          id_colaborador: colaboradorId,
          motivo: error.message,
        });
      }
    }

  return resultados;
});
