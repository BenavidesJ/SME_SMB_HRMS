import { models, sequelize } from "../models/index.js";

const {
  Estado,
  EstadoCivil,
  Departamento,
  Puesto,
  TipoContrato,
  TipoJornada,
  CicloPago,
  TipoIncapacidad,
  TipoMarca,
  Feriado,
  Deduccion,
} = models;

async function ensureEstado(value, transaction) {
  const existing = await Estado.findOne({ where: { estado: value }, transaction });
  if (existing) return existing;

  const nextId = (Number(await Estado.max("id_estado", { transaction })) || 0) + 1;
  return Estado.create({ id_estado: nextId, estado: value }, { transaction });
}

async function upsertRows(model, rows, transaction) {
  for (const row of rows) {
    await model.upsert(row, { transaction });
  }
}

async function upsertFeriados(rows, transaction) {
  for (const row of rows) {
    const existing = await Feriado.findOne({ where: { fecha: row.fecha }, transaction });
    if (existing) {
      await existing.update(row, { transaction });
    } else {
      await Feriado.create(row, { transaction });
    }
  }
}

async function upsertDeducciones(rows, transaction) {
  for (const row of rows) {
    const existing = await Deduccion.findOne({ where: { nombre: row.nombre }, transaction });
    if (existing) {
      await existing.update(row, { transaction });
    } else {
      await Deduccion.create(row, { transaction });
    }
  }
}

