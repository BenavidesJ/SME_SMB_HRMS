import { sequelize } from "../config/db.js";

import { Rol } from "../models/rol.js";
import { Genero } from "../models/genero.js";
import { Estado } from "../models/estado.js";
import { EstadoCivil } from "../models/estado_civil.js";
import { Departamento } from "../models/departamento.js";
import { Puesto } from "../models/puesto.js";
import { TipoContrato } from "../models/tipo_contrato.js";
import { TipoJornada } from "../models/tipo_jornada.js";
import { CicloPago } from "../models/ciclo_pago.js";
import { TipoIncapacidad } from "../models/tipo_incapacidad.js";
import { TipoSolicitud } from "../models/tipo_solicitud.js";
import { TipoMarca } from "../models/tipo_marca.js";

export async function seedCatalogosBase() {
  const t = await sequelize.transaction();
  try {
    await Rol.bulkCreate(
      [
        { nombre: "SUPER_ADMIN" },
        { nombre: "ADMINISTRADOR" },
        { nombre: "EMPLEADO" },
      ],
      { transaction: t, updateOnDuplicate: ["nombre"] },
    );

    for (const row of [{ genero: "MASCULINO" }, { genero: "FEMENINO" }]) {
      await Genero.findOrCreate({
        where: { genero: row.genero },
        defaults: row,
        transaction: t,
      });
    }

    for (const row of [{ nombre: "ENFERMEDAD" }, { nombre: "MATERNIDAD" }, { nombre: "ACCIDENTE_TRANSITO" }]) {
      await TipoIncapacidad.findOrCreate({
        where: { nombre: row.nombre },
        defaults: row,
        transaction: t,
      });
    }

    await TipoSolicitud.bulkCreate(
      [
        { tipo_solicitud: "CON GOCE", es_licencia: false, es_permiso: true },
        { tipo_solicitud: "SIN GOCE", es_licencia: false, es_permiso: true },
        { tipo_solicitud: "LICENCIA", es_licencia: true, es_permiso: false },
      ],
      { transaction: t, updateOnDuplicate: ["es_licencia", "es_permiso"] },
    );

    await TipoMarca.bulkCreate(
      [{ nombre: "ENTRADA" }, { nombre: "SALIDA" }],
      { transaction: t, updateOnDuplicate: ["nombre"] },
    );

    for (const row of [{ estado: "ACTIVO" }, { estado: "INACTIVO" },{ estado: "PENDIENTE" }, { estado: "APROBADO" },{ estado: "CANCELADO" },{ estado: "RECHAZADO" }    ]) {
      await Estado.findOrCreate({
        where: { estado: row.estado },
        defaults: row,
        transaction: t,
      });
    }

    for (const row of [{ estado_civil: "SOLTERO" }, { estado_civil: "CASADO" }]) {
      await EstadoCivil.findOrCreate({
        where: { estado_civil: row.estado_civil },
        defaults: row,
        transaction: t,
      });
    }

    const estadoActivo = await Estado.findOne({
      where: { estado: "ACTIVO" },
      transaction: t,
    });

    if (!estadoActivo) {
      throw new Error("No se encontró el estado ACTIVO");
    }

    await Departamento.bulkCreate(
      [
        { id_departamento: 7, nombre: "CONTABILIDAD" },
        { id_departamento: 6, nombre: "SERVICIO AL CLIENTE" },
        { id_departamento: 5, nombre: "VENTAS" },
        { id_departamento: 3, nombre: "PRODUCCIÓN" },
        { id_departamento: 2, nombre: "TECNOLOGÍAS DE INFORMACIÓN" },
        { id_departamento: 1, nombre: "ADMINISTRACIÓN" },
      ],
      { transaction: t, updateOnDuplicate: ["nombre"] },
    );

    await Puesto.bulkCreate(
      [
        {
          id_puesto: 1,
          id_departamento: 1,
          nombre: "CO-ADMINISTRADOR",
          sal_base_referencia_min: "420000.00",
          sal_base_referencia_max: "800000.00",
          estado: estadoActivo.id_estado,
        },
        {
          id_puesto: 2,
          id_departamento: 2,
          nombre: "INGENIERO DE SOFTWARE",
          sal_base_referencia_min: "1200000.00",
          sal_base_referencia_max: "1800000.00",
          estado: estadoActivo.id_estado,
        },
        {
          id_puesto: 3,
          id_departamento: 7,
          nombre: "CONTADOR",
          sal_base_referencia_min: "300000.00",
          sal_base_referencia_max: "400000.00",
          estado: estadoActivo.id_estado,
        },
        {
          id_puesto: 4,
          id_departamento: 3,
          nombre: "OPERARIO DE PRODUCCIÓN",
          sal_base_referencia_min: "350000.00",
          sal_base_referencia_max: "550000.00",
          estado: estadoActivo.id_estado,
        },
        {
          id_puesto: 5,
          id_departamento: 5,
          nombre: "VENDEDOR",
          sal_base_referencia_min: "300000.00",
          sal_base_referencia_max: "650000.00",
          estado: estadoActivo.id_estado,
        },
        {
          id_puesto: 6,
          id_departamento: 6,
          nombre: "OPERADOR DE SERVICIO AL CLIENTE",
          sal_base_referencia_min: "320000.00",
          sal_base_referencia_max: "600000.00",
          estado: estadoActivo.id_estado,
        },
      ],
      {
        transaction: t,
        updateOnDuplicate: [
          "id_departamento",
          "nombre",
          "sal_base_referencia_min",
          "sal_base_referencia_max",
          "estado",
        ],
      },
    );

    await TipoContrato.bulkCreate(
      [{ id_tipo_contrato: 1, tipo_contrato: "INDEFINIDO" }],
      { transaction: t, updateOnDuplicate: ["tipo_contrato"] },
    );

    await TipoJornada.bulkCreate(
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
      {
        transaction: t,
        updateOnDuplicate: ["tipo", "max_horas_diarias", "max_horas_semanales"],
      },
    );

    await CicloPago.bulkCreate(
      [
        { id_ciclo_pago: 1, nombre: "QUINCENAL" },
        { id_ciclo_pago: 2, nombre: "MENSUAL" },
        { id_ciclo_pago: 3, nombre: "BI-SEMANAL" },
      ],
      { transaction: t, updateOnDuplicate: ["nombre"] },
    );

    await t.commit();
    console.log("[seed] Catálogos base OK");
  } catch (err) {
    await t.rollback();
    console.error("[seed] Error catálogos base:", err);
    throw err;
  }
}
