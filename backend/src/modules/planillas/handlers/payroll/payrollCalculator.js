import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import {
  calculateHourlyRate,
  calculateDailyRate,
  calcularDíasLaboralesEsperados,
  calcularDuracionTurno,
  calcularHorasOrdinariasPagadasFeriadoObligatorio,
  calcularRecargoFeriadoObligatorio,
  calcularRentaProyectada,
  calcularDeduccionesDetallado,
  normalizarFechaFinMesComercial,
} from "../../shared/calculations.js";
import { ensureEstado } from "../../shared/resolvers.js";
import { roundCurrency, roundDecimal } from "../../shared/formatters.js";

dayjs.extend(isSameOrBefore);

const {
  PeriodoPlanilla,
  Colaborador,
  Contrato,
  JornadaDiaria,
  Deduccion,
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

async function obtenerPermisosAprobados({ colaboradorId, fechaInicio, fechaFin, transaction }) {
  return models.SolicitudPermisos.findAll({
    attributes: [
      "id_solicitud",
      "fecha_inicio",
      "fecha_fin",
      "cantidad_dias",
      "cantidad_horas",
      "con_goce_salarial",
    ],
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

function buildPermisoImpactMaps(permisos = []) {
  const permisosConGoceFechas = new Set();
  const permisosSinGoceFechas = new Set();
  const horasPermisoConGoceByDate = new Map();
  const horasPermisoSinGoceByDate = new Map();

  for (const permiso of permisos) {
    const inicio = dayjs(permiso.fecha_inicio);
    const fin = dayjs(permiso.fecha_fin);
    if (!inicio.isValid() || !fin.isValid() || inicio.isAfter(fin)) {
      continue;
    }

    const fechaInicio = inicio.format("YYYY-MM-DD");
    const fechaFin = fin.format("YYYY-MM-DD");
    const esMismoDia = fechaInicio === fechaFin;

    const cantidadDias = Number(permiso.cantidad_dias ?? 0);
    const cantidadHoras = Number(permiso.cantidad_horas ?? 0);
    const esPermisoPorHoras =
      esMismoDia &&
      Number.isFinite(cantidadDias) &&
      cantidadDias > 0 &&
      cantidadDias < 1 &&
      Number.isFinite(cantidadHoras) &&
      cantidadHoras > 0;

    const esConGoce = Boolean(permiso.con_goce_salarial);

    if (esPermisoPorHoras) {
      const targetMap = esConGoce ? horasPermisoConGoceByDate : horasPermisoSinGoceByDate;
      const prev = Number(targetMap.get(fechaInicio) ?? 0);
      targetMap.set(fechaInicio, roundDecimal(prev + cantidadHoras));
      continue;
    }

    let cursor = inicio.clone();
    while (cursor.isSame(fin) || cursor.isBefore(fin)) {
      const dateStr = cursor.format("YYYY-MM-DD");
      if (esConGoce) {
        permisosConGoceFechas.add(dateStr);
      } else {
        permisosSinGoceFechas.add(dateStr);
      }
      cursor = cursor.add(1, "day");
    }
  }

  return {
    permisosConGoceFechas,
    permisosSinGoceFechas,
    horasPermisoConGoceByDate,
    horasPermisoSinGoceByDate,
  };
}

function resolvePermissionHoursForDay({
  horasProgramadasDia,
  horasTrabajadasDia,
  permisoConGoceDiaCompleto,
  permisoSinGoceDiaCompleto,
  horasPermisoConGoceDia,
  horasPermisoSinGoceDia,
}) {
  const horasProgramadas = Math.max(Number(horasProgramadasDia ?? 0), 0);
  const horasTrabajadas = Math.min(Math.max(Number(horasTrabajadasDia ?? 0), 0), horasProgramadas);

  let horasPendientes = Math.max(horasProgramadas - horasTrabajadas, 0);

  const horasConGoceSolicitadas = permisoConGoceDiaCompleto
    ? horasProgramadas
    : Math.max(Number(horasPermisoConGoceDia ?? 0), 0);
  const horasConGoceAplicadas = Math.min(horasConGoceSolicitadas, horasPendientes);
  horasPendientes = Math.max(horasPendientes - horasConGoceAplicadas, 0);

  const horasSinGoceSolicitadas = permisoSinGoceDiaCompleto
    ? horasProgramadas
    : Math.max(Number(horasPermisoSinGoceDia ?? 0), 0);
  const horasSinGoceAplicadas = Math.min(horasSinGoceSolicitadas, horasPendientes);
  horasPendientes = Math.max(horasPendientes - horasSinGoceAplicadas, 0);

  return {
    horasTrabajadas,
    horasConGoceAplicadas,
    horasSinGoceAplicadas,
    horasAusenciaInjustificada: horasPendientes,
    horasPagadas: horasTrabajadas + horasConGoceAplicadas,
  };
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
   ───────────────────────────────────────────────────────────────────── */

function procesarDiasPeriodo({
  fechaInicio,
  fechaFin,
  jornadas,
  feriadosFechas,
  vacacionesFechas,
  permisoImpact,
  diasLaboralesSet,
  duracionTurno,
  tarifaHora,
}) {
  const jornadaMap = new Map(jornadas.map((j) => [j.fecha, j]));
  const {
    permisosConGoceFechas,
    permisosSinGoceFechas,
    horasPermisoConGoceByDate,
    horasPermisoSinGoceByDate,
  } = permisoImpact;

  let totalHorasOrdinariasProgramadas = 0;
  let totalHorasOrdinariasPagadas = 0;
  let totalHorasOrdinariasTrabajadas = 0;
  let totalHorasVacacionesPagadas = 0;
  let totalHorasPermisosConGocePagadas = 0;
  let totalHorasFeriadoPagadoNoTrabajado = 0;
  let totalHorasIncapacidadCubiertas = 0;
  let totalHorasAusenciaInjustificada = 0;
  let totalHorasIncapacidadNoCubiertas = 0;

  let totalHorasExtra = 0;
  let totalHorasNocturnas = 0;
  let totalHorasFeriado = 0;

  let diasAusencias = 0;
  let diasIncapacidad = 0;
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
    const dayOfWeek = (actual.day() + 6) % 7;
    const esLaboral = diasLaboralesSet.has(dayOfWeek);

    if (jornada) {
      totalHorasExtra += Number(jornada.horas_extra ?? 0);
      totalHorasNocturnas += Number(jornada.horas_nocturnas ?? 0);
    }

    if (!esLaboral) {
      diasNoLaborales++;
      actual = actual.add(1, "day");
      continue;
    }

    const horasProgramadasDia = Math.max(Number(duracionTurno ?? 0), 0);
    const horasTrabajadasDia = Math.min(
      Math.max(Number(jornada?.horas_ordinarias ?? 0), 0),
      horasProgramadasDia
    );

    const esFeriado = feriadosFechas.has(fechaStr);

    if (!esFeriado) {
      totalHorasOrdinariasProgramadas += horasProgramadasDia;
    }

    const tieneVacaciones = vacacionesFechas.has(fechaStr) || Boolean(jornada?.id_vacaciones);
    const permisoConGoceDiaCompleto = permisosConGoceFechas.has(fechaStr);
    const permisoSinGoceDiaCompleto = permisosSinGoceFechas.has(fechaStr);
    const horasPermisoConGoceDia = Number(horasPermisoConGoceByDate.get(fechaStr) ?? 0);
    const horasPermisoSinGoceDia = Number(horasPermisoSinGoceByDate.get(fechaStr) ?? 0);
    const tieneIncapacidad = Boolean(jornada?.id_incapacidad && jornada?.incapacidad_data);

    if (esFeriado) {
      totalHorasOrdinariasPagadas +=
        calcularHorasOrdinariasPagadasFeriadoObligatorio(horasProgramadasDia);

      if (horasTrabajadasDia > 0) {
        diasTrabajados++;
        totalHorasFeriado += horasTrabajadasDia;
      } else {
        diasFeriado++;
        totalHorasFeriadoPagadoNoTrabajado += horasProgramadasDia;
      }

      actual = actual.add(1, "day");
      continue;
    }

    if (!jornada) {
      if (tieneVacaciones) {
        diasVacaciones++;
        totalHorasOrdinariasPagadas += horasProgramadasDia;
        totalHorasVacacionesPagadas += horasProgramadasDia;
      } else {
        const distribucion = resolvePermissionHoursForDay({
          horasProgramadasDia,
          horasTrabajadasDia: 0,
          permisoConGoceDiaCompleto,
          permisoSinGoceDiaCompleto,
          horasPermisoConGoceDia,
          horasPermisoSinGoceDia,
        });

        if (distribucion.horasConGoceAplicadas > 0) {
          diasPermisosConGoce++;
          totalHorasPermisosConGocePagadas += distribucion.horasConGoceAplicadas;
        }

        totalHorasOrdinariasPagadas += distribucion.horasPagadas;

        if (distribucion.horasAusenciaInjustificada > 0 || distribucion.horasSinGoceAplicadas > 0) {
          diasAusencias++;
          totalHorasAusenciaInjustificada +=
            distribucion.horasAusenciaInjustificada + distribucion.horasSinGoceAplicadas;
        }
      }

      actual = actual.add(1, "day");
      continue;
    }

    if (tieneVacaciones) {
      diasVacaciones++;
      totalHorasOrdinariasPagadas += horasProgramadasDia;
      totalHorasVacacionesPagadas += horasProgramadasDia;
      actual = actual.add(1, "day");
      continue;
    }

    if (tieneIncapacidad) {
      const porcentajePatrono = Math.max(
        0,
        Math.min(Number(jornada.incapacidad_data?.porcentaje_patrono ?? 0), 100)
      );

      const horasFaltantes = Math.max(horasProgramadasDia - horasTrabajadasDia, 0);
      const horasCubiertas = roundDecimal((horasFaltantes * porcentajePatrono) / 100);
      const horasNoCubiertas = roundDecimal(Math.max(horasFaltantes - horasCubiertas, 0));

      diasIncapacidad++;

      if (horasTrabajadasDia > 0) {
        diasTrabajados++;
        totalHorasOrdinariasTrabajadas += horasTrabajadasDia;
      }

      totalHorasOrdinariasPagadas += horasTrabajadasDia + horasCubiertas;
      totalHorasIncapacidadCubiertas += horasCubiertas;
      totalHorasIncapacidadNoCubiertas += horasNoCubiertas;

      actual = actual.add(1, "day");
      continue;
    }

    const distribucion = resolvePermissionHoursForDay({
      horasProgramadasDia,
      horasTrabajadasDia,
      permisoConGoceDiaCompleto,
      permisoSinGoceDiaCompleto,
      horasPermisoConGoceDia,
      horasPermisoSinGoceDia,
    });

    if (distribucion.horasTrabajadas > 0) {
      diasTrabajados++;
      totalHorasOrdinariasTrabajadas += distribucion.horasTrabajadas;
    }

    if (distribucion.horasConGoceAplicadas > 0) {
      diasPermisosConGoce++;
      totalHorasPermisosConGocePagadas += distribucion.horasConGoceAplicadas;
    }

    totalHorasOrdinariasPagadas += distribucion.horasPagadas;

    if (distribucion.horasAusenciaInjustificada > 0 || distribucion.horasSinGoceAplicadas > 0) {
      diasAusencias++;
      totalHorasAusenciaInjustificada +=
        distribucion.horasAusenciaInjustificada + distribucion.horasSinGoceAplicadas;
    }

    actual = actual.add(1, "day");
  }

  const montoDescuentoAusencias = roundCurrency(totalHorasAusenciaInjustificada * tarifaHora);
  const montoDescuentoIncapacidad = roundCurrency(totalHorasIncapacidadNoCubiertas * tarifaHora);
  const totalDescuentosDias = roundCurrency(montoDescuentoAusencias + montoDescuentoIncapacidad);

  return {
    totalHorasOrdinariasProgramadas: roundDecimal(totalHorasOrdinariasProgramadas),
    totalHorasOrdinariasPagadas: roundDecimal(totalHorasOrdinariasPagadas),
    totalHorasOrdinariasTrabajadas: roundDecimal(totalHorasOrdinariasTrabajadas),
    totalHorasVacacionesPagadas: roundDecimal(totalHorasVacacionesPagadas),
    totalHorasPermisosConGocePagadas: roundDecimal(totalHorasPermisosConGocePagadas),
    totalHorasFeriadoPagadoNoTrabajado: roundDecimal(totalHorasFeriadoPagadoNoTrabajado),
    totalHorasIncapacidadCubiertas: roundDecimal(totalHorasIncapacidadCubiertas),
    totalHorasAusenciaInjustificada: roundDecimal(totalHorasAusenciaInjustificada),
    totalHorasIncapacidadNoCubiertas: roundDecimal(totalHorasIncapacidadNoCubiertas),
    totalHorasNoPagadas: roundDecimal(
      totalHorasAusenciaInjustificada + totalHorasIncapacidadNoCubiertas
    ),
    salarioOrdinarioProgramado: roundCurrency(totalHorasOrdinariasProgramadas * tarifaHora),
    salarioOrdinario: roundCurrency(totalHorasOrdinariasPagadas * tarifaHora),

    totalHorasExtra: roundDecimal(totalHorasExtra),
    totalHorasNocturnas: roundDecimal(totalHorasNocturnas),
    totalHorasFeriado: roundDecimal(totalHorasFeriado),

    diasAusencias,
    montoDescuentoAusencias,
    diasIncapacidad,
    montoDescuentoIncapacidad,
    totalDescuentosDias,

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
  salarioOrdinarioQuincenal,
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

  lineas.push({ item: "Salario mensual", cantidad: 1, unitario: salarioMensual, total: salarioMensual });
  lineas.push({
    item: "Salario quincenal teórico (referencia)",
    cantidad: 1,
    unitario: salarioQuincenal,
    total: salarioQuincenal,
  });
  lineas.push({
    item: "Salario quincenal base aplicado",
    cantidad: 1,
    unitario: salarioQuincenal,
    total: salarioQuincenal,
  });
  if (resumenDias.totalDescuentosDias > 0) {
    lineas.push({
      item: "Descuentos por ausencias/incapacidad no cubierta/permisos sin goce (-)",
      cantidad: 1,
      unitario: 0,
      total: -resumenDias.totalDescuentosDias,
    });
  }
  lineas.push({
    item: "Salario ordinario quincenal ajustado",
    cantidad: 1,
    unitario: 0,
    total: salarioOrdinarioQuincenal,
  });
  lineas.push({
    item: "Salario diario (mensual / 30) [referencia]",
    cantidad: 1,
    unitario: roundCurrency(salarioDiario),
    total: roundCurrency(salarioDiario),
  });
  lineas.push({
    item: "Tarifa por hora (ordinarias/extras/nocturnos/feriados)",
    cantidad: 1,
    unitario: roundCurrency(tarifaHora),
    total: 0,
  });
  lineas.push({ item: "Duración turno (hrs)", cantidad: duracionTurno, unitario: 0, total: 0 });
  lineas.push({
    item: "Días laborales esperados en período",
    cantidad: diasLaboralesEsperados,
    unitario: 0,
    total: 0,
  });

  lineas.push({
    item: "Horas ordinarias programadas en período [referencia]",
    cantidad: resumenDias.totalHorasOrdinariasProgramadas,
    unitario: roundCurrency(tarifaHora),
    total: 0,
  });
  lineas.push({
    item: "Horas ordinarias pagadas/efectivas",
    cantidad: resumenDias.totalHorasOrdinariasPagadas,
    unitario: 0,
    total: 0,
  });

  if (resumenDias.diasTrabajados > 0) {
    lineas.push({
      item: "Días con jornada trabajada",
      cantidad: resumenDias.diasTrabajados,
      unitario: 0,
      total: 0,
    });
  }

  if (resumenDias.totalHorasOrdinariasTrabajadas > 0) {
    lineas.push({
      item: "Horas ordinarias trabajadas",
      cantidad: resumenDias.totalHorasOrdinariasTrabajadas,
      unitario: 0,
      total: 0,
    });
  }

  if (resumenDias.diasFeriado > 0) {
    lineas.push({
      item: "Feriados obligatorios no laborados (pagados en ordinarias)",
      cantidad: resumenDias.diasFeriado,
      unitario: 0,
      total: 0,
    });
  }

  if (resumenDias.totalHorasFeriadoPagadoNoTrabajado > 0) {
    lineas.push({
      item: "Feriado obligatorio no laborado (hrs incluidas en ordinarias)",
      cantidad: resumenDias.totalHorasFeriadoPagadoNoTrabajado,
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

  if (resumenDias.totalHorasVacacionesPagadas > 0) {
    lineas.push({
      item: "Vacaciones pagadas (hrs)",
      cantidad: resumenDias.totalHorasVacacionesPagadas,
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

  if (resumenDias.totalHorasPermisosConGocePagadas > 0) {
    lineas.push({
      item: "Permisos con goce pagados (hrs)",
      cantidad: resumenDias.totalHorasPermisosConGocePagadas,
      unitario: 0,
      total: 0,
    });
  }

  if (resumenDias.diasIncapacidad > 0) {
    lineas.push({
      item: "Días con incapacidad",
      cantidad: resumenDias.diasIncapacidad,
      unitario: 0,
      total: 0,
    });
  }

  if (resumenDias.totalHorasIncapacidadCubiertas > 0) {
    lineas.push({
      item: "Horas incapacidad cubiertas por patrono",
      cantidad: resumenDias.totalHorasIncapacidadCubiertas,
      unitario: 0,
      total: 0,
    });
  }

  if (resumenDias.totalHorasAusenciaInjustificada > 0) {
    lineas.push({
      item: "Ausencias injustificadas (-)",
      cantidad: resumenDias.totalHorasAusenciaInjustificada,
      unitario: roundCurrency(tarifaHora),
      total: -resumenDias.montoDescuentoAusencias,
    });
  }

  if (resumenDias.totalHorasIncapacidadNoCubiertas > 0) {
    lineas.push({
      item: "Incapacidad – horas no cubiertas por patrono (-)",
      cantidad: resumenDias.totalHorasIncapacidadNoCubiertas,
      unitario: roundCurrency(tarifaHora),
      total: -resumenDias.montoDescuentoIncapacidad,
    });
  }

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
      item: "Recargo por feriado obligatorio trabajado (+1.0x)",
      cantidad: resumenDias.totalHorasFeriado,
      unitario: roundCurrency(tarifaHora),
      total: pagoFeriado,
    });
  }

  lineas.push({ item: "SALARIO DEVENGADO (BRUTO)", cantidad: 1, unitario: 0, total: bruto });

  for (const ded of deduccionesDetalle) {
    lineas.push({
      item: `${ded.nombre} (${ded.porcentaje}%) (-)`,
      cantidad: 1,
      unitario: 0,
      total: -ded.monto,
    });
  }

  const impuestoQuincenalSinCreditos = roundCurrency(
    Number(
      renta.impuesto_quincenal_sin_creditos
      ?? (Number(renta.impuesto_mensual ?? 0) / 2)
      ?? 0
    )
  );
  const creditoConyugeQuincenal = roundCurrency(
    Number(renta.creditos_fiscales?.por_conyuge_quincenal ?? 0)
  );
  const creditoHijosQuincenal = roundCurrency(
    Number(renta.creditos_fiscales?.por_hijos_quincenal ?? 0)
  );
  const hayCreditosAplicados = creditoConyugeQuincenal > 0 || creditoHijosQuincenal > 0;

  if (impuestoQuincenalSinCreditos > 0) {
    lineas.push({
      item: `Impuesto sobre la renta (-) [proyectado mensual: ₡${renta.proyectado_mensual.toLocaleString("es-CR")}]`,
      cantidad: 1,
      unitario: 0,
      total: -impuestoQuincenalSinCreditos,
    });
  }

  if (creditoConyugeQuincenal > 0) {
    lineas.push({
      item: "Crédito fiscal por cónyuge (+)",
      cantidad: 1,
      unitario: 0,
      total: creditoConyugeQuincenal,
    });
  }

  if (creditoHijosQuincenal > 0) {
    lineas.push({
      item: "Crédito fiscal por hijos (+)",
      cantidad: 1,
      unitario: 0,
      total: creditoHijosQuincenal,
    });
  }

  if (impuestoQuincenalSinCreditos > 0 || creditoConyugeQuincenal > 0 || creditoHijosQuincenal > 0) {
    lineas.push({
      item: hayCreditosAplicados
        ? "Impuesto sobre la renta con créditos fiscales aplicados (-)"
        : "Impuesto sobre la renta final (-)",
      cantidad: 1,
      unitario: 0,
      total: -roundCurrency(renta.monto_quincenal),
    });
  }

  lineas.push({ item: "SALARIO NETO A PAGAR", cantidad: 1, unitario: 0, total: neto });

  return lineas;
}

/* ─────────────────────────────────────────────────────────────────────
   Cálculo puro para un colaborador (sin persistencia)
   ───────────────────────────────────────────────────────────────────── */

/**
 * Calcula la planilla quincenal de un colaborador dado un período.
 * Retorna todos los datos calculados sin escribir en BD.
 *
 * @param {{
 *   colaboradorId: number,
 *   periodoId: number,
 *   fechaInicio: string,
 *   fechaFin: string,
 *   feriadosFechas: Set<string>,
 *   deduccionesObligatorias: Array,
 *   estadoActivo: { id_estado: number },
 *   transaction?: import("sequelize").Transaction
 * }} params
 * @returns {Promise<object>} Resultado calculado con desglose completo
 */
export async function calcularPlanillaColaborador({
  colaboradorId,
  periodoId,
  fechaInicio,
  fechaFin,
  feriadosFechas,
  deduccionesObligatorias,
  estadoActivo,
  transaction,
}) {
  // 1. Contrato activo
  const contrato = await Contrato.findOne({
    where: {
      id_colaborador: colaboradorId,
      estado: estadoActivo.id_estado,
      fecha_inicio: { [Op.lt]: fechaInicio },
    },
    order: [["fecha_inicio", "DESC"]],
    transaction,
  });

  if (!contrato) throw new Error("El colaborador no tiene un contrato activo");

  const colaborador = await Colaborador.findByPk(colaboradorId, {
    attributes: ["id_colaborador", "cantidad_hijos", "estado_civil"],
    include: [
      {
        association: "estadoCivilRef",
        attributes: ["estado_civil"],
        required: false,
      },
    ],
    transaction,
  });

  if (!colaborador) {
    throw new Error("No se encontró el colaborador para calcular la planilla");
  }

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
  const permisos = await obtenerPermisosAprobados({
    colaboradorId, fechaInicio, fechaFin, transaction,
  });

  const vacacionesFechas = expandirRangoFechas(vacaciones);
  const permisoImpact = buildPermisoImpactMaps(permisos);

  // 7. Procesar todos los días del período
  const resumenDias = procesarDiasPeriodo({
    fechaInicio,
    fechaFin,
    jornadas,
    feriadosFechas,
    vacacionesFechas,
    permisoImpact,
    diasLaboralesSet,
    duracionTurno,
    tarifaHora,
  });

  // 8. Calcular montos
  const pagoExtra = roundCurrency(resumenDias.totalHorasExtra * tarifaHora * 1.5);
  const pagoNocturno = roundCurrency(resumenDias.totalHorasNocturnas * tarifaHora * 0.25);
  const pagoFeriado = calcularRecargoFeriadoObligatorio({
    horasTrabajadasFeriado: resumenDias.totalHorasFeriado,
    tarifaHora,
  });

  const salarioOrdinarioQuincenal = roundCurrency(
    Math.max(0, salarioQuincenal - resumenDias.totalDescuentosDias)
  );

  const bruto = roundCurrency(
    salarioOrdinarioQuincenal
    + pagoExtra
    + pagoNocturno
    + pagoFeriado
  );

  // 9. Deducciones obligatorias (cargas sociales)
  const { total: totalDeducciones, detalle: deduccionesDetalle } =
    calcularDeduccionesDetallado(bruto, deduccionesObligatorias);

  // 10. Renta
  const renta = calcularRentaProyectada(bruto, {
    cantidad_hijos: colaborador.cantidad_hijos,
    estado_civil: colaborador.estadoCivilRef?.estado_civil,
  });

  // 11. Salario neto
  const totalDescuentosSinCreditos = roundCurrency(
    totalDeducciones + roundCurrency(Number(renta.impuesto_quincenal_sin_creditos ?? 0))
  );
  const totalDescuentos = roundCurrency(totalDeducciones + renta.monto_quincenal);
  const neto = Math.max(0, roundCurrency(bruto - totalDescuentos));

  // 12. Desglose para el frontend
  const detalles_calculo = construirDetallesSalario({
    salarioMensual,
    salarioDiario,
    salarioQuincenal,
    salarioOrdinarioQuincenal,
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

  return {
    id_colaborador: colaboradorId,
    id_contrato: contrato.id_contrato,
    salarioMensual,
    salarioQuincenal,
    salarioDiario,
    tarifaHora,
    duracionTurno,
    diasLaboralesEsperados,
    salarioOrdinarioProgramado: resumenDias.salarioOrdinarioProgramado,
    salarioOrdinario: salarioOrdinarioQuincenal,
    resumenDias,
    pagoExtra,
    pagoNocturno,
    pagoFeriado,
    bruto,
    totalDeducciones,
    deduccionesDetalle,
    totalDescuentosSinCreditos,
    totalDescuentos,
    renta,
    neto,
    detalles_calculo,
    dataPlanilla: {
      id_contrato: contrato.id_contrato,
      horas_ordinarias: roundDecimal(resumenDias.totalHorasOrdinariasPagadas),
      horas_extra: roundDecimal(resumenDias.totalHorasExtra),
      horas_nocturnas: roundDecimal(resumenDias.totalHorasNocturnas),
      horas_feriado: roundDecimal(resumenDias.totalHorasFeriado),
      bruto,
      deducciones: totalDescuentos,
      neto,
    },
  };
}

/**
 * Carga datos globales del período (período, feriados, deducciones, estado activo).
 * Reutilizable tanto por simulación como por creación.
 *
 * @param {{ periodoId: number, transaction?: import("sequelize").Transaction }} params
 * @returns {Promise<{ periodo, fechaInicio, fechaFin, feriadosFechas, deduccionesObligatorias, estadoActivo }>}
 */
export async function cargarDatosGlobalesPeriodo({ periodoId, transaction }) {
  const periodo = await PeriodoPlanilla.findByPk(periodoId, { transaction });
  if (!periodo) throw new Error(`No existe un periodo de planilla con id ${periodoId}`);

  const fechaInicio = dayjs(periodo.fecha_inicio).format("YYYY-MM-DD");
  const fechaFinPeriodo = dayjs(periodo.fecha_fin).format("YYYY-MM-DD");
  const fechaFin = normalizarFechaFinMesComercial(fechaFinPeriodo);

  const estadoActivo = await ensureEstado("ACTIVO", transaction);

  const deduccionesObligatorias = await Deduccion.findAll({
    where: { es_voluntaria: false },
    transaction,
  });

  const feriados = await obtenerFeriados({ fechaInicio, fechaFin, transaction });
  const feriadosFechas = new Set(feriados.map((f) => f.fecha));

  return {
    periodo,
    fechaInicio,
    fechaFin,
    feriadosFechas,
    deduccionesObligatorias,
    estadoActivo,
  };
}