export async function seedCatalogosBase() {
  const t = await sequelize.transaction();
  try {
    const estadosBase = ["ACTIVO", "INACTIVO", "PENDIENTE", "APROBADO", "CANCELADO", "RECHAZADO"];
    const estadosCreados = [];
    for (const value of estadosBase) {
      const estado = await ensureEstado(value, t);
      estadosCreados.push(estado);
    }

    const estadoActivo = estadosCreados.find((estado) => estado.estado === "ACTIVO");

    if (!estadoActivo) throw new Error("No se pudo crear/obtener el estado ACTIVO");

    for (const row of [{ estado_civil: "SOLTERO" }, { estado_civil: "CASADO" }]) {
      await EstadoCivil.findOrCreate({
        where: { estado_civil: row.estado_civil },
        defaults: row,
        transaction: t,
      });
    }

    await upsertRows(
      Departamento,
      [
        { id_departamento: 7, nombre: "CONTABILIDAD" },
        { id_departamento: 6, nombre: "SERVICIO AL CLIENTE" },
        { id_departamento: 5, nombre: "VENTAS" },
        { id_departamento: 3, nombre: "PRODUCCIÓN" },
        { id_departamento: 2, nombre: "TECNOLOGÍAS DE INFORMACIÓN" },
        { id_departamento: 1, nombre: "ADMINISTRACIÓN" },
      ],
      t,
    );

    await upsertRows(
      Puesto,
      [
        {
          id_puesto: 1,
          id_departamento: 1,
          nombre: "ADMINISTRADOR GENERAL",
          es_jefe: true,
          estado: estadoActivo.id_estado,
        },
        {
          id_puesto: 2,
          id_departamento: 2,
          nombre: "INGENIERO DE SOFTWARE",
          es_jefe: false,
          estado: estadoActivo.id_estado,
        },
        {
          id_puesto: 3,
          id_departamento: 7,
          nombre: "CONTADOR",
          es_jefe: false,
          estado: estadoActivo.id_estado,
        },
        {
          id_puesto: 4,
          id_departamento: 3,
          nombre: "OPERARIO DE PRODUCCIÓN",
          es_jefe: false,
          estado: estadoActivo.id_estado,
        },
        {
          id_puesto: 5,
          id_departamento: 5,
          nombre: "VENDEDOR",
          es_jefe: false,
          estado: estadoActivo.id_estado,
        },
        {
          id_puesto: 6,
          id_departamento: 6,
          nombre: "OPERADOR DE SERVICIO AL CLIENTE",
          es_jefe: false,
          estado: estadoActivo.id_estado,
        },
      ],
      t,
    );

    await upsertRows(
      TipoContrato,
      [
        { id_tipo_contrato: 1, tipo_contrato: "INDEFINIDO" },
        { id_tipo_contrato: 2, tipo_contrato: "PLAZO FIJO" },
      ],
      t,
    );

    await upsertRows(
      TipoJornada,
      [
        {
          id_tipo_jornada: 1,
          tipo: "DIURNA",
          max_horas_diarias: "8.00",
          max_horas_semanales: "48.00",
        },
        {
          id_tipo_jornada: 2,
          tipo: "NOCTURNA",
          max_horas_diarias: "6.00",
          max_horas_semanales: "36.00",
        },
        {
          id_tipo_jornada: 3,
          tipo: "MIXTA",
          max_horas_diarias: "7.00",
          max_horas_semanales: "42.00",
        },
      ],
      t,
    );

    await upsertRows(
      CicloPago,
      [
        { id_ciclo_pago: 1, ciclo_pago: "QUINCENAL" },
        { id_ciclo_pago: 2, ciclo_pago: "MENSUAL" },
        { id_ciclo_pago: 3, ciclo_pago: "BI-SEMANAL" },
      ],
      t,
    );

    await upsertRows(
      TipoIncapacidad,
      [
        { nombre: "ENFERMEDAD" },
        { nombre: "MATERNIDAD" },
        { nombre: "ACCIDENTE" },
      ],
      t,
    );

    await upsertRows(
      TipoMarca,
      [{ nombre: "ENTRADA" }, { nombre: "SALIDA" }],
      t,
    );

    await upsertFeriados(
      [
        { fecha: "2025-01-01", nombre: "Año Nuevo", es_obligatorio: true },
        { fecha: "2025-04-11", nombre: "Día de Juan Santamaría", es_obligatorio: true },
        { fecha: "2025-04-17", nombre: "Jueves Santo", es_obligatorio: true },
        { fecha: "2025-04-18", nombre: "Viernes Santo", es_obligatorio: true },
        { fecha: "2025-05-01", nombre: "Día Internacional del Trabajo", es_obligatorio: true },
        { fecha: "2025-07-25", nombre: "Anexión del Partido de Nicoya", es_obligatorio: true },
        { fecha: "2025-08-02", nombre: "Virgen de los Ángeles", es_obligatorio: true },
        { fecha: "2025-08-15", nombre: "Día de la Madre", es_obligatorio: true },
        { fecha: "2025-09-15", nombre: "Día de la Independencia", es_obligatorio: true },
        { fecha: "2025-12-25", nombre: "Navidad", es_obligatorio: true },
        { fecha: "2026-01-01", nombre: "Año Nuevo", es_obligatorio: true },
        { fecha: "2026-04-11", nombre: "Día de Juan Santamaría", es_obligatorio: true },
        { fecha: "2026-04-02", nombre: "Jueves Santo", es_obligatorio: true },
        { fecha: "2026-04-03", nombre: "Viernes Santo", es_obligatorio: true },
        { fecha: "2026-05-01", nombre: "Día Internacional del Trabajo", es_obligatorio: true },
        { fecha: "2026-07-25", nombre: "Anexión del Partido de Nicoya", es_obligatorio: true },
        { fecha: "2026-08-02", nombre: "Virgen de los Ángeles", es_obligatorio: true },
        { fecha: "2026-08-15", nombre: "Día de la Madre", es_obligatorio: true },
        { fecha: "2026-09-15", nombre: "Día de la Independencia", es_obligatorio: true },
        { fecha: "2026-12-25", nombre: "Navidad", es_obligatorio: true },
      ],
      t,
    );

    await upsertDeducciones(
      [
        {
          nombre: "CCSS SEM (Enfermedad y Maternidad)",
          valor: 5.5,
          es_voluntaria: false,
        },
        {
          nombre: "CCSS IVM (Invalidez Vejez Muerte)",
          valor: 4.33,
          es_voluntaria: false,
        },
        {
          nombre: "Banco Popular - Aporte trabajador",
          valor: 1.0,
          es_voluntaria: false,
        },
      ],
      t,
    );

    await t.commit();
    console.log("[seed] Catálogos base OK");
  } catch (err) {
    await t.rollback();
    console.error("[seed] Error catálogos base:", err);
    throw err;
  }
}
