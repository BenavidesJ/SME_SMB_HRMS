import dayjs from "dayjs";
import { Op } from "sequelize";
import { models, sequelize } from "../models/index.js";

const {
  Colaborador,
  Usuario,
  Rol,
  Estado,
  EstadoCivil,
  Contrato,
  HorarioLaboral,
  Direccion,
  JornadaDiaria,
  SaldoVacaciones,
  SolicitudVacaciones,
  SolicitudPermisos,
  TipoIncapacidad,
  Incapacidad,
} = models;

function listDatesInclusive(startStr, endStr) {
  const start = dayjs(startStr, "YYYY-MM-DD", true);
  const end = dayjs(endStr, "YYYY-MM-DD", true);
  const dates = [];

  let cursor = start;
  while (cursor.isBefore(end) || cursor.isSame(end)) {
    dates.push(cursor.format("YYYY-MM-DD"));
    cursor = cursor.add(1, "day");
  }

  return dates;
}

export async function seedSuperAdmin() {
  const t = await sequelize.transaction();
  try {
    let estadoActivo = await Estado.findOne({
      where: { estado: "ACTIVO" },
      transaction: t,
    });

    if (!estadoActivo) {
      const maxId = Number(await Estado.max("id_estado", { transaction: t })) || 0;
      estadoActivo = await Estado.create(
        { id_estado: maxId + 1, estado: "ACTIVO" },
        { transaction: t }
      );
    }

    const [estadoCivil] = await EstadoCivil.findOrCreate({
      where: { estado_civil: "CASADO" },
      defaults: { estado_civil: "CASADO" },
      transaction: t,
    });

    const [colab] = await Colaborador.findOrCreate({
      where: { identificacion: 115050783 },
      defaults: {
        nombre: "Jose Daniel",
        primer_apellido: "Benavides",
        segundo_apellido: "Obando",
        fecha_nacimiento: "1992-07-01",
        correo_electronico: "jdanielbenavides@hotmail.com",
        telefono: "70192643",
        fecha_ingreso: new Date(),
        cantidad_hijos: false,
        estado_civil: estadoCivil.id_estado_civil,
        estado: estadoActivo.id_estado,
      },
      transaction: t,
    });

    await colab.update(
      {
        correo_electronico: "jdanielbenavides@hotmail.com",
        telefono: "70192643",
        estado_civil: estadoCivil.id_estado_civil,
        estado: estadoActivo.id_estado,
      },
      { transaction: t },
    );

    const username = "jbenavides0783";
    const passwordHash =
      "$2b$10$p2kovfeKLi/4sZ/A54pos.7E5RUcAXcuFXfS5MZ4keJB4Brz0bdNC";

    const [user] = await Usuario.findOrCreate({
      where: { username },
      defaults: {
        username,
        contrasena_hash: passwordHash,
        requiere_cambio_contrasena: false,
        id_colaborador: colab.id_colaborador,
        estado: estadoActivo.id_estado,
      },
      transaction: t,
    });

    await user.update(
      {
        id_colaborador: colab.id_colaborador,
        estado: estadoActivo.id_estado,
      },
      { transaction: t },
    );

    await Rol.findOrCreate({
      where: { id_usuario: user.id_usuario, nombre: "SUPER_ADMIN" },
      defaults: { id_usuario: user.id_usuario, nombre: "SUPER_ADMIN" },
      transaction: t,
    });

    await Direccion.upsert(
      {
        id_direccion: 2,
        id_colaborador: colab.id_colaborador,
        id_provincia: 1,
        id_canton: 115,
        id_distrito: 10203,
        otros_datos: "Cerro Vista Ap 4A",
        es_principal: 1,
      },
      { transaction: t },
    );

    const [contrato] = await Contrato.findOrCreate({
      where: { id_contrato: 5 },
      defaults: {
        id_contrato: 5,
        id_colaborador: colab.id_colaborador,
        id_puesto: 2,
        fecha_inicio: "2026-01-04",
        id_tipo_contrato: 1,
        id_tipo_jornada: 1,
        horas_semanales: "40.00",
        salario_base: "3000000.00",
        id_ciclo_pago: 1,
        estado: estadoActivo.id_estado,
      },
      transaction: t,
    });

    await contrato.update(
      {
        id_colaborador: colab.id_colaborador,
        id_puesto: 2,
        fecha_inicio: "2026-01-04",
        id_tipo_contrato: 1,
        id_tipo_jornada: 1,
        horas_semanales: "40.00",
        salario_base: "3000000.00",
        id_ciclo_pago: 1,
        estado: estadoActivo.id_estado,
      },
      { transaction: t },
    );

    await HorarioLaboral.upsert(
      {
        id_horario: 2,
        id_contrato: contrato.id_contrato,
        hora_inicio: "08:00:00",
        hora_fin: "17:00:00",
        minutos_descanso: 60,
        dias_laborales: "LKMJVS",
        dias_libres: "D",
        estado: estadoActivo.id_estado,
        fecha_actualizacion: "2026-01-04",
        id_tipo_jornada: 1,
      },
      { transaction: t },
    );

    const estadoAprobado = await Estado.findOne({
      where: { estado: "APROBADO" },
      transaction: t,
    });

    if (!estadoAprobado) {
      throw new Error("No se pudo obtener el estado APROBADO");
    }

    const estadoAprobadoId = Number(estadoAprobado.id_estado);

    const [tipoIncapCcss] = await TipoIncapacidad.findOrCreate({
      where: { nombre: "CCSS" },
      defaults: { nombre: "CCSS" },
      transaction: t,
    });

    const [saldoVacaciones] = await SaldoVacaciones.findOrCreate({
      where: { id_colaborador: colab.id_colaborador },
      defaults: { dias_ganados: 15, dias_tomados: 0 },
      transaction: t,
    });

    const requiredSaldoUpdates = {};
    const saldoGanadoActual = Number(saldoVacaciones.dias_ganados ?? 0);
    const saldoTomadoActual = Number(saldoVacaciones.dias_tomados ?? 0);

    if (saldoGanadoActual < 15) {
      requiredSaldoUpdates.dias_ganados = 15;
    }

    if (saldoTomadoActual < 5) {
      requiredSaldoUpdates.dias_tomados = 5;
    }

    if (Object.keys(requiredSaldoUpdates).length > 0) {
      await saldoVacaciones.update(requiredSaldoUpdates, { transaction: t });
    }

    const vacacionesInicio = "2026-04-06";
    const vacacionesFin = "2026-04-10";
    const [solicitudVacaciones] = await SolicitudVacaciones.findOrCreate({
      where: {
        id_colaborador: colab.id_colaborador,
        fecha_inicio: vacacionesInicio,
        fecha_fin: vacacionesFin,
      },
      defaults: {
        id_colaborador: colab.id_colaborador,
        id_aprobador: colab.id_colaborador,
        estado_solicitud: estadoAprobadoId,
        fecha_inicio: vacacionesInicio,
        fecha_fin: vacacionesFin,
        id_saldo_vacaciones: Number(saldoVacaciones.id_saldo_vac),
      },
      transaction: t,
    });

    const updateVacacionesPayload = {};
    if (Number(solicitudVacaciones.estado_solicitud) !== estadoAprobadoId) {
      updateVacacionesPayload.estado_solicitud = estadoAprobadoId;
    }
    if (Number(solicitudVacaciones.id_aprobador) !== colab.id_colaborador) {
      updateVacacionesPayload.id_aprobador = colab.id_colaborador;
    }
    if (Number(solicitudVacaciones.id_saldo_vacaciones) !== Number(saldoVacaciones.id_saldo_vac)) {
      updateVacacionesPayload.id_saldo_vacaciones = Number(saldoVacaciones.id_saldo_vac);
    }
    if (Object.keys(updateVacacionesPayload).length > 0) {
      await solicitudVacaciones.update(updateVacacionesPayload, { transaction: t });
    }

    const permisosPlan = [
      {
        inicio: "2026-04-13",
        fin: "2026-04-15",
        conGoce: false,
      },
      {
        inicio: "2026-04-16",
        fin: "2026-04-17",
        conGoce: true,
      },
    ];

    const permisoPorFecha = new Map();

    for (const plan of permisosPlan) {
      const fechas = listDatesInclusive(plan.inicio, plan.fin);
      const dias = fechas.length;
      const horas = dias * 8;

      const [solicitudPermiso] = await SolicitudPermisos.findOrCreate({
        where: {
          id_colaborador: colab.id_colaborador,
          fecha_inicio: plan.inicio,
          fecha_fin: plan.fin,
        },
        defaults: {
          id_colaborador: colab.id_colaborador,
          id_aprobador: colab.id_colaborador,
          estado_solicitud: estadoAprobadoId,
          fecha_inicio: plan.inicio,
          fecha_fin: plan.fin,
          con_goce_salarial: plan.conGoce,
          cantidad_horas: horas,
          cantidad_dias: dias,
        },
        transaction: t,
      });

      const updatePermisoPayload = {};
      if (Number(solicitudPermiso.estado_solicitud) !== estadoAprobadoId) {
        updatePermisoPayload.estado_solicitud = estadoAprobadoId;
      }
      if (Number(solicitudPermiso.id_aprobador) !== colab.id_colaborador) {
        updatePermisoPayload.id_aprobador = colab.id_colaborador;
      }
      if (solicitudPermiso.con_goce_salarial !== plan.conGoce) {
        updatePermisoPayload.con_goce_salarial = plan.conGoce;
      }
      if (Number(solicitudPermiso.cantidad_horas) !== horas) {
        updatePermisoPayload.cantidad_horas = horas;
      }
      if (Number(solicitudPermiso.cantidad_dias) !== dias) {
        updatePermisoPayload.cantidad_dias = dias;
      }
      if (Object.keys(updatePermisoPayload).length > 0) {
        await solicitudPermiso.update(updatePermisoPayload, { transaction: t });
      }

      for (const fecha of fechas) {
        permisoPorFecha.set(fecha, Number(solicitudPermiso.id_solicitud));
      }
    }

    const incapacidadFechas = listDatesInclusive("2026-03-09", "2026-03-13");
    const incapacidadIdsPorFecha = new Map();

    const jornadasExistentes = await JornadaDiaria.findAll({
      where: {
        id_colaborador: colab.id_colaborador,
        fecha: {
          [Op.between]: ["2026-01-05", "2026-05-31"],
        },
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const jornadasPorFecha = new Map();
    for (const jornada of jornadasExistentes) {
      jornadasPorFecha.set(String(jornada.fecha), jornada);
    }

    let incapacidadDiaContador = 0;
    for (const fecha of incapacidadFechas) {
      const jornadaExistente = jornadasPorFecha.get(fecha);
      if (jornadaExistente?.incapacidad) {
        incapacidadIdsPorFecha.set(fecha, Number(jornadaExistente.incapacidad));
        continue;
      }

      incapacidadDiaContador += 1;
      const porcentaje_patrono = incapacidadDiaContador <= 3 ? 50 : 0;
      const porcentaje_ccss = incapacidadDiaContador <= 3 ? 50 : 60;

      const incapacidadCreada = await Incapacidad.create(
        {
          id_tipo_incap: Number(tipoIncapCcss.id_tipo_incap),
          porcentaje_patrono,
          porcentaje_ccss,
        },
        { transaction: t },
      );

      incapacidadIdsPorFecha.set(fecha, Number(incapacidadCreada.id_incapacidad));
    }

    for (const fecha of incapacidadFechas) {
      if (!incapacidadIdsPorFecha.has(fecha)) {
        const jornadaExistente = jornadasPorFecha.get(fecha);
        if (jornadaExistente?.incapacidad) {
          incapacidadIdsPorFecha.set(fecha, Number(jornadaExistente.incapacidad));
        }
      }
    }

    const vacacionesFechas = new Set(listDatesInclusive(vacacionesInicio, vacacionesFin));
    const incapacidadFechasSet = new Set(incapacidadFechas);

    const contractStart = dayjs(String(contrato.fecha_inicio)).startOf("day");
    let cursor = dayjs("2026-01-05");
    const cursorFin = dayjs("2026-05-31");

    while (cursor.isBefore(cursorFin) || cursor.isSame(cursorFin)) {
      if (cursor.isBefore(contractStart)) {
        cursor = cursor.add(1, "day");
        continue;
      }

      if (cursor.day() === 0) {
        cursor = cursor.add(1, "day");
        continue;
      }

      const fecha = cursor.format("YYYY-MM-DD");
      const jornadaExistente = jornadasPorFecha.get(fecha);
      const payload = {
        id_colaborador: colab.id_colaborador,
        fecha,
        horas_ordinarias: 0,
        horas_extra: 0,
        horas_nocturnas: 0,
        incapacidad: null,
        vacaciones: null,
        permiso: null,
      };

      if (incapacidadFechasSet.has(fecha)) {
        payload.incapacidad = incapacidadIdsPorFecha.get(fecha) ?? null;
      } else if (vacacionesFechas.has(fecha)) {
        payload.vacaciones = Number(solicitudVacaciones.id_solicitud_vacaciones);
      } else if (permisoPorFecha.has(fecha)) {
        payload.permiso = permisoPorFecha.get(fecha);
      } else {
        payload.horas_ordinarias = 8;
        payload.horas_extra = cursor.month() === 0 && cursor.day() === 1 ? 2 : 0;
      }

      if (jornadaExistente) {
        await jornadaExistente.update(payload, { transaction: t });
      } else {
        await JornadaDiaria.create(payload, { transaction: t });
      }

      cursor = cursor.add(1, "day");
    }

    await t.commit();
    console.log("[seed] Super admin OK");
  } catch (err) {
    await t.rollback();
    console.error("[seed] Error super admin:", err);
    throw err;
  }
}
