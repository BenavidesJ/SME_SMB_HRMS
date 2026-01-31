import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import "dayjs/locale/es.js";
import bcrypt from "bcrypt";

dayjs.extend(utc);
dayjs.locale("es");

import {
  sequelize,
  Colaborador,
  Contrato,
  HorarioLaboral,
  MarcaAsistencia,
  JornadaDiaria,
  Incapacidad,
  TipoSolicitud,
  Estado,
  TipoMarca,
  TipoIncapacidad,
  TipoContrato,
  TipoJornada,
  CicloPago,
  Puesto,
  Usuario,
  Rol,
  Telefono,
  Direccion,
  Provincia,
  Canton,
  Distrito,
} from "../models/index.js";

const RANGE_START = dayjs("2025-04-01").startOf("day");
const RANGE_END = dayjs("2026-04-19").endOf("day");

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function to2(n) {
  return Number(Number(n).toFixed(2));
}

function makeRng(seed = 123456789) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const rng = makeRng(20250401);

function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function* iterBusinessDays(start, end) {
  let d = start.startOf("day");
  const e = end.startOf("day");
  while (d.isBefore(e) || d.isSame(e)) {
    const dow = d.day();
    if (dow !== 0 && dow !== 6) yield d;
    d = d.add(1, "day");
  }
}

function generateDayMarks(dateDayjs) {
  const inMinOffset = randInt(-10, 10);
  const entrada = dateDayjs
    .hour(8)
    .minute(0)
    .second(0)
    .millisecond(0)
    .add(inMinOffset, "minute");

  const outMinOffset = randInt(-10, 20);
  const salidaBase = dateDayjs
    .hour(17)
    .minute(0)
    .second(0)
    .millisecond(0)
    .add(outMinOffset, "minute");

  const missing = rng() < 0.006;
  const overtime = rng() < 0.06;
  const salida = overtime ? salidaBase.add(randInt(30, 120), "minute") : salidaBase;

  return { missing, entrada, salida };
}

function computeWorkedHours(entrada, salida, minutosDescanso = 60) {
  const totalMinutes = Math.max(0, salida.diff(entrada, "minute"));
  const netMinutes = Math.max(0, totalMinutes - minutosDescanso);
  return netMinutes / 60.0;
}

function getModelByAnyName(...names) {
  for (const n of names) {
    if (sequelize?.models?.[n]) return sequelize.models[n];
  }
  return null;
}

async function requireOne(model, where, tx, label) {
  const row = await model.findOne({ where, transaction: tx });
  if (!row) throw new Error(`Catálogo faltante: ${label}`);
  return row;
}

async function getMaxId(model, field, tx) {
  const m = await model.max(field, { transaction: tx });
  const n = Number(m ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function ensureUserHasRole(userInstance, roleId, tx) {
  // Evita duplicados sin asumir el nombre exacto del getter.
  const getters = ["getRols", "getRoles", "getRols", "getRol", "getRole"];
  let existing = [];
  for (const g of getters) {
    if (typeof userInstance[g] === "function") {
      try {
        // algunos ORMs esperan options
        existing = await userInstance[g]({ transaction: tx });
        break;
      } catch {
        // ignore
      }
    }
  }

  const existingIds = new Set(
    (Array.isArray(existing) ? existing : [])
      .map((r) => Number(r?.get?.("id_rol") ?? r?.id_rol ?? r?.id))
      .filter((x) => Number.isFinite(x)),
  );

  if (!existingIds.has(Number(roleId))) {
    // método que ya estás usando en tu proyecto
    await userInstance.addRol(roleId, { transaction: tx });
  }
}

async function getCatalogIds(tx) {
  const estadoActivo = await requireOne(Estado, { estado: "ACTIVO" }, tx, "Estado.ACTIVO");
  const estadoPendiente = await requireOne(Estado, { estado: "PENDIENTE" }, tx, "Estado.PENDIENTE");
  const estadoAprobado = await requireOne(Estado, { estado: "APROBADO" }, tx, "Estado.APROBADO");
  const estadoCancelado = await requireOne(Estado, { estado: "CANCELADO" }, tx, "Estado.CANCELADO");
  const estadoRechazado = await requireOne(Estado, { estado: "RECHAZADO" }, tx, "Estado.RECHAZADO");

  const marcaEntrada = await requireOne(TipoMarca, { nombre: "ENTRADA" }, tx, "TipoMarca.ENTRADA");
  const marcaSalida = await requireOne(TipoMarca, { nombre: "SALIDA" }, tx, "TipoMarca.SALIDA");

  const incapEnfermedad = await requireOne(
    TipoIncapacidad,
    { nombre: "ENFERMEDAD" },
    tx,
    "TipoIncapacidad.ENFERMEDAD",
  );
  const incapMaternidad = await requireOne(
    TipoIncapacidad,
    { nombre: "MATERNIDAD" },
    tx,
    "TipoIncapacidad.MATERNIDAD",
  );
  const incapAccidente = await requireOne(
    TipoIncapacidad,
    { nombre: "ACCIDENTE_TRANSITO" },
    tx,
    "TipoIncapacidad.ACCIDENTE_TRANSITO",
  );

  const tipoContratoIndef = await requireOne(
    TipoContrato,
    { tipo_contrato: "INDEFINIDO" },
    tx,
    "TipoContrato.INDEFINIDO",
  );

  const tipoJornadaDiurna = await requireOne(
    TipoJornada,
    { tipo: "DIURNA" },
    tx,
    "TipoJornada.DIURNA",
  );

  const cicloQuincenal = await requireOne(CicloPago, { nombre: "QUINCENAL" }, tx, "CicloPago.QUINCENAL");

  const puestos = {
    ADMIN: await requireOne(Puesto, { nombre: "CO-ADMINISTRADOR" }, tx, "Puesto.CO-ADMINISTRADOR"),
    ING_SOFT: await requireOne(Puesto, { nombre: "INGENIERO DE SOFTWARE" }, tx, "Puesto.INGENIERO DE SOFTWARE"),
    CONTADOR: await requireOne(Puesto, { nombre: "CONTADOR" }, tx, "Puesto.CONTADOR"),
    OPERARIO: await requireOne(Puesto, { nombre: "OPERARIO DE PRODUCCIÓN" }, tx, "Puesto.OPERARIO DE PRODUCCIÓN"),
    VENDEDOR: await requireOne(Puesto, { nombre: "VENDEDOR" }, tx, "Puesto.VENDEDOR"),
    SERVICIO: await requireOne(
      Puesto,
      { nombre: "OPERADOR DE SERVICIO AL CLIENTE" },
      tx,
      "Puesto.OPERADOR DE SERVICIO AL CLIENTE",
    ),
  };

  const PUESTOS = Object.fromEntries(
    Object.entries(puestos).map(([k, p]) => [
      k,
      {
        id: Number(p.get("id_puesto")),
        min: Number(p.get("sal_base_referencia_min")),
        max: Number(p.get("sal_base_referencia_max")),
      },
    ]),
  );

  const roles = {
    ADMIN: await requireOne(Rol, { nombre: "ADMINISTRADOR" }, tx, "Rol.ADMINISTRADOR"),
    EMPLEADO: await requireOne(Rol, { nombre: "EMPLEADO" }, tx, "Rol.EMPLEADO"),
  };

  return {
    estado: {
      ACTIVO: Number(estadoActivo.get("id_estado")),
      PENDIENTE: Number(estadoPendiente.get("id_estado")),
      APROBADO: Number(estadoAprobado.get("id_estado")),
      CANCELADO: Number(estadoCancelado.get("id_estado")),
      RECHAZADO: Number(estadoRechazado.get("id_estado")),
    },
    marca: {
      ENTRADA: Number(marcaEntrada.get("id_tipo_marca")),
      SALIDA: Number(marcaSalida.get("id_tipo_marca")),
    },
    incap: {
      ENFERMEDAD: Number(incapEnfermedad.get("id_tipo_incap")),
      MATERNIDAD: Number(incapMaternidad.get("id_tipo_incap")),
      ACCIDENTE: Number(incapAccidente.get("id_tipo_incap")),
    },
    contrato: {
      TIPO_CONTRATO_INDEFINIDO: Number(tipoContratoIndef.get("id_tipo_contrato")),
      TIPO_JORNADA_DIURNA: Number(tipoJornadaDiurna.get("id_tipo_jornada")),
      MAX_HORAS_SEMANALES_DIURNA: Number(tipoJornadaDiurna.get("max_horas_semanales")),
      CICLO_PAGO_QUINCENAL: Number(cicloQuincenal.get("id_ciclo_pago")),
    },
    PUESTOS,
    roles: {
      ADMIN: Number(roles.ADMIN.get("id_rol")),
      EMPLEADO: Number(roles.EMPLEADO.get("id_rol")),
    },
  };
}

async function getTipoSolicitudMap(tx) {
  const rows = await TipoSolicitud.findAll({ transaction: tx });
  const map = new Map();
  for (const x of rows) {
    map.set(String(x.get("tipo_solicitud")).toUpperCase(), Number(x.get("id_tipo_solicitud")));
  }
  for (const key of ["CON GOCE", "SIN GOCE", "LICENCIA"]) {
    if (!map.get(key)) throw new Error(`TipoSolicitud faltante: ${key}`);
  }
  return map;
}

/**
 * Normaliza strings:
 * - trim
 * - upper
 * - elimina acentos/diacríticos
 */
function norm(s) {
  return String(s ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Construye índices en memoria para resolver Provincia/Cantón/Distrito
 * de manera tolerante (mayúsculas/acentos/espacios).
 */
async function buildGeoIndex(tx) {
  const [provs, cants, dists] = await Promise.all([
    Provincia.findAll({ transaction: tx }),
    Canton.findAll({ transaction: tx }),
    Distrito.findAll({ transaction: tx }),
  ]);

  const provByName = new Map();
  for (const p of provs) {
    provByName.set(norm(p.get("nombre")), p);
  }

  const cantByProvId = new Map();
  for (const c of cants) {
    const provId = Number(c.get("id_provincia"));
    if (!cantByProvId.has(provId)) cantByProvId.set(provId, new Map());
    cantByProvId.get(provId).set(norm(c.get("nombre")), c);
  }

  const distByCantonId = new Map();
  for (const d of dists) {
    const cantonId = Number(d.get("id_canton"));
    if (!distByCantonId.has(cantonId)) distByCantonId.set(cantonId, new Map());
    distByCantonId.get(cantonId).set(norm(d.get("nombre")), d);
  }

  return { provByName, cantByProvId, distByCantonId };
}

/**
 * Resuelve ids de dirección sin depender de coincidencia exacta en BD.
 * Regla clave:
 * - Si "canton" viene igual a "provincia" (ej. canton: "ALAJUELA"), se interpreta como cabecera => "CENTRAL".
 */
function resolveAddressFromIndex(geo, input) {
  const provinciaIn = input?.provincia;
  const cantonIn = input?.canton;
  const distritoIn = input?.distrito;

  const provKey = norm(provinciaIn);
  const cantKeyRaw = norm(cantonIn);
  const distKey = norm(distritoIn);

  const prov = geo.provByName.get(provKey);
  if (!prov) throw new Error(`Catálogo faltante: Provincia.${provinciaIn}`);

  const id_provincia = Number(prov.get("id_provincia"));
  const cantMap = geo.cantByProvId.get(id_provincia);
  if (!cantMap) throw new Error(`Catálogo faltante: Canton.(provincia id ${id_provincia})`);

  const cantKey = cantKeyRaw === provKey ? "CENTRAL" : cantKeyRaw;

  const cant = cantMap.get(cantKey);
  if (!cant) {
    const hint =
      cantKeyRaw === provKey ? ` (se intentó mapear a CENTRAL, pero no existe en provincia ${provinciaIn})` : "";
    throw new Error(`Catálogo faltante: Canton.${cantonIn}${hint}`);
  }

  const id_canton = Number(cant.get("id_canton"));
  const distMap = geo.distByCantonId.get(id_canton);
  if (!distMap) throw new Error(`Catálogo faltante: Distrito.(cantón id ${id_canton})`);

  const dist = distMap.get(distKey);
  if (!dist) throw new Error(`Catálogo faltante: Distrito.${distritoIn}`);

  return {
    id_provincia,
    id_canton,
    id_distrito: Number(dist.get("id_distrito")),
  };
}

export const generateUsername = (nombre, primer_apellido, identificacion) => {
  if (!nombre || !primer_apellido || !identificacion) {
    throw new Error("Faltan datos para generar el nombre de usuario");
  }

  const inicial = nombre.trim().charAt(0).toUpperCase();
  const apellido = primer_apellido.trim().replace(/\s+/g, '');
  const ultimos4 = identificacion.slice(-4);

  return `${inicial}${apellido}${ultimos4}`;
};

function* iterDaysInclusive(start, end) {
  let d = start.startOf("day");
  const e = end.startOf("day");
  while (d.isBefore(e) || d.isSame(e)) {
    yield d;
    d = d.add(1, "day");
  }
}

function addRangeToSet(set, start, end) {
  const s = dayjs(start).startOf("day");
  const e = dayjs(end).startOf("day");
  for (const d of iterDaysInclusive(s, e)) set.add(d.format("YYYY-MM-DD"));
}

function shouldExcludeSolicitud(estadoId, ids) {
  // Excluir si la solicitud NO está cancelada ni rechazada
  return estadoId !== ids.estado.CANCELADO && estadoId !== ids.estado.RECHAZADO;
}

export async function seed1AñoDatos() {
  const tx = await sequelize.transaction();
  try {
    const ids = await getCatalogIds(tx);
    const tipoSolicitudId = await getTipoSolicitudMap(tx);
    const geo = await buildGeoIndex(tx);
    const correo = "jbenavideso_emc@uia.ac.cr";
    const inicioContrato = "2025-04-01";

    // Password fija para todos
    const FIXED_PASSWORD = "pAssword123*";
    const fixedPasswordHash = await bcrypt.hash(FIXED_PASSWORD, 10);

    const HORAS_SEMANALES = 40.0;
    if (HORAS_SEMANALES > ids.contrato.MAX_HORAS_SEMANALES_DIURNA) {
      throw new Error(
        `horas_semanales (${HORAS_SEMANALES}) excede max_horas_semanales DIURNA (${ids.contrato.MAX_HORAS_SEMANALES_DIURNA})`,
      );
    }

    // 2 administradores (además del super admin que ya existe afuera):
    // - María (id 2) y Laura (id 4) quedan como ADMINISTRADOR
    const colaboradoresPayload = [
      {
        id_colaborador: 2,
        nombre: "Carlos",
        primer_apellido: "Vargas",
        segundo_apellido: "Solano",
        id_genero: 1,
        identificacion: 101010101,
        fecha_nacimiento: "1992-03-12",
        correo_electronico: correo,
        fecha_ingreso: inicioContrato,
        cantidad_hijos: 1,
        estado_civil: 2,
        estado: ids.estado.ACTIVO,
        telefono: 88881111,
        rol: "ADMIN",
        direccion: {
          provincia: "SAN JOSÉ",
          canton: "SAN JOSÉ",
          distrito: "CARMEN",
          otros_datos: "Avenida Central, edificio BioAlquimia",
        },
      },
      {
        id_colaborador: 3,
        nombre: "María",
        primer_apellido: "Hernández",
        segundo_apellido: "Rojas",
        id_genero: 2,
        identificacion: 202020202,
        fecha_nacimiento: "1995-11-25",
        correo_electronico: correo,
        fecha_ingreso: inicioContrato,
        cantidad_hijos: 0,
        estado_civil: 1,
        estado: ids.estado.ACTIVO,
        telefono: 88882222,
        rol: "ADMIN",
        direccion: {
          provincia: "ALAJUELA",
          canton: "ALAJUELA",
          distrito: "ALAJUELA",
          otros_datos: "Residencial Los Arcos, casa 12",
        },
      },
      {
        id_colaborador: 4,
        nombre: "Andrés",
        primer_apellido: "Chaves",
        segundo_apellido: "Mora",
        id_genero: 1,
        identificacion: 303030303,
        correo_electronico: correo,
        fecha_nacimiento: inicioContrato,
        fecha_ingreso: "2023-09-01",
        cantidad_hijos: 2,
        estado_civil: 2,
        estado: ids.estado.ACTIVO,
        telefono: 88883333,
        rol: "EMPLEADO",
        direccion: {
          provincia: "HEREDIA",
          canton: "HEREDIA",
          distrito: "HEREDIA",
          otros_datos: "Cerca del parque central",
        },
      },
      {
        id_colaborador: 5,
        nombre: "Laura",
        primer_apellido: "Gómez",
        segundo_apellido: "Jiménez",
        id_genero: 2,
        identificacion: 404040404,
        fecha_nacimiento: "1999-02-18",
        correo_electronico: correo,
        fecha_ingreso: inicioContrato,
        cantidad_hijos: 0,
        estado_civil: 1,
        estado: ids.estado.ACTIVO,
        telefono: 88884444,
        rol: "ADMIN",
        direccion: {
          provincia: "CARTAGO",
          canton: "CARTAGO",
          distrito: "ORIENTAL",
          otros_datos: "Frente al TEC, torre A",
        },
      },
      {
        id_colaborador: 6,
        nombre: "Diego",
        primer_apellido: "Araya",
        segundo_apellido: "Sibaja",
        id_genero: 1,
        identificacion: 505050505,
        fecha_nacimiento: "1990-06-30",
        correo_electronico: correo,
        fecha_ingreso: inicioContrato,
        cantidad_hijos: 1,
        estado_civil: 2,
        estado: ids.estado.ACTIVO,
        telefono: 88885555,
        rol: "EMPLEADO",
        direccion: {
          provincia: "PUNTARENAS",
          canton: "PUNTARENAS",
          distrito: "PUNTARENAS",
          otros_datos: "Barrio El Carmen, contiguo a la iglesia",
        },
      },
    ];

    // Upsert simple de colaboradores base (no pisa si ya existe)
    const existingCols = await Colaborador.findAll({
      where: { id_colaborador: colaboradoresPayload.map((c) => c.id_colaborador) },
      transaction: tx,
    });
    const existingIds = new Set(existingCols.map((c) => Number(c.get("id_colaborador"))));

    for (const c of colaboradoresPayload) {
      if (!existingIds.has(c.id_colaborador)) {
        await Colaborador.create(
          {
            id_colaborador: c.id_colaborador,
            nombre: c.nombre,
            primer_apellido: c.primer_apellido,
            segundo_apellido: c.segundo_apellido,
            id_genero: c.id_genero,
            identificacion: c.identificacion,
            fecha_nacimiento: c.fecha_nacimiento,
            correo_electronico: c.correo_electronico,
            fecha_ingreso: c.fecha_ingreso,
            cantidad_hijos: c.cantidad_hijos,
            estado_civil: c.estado_civil,
            estado: c.estado,
          },
          { transaction: tx },
        );
      }

      const colaboradorId = c.id_colaborador;

      // Teléfono principal
      const telExists = await Telefono.findOne({
        where: { id_colaborador: colaboradorId, es_principal: true },
        transaction: tx,
      });
      if (!telExists) {
        await Telefono.create(
          {
            id_colaborador: colaboradorId,
            numero: Number(c.telefono),
            es_principal: true,
          },
          { transaction: tx },
        );
      }

      // Dirección principal (robusta)
      const dirExists = await Direccion.findOne({
        where: { id_colaborador: colaboradorId, es_principal: true },
        transaction: tx,
      });
      if (!dirExists) {
        const addr = resolveAddressFromIndex(geo, c.direccion);
        await Direccion.create(
          {
            id_colaborador: colaboradorId,
            ...addr,
            otros_datos: c.direccion?.otros_datos ?? "N/A",
            es_principal: true,
            estado: ids.estado.ACTIVO,
          },
          { transaction: tx },
        );
      }

      // Usuario + Rol (asegurar rol correcto incluso si ya existía el usuario)
      const userExists = await Usuario.findOne({
        where: { id_colaborador: colaboradorId },
        transaction: tx,
      });

      const desiredRoleId = String(c.rol || "").toUpperCase() === "ADMIN" ? ids.roles.ADMIN : ids.roles.EMPLEADO;

      if (!userExists) {
        const username = generateUsername(c.nombre, c.primer_apellido, String(c.identificacion));

        const user = await Usuario.create(
          {
            username,
            contrasena_hash: fixedPasswordHash,
            requiere_cambio_contrasena: false,
            ultimo_acceso_en: dayjs().toDate(),
            id_colaborador: colaboradorId,
            estado: ids.estado.ACTIVO,
          },
          { transaction: tx },
        );

        await ensureUserHasRole(user, desiredRoleId, tx);
      } else {
        await ensureUserHasRole(userExists, desiredRoleId, tx);
      }
    }

    // =========================
    // CONTRATOS (NO tocar id 1)
    // =========================
    // Regla: NO crear contrato para el colaborador id 1 (super admin ya lo tiene en otro seed).
    // Para 2-5: asegurar que tengan exactamente al menos 1 contrato (si ya existe, no crea otro).
    const contractPlan = [
      { id_colaborador: 2, puesto: ids.PUESTOS.CONTADOR, salario: 360000 },
      { id_colaborador: 3, puesto: ids.PUESTOS.OPERARIO, salario: 450000 },
      { id_colaborador: 4, puesto: ids.PUESTOS.SERVICIO, salario: 480000 },
      { id_colaborador: 5, puesto: ids.PUESTOS.ING_SOFT, salario: 1300000 },
    ];

    let nextContratoId = (await getMaxId(Contrato, "id_contrato", tx)) + 1;
    const contratoIdByColaborador = new Map(); // id_colaborador -> id_contrato

    for (const c of contractPlan) {
      const existing = await Contrato.findOne({
        where: { id_colaborador: c.id_colaborador },
        transaction: tx,
      });

      if (existing) {
        contratoIdByColaborador.set(c.id_colaborador, Number(existing.get("id_contrato")));
        continue;
      }

      const payload = {
        id_contrato: nextContratoId++,
        id_colaborador: c.id_colaborador,
        id_puesto: c.puesto.id,
        fecha_inicio: inicioContrato,
        id_tipo_contrato: ids.contrato.TIPO_CONTRATO_INDEFINIDO,
        id_tipo_jornada: ids.contrato.TIPO_JORNADA_DIURNA,
        horas_semanales: HORAS_SEMANALES,
        salario_base: clamp(c.salario, c.puesto.min, c.puesto.max),
        id_ciclo_pago: ids.contrato.CICLO_PAGO_QUINCENAL,
        estado: ids.estado.ACTIVO,
      };

      const created = await Contrato.create(payload, { transaction: tx });
      contratoIdByColaborador.set(c.id_colaborador, Number(created.get("id_contrato")));
    }

    // =========================
    // HORARIOS (por contrato 2-5)
    // =========================
    let nextHorarioId = (await getMaxId(HorarioLaboral, "id_horario", tx)) + 1;

    for (const [id_colaborador, id_contrato] of contratoIdByColaborador.entries()) {
      const existingHorario = await HorarioLaboral.findOne({
        where: { id_contrato },
        transaction: tx,
      });
      if (existingHorario) continue;

      await HorarioLaboral.create(
        {
          id_horario: nextHorarioId++,
          id_contrato,
          hora_inicio: "08:00:00",
          hora_fin: "17:00:00",
          minutos_descanso: 60,
          dias_laborales: "LKMJV",
          dias_libres: "SD",
          estado: ids.estado.ACTIVO,
          fecha_actualizacion: "2025-04-01",
          id_tipo_jornada: ids.contrato.TIPO_JORNADA_DIURNA,
        },
        { transaction: tx },
      );
    }

    // =========================
    // INCAPACIDADES + SOLICITUDES
    // (se crean y también se usan para excluir marcas)
    // =========================
    const incapacidades = [
      {
        id_incapacidad: 1,
        id_colaborador: 3,
        id_tipo_incap: ids.incap.ENFERMEDAD,
        fecha_inicio: "2025-07-14",
        fecha_fin: "2025-07-22",
        porcentaje_patrono: 0.0,
        porcentaje_ccss: 60.0,
        observaciones: "N/A",
      },
      {
        id_incapacidad: 2,
        id_colaborador: 2,
        id_tipo_incap: ids.incap.ENFERMEDAD,
        fecha_inicio: "2026-02-01",
        fecha_fin: "2026-02-10",
        porcentaje_patrono: 0.0,
        porcentaje_ccss: 60.0,
        observaciones: "N/A",
      },
      {
        id_incapacidad: 3,
        id_colaborador: 4,
        id_tipo_incap: ids.incap.ACCIDENTE,
        fecha_inicio: "2025-10-03",
        fecha_fin: "2025-10-07",
        porcentaje_patrono: 40.0,
        porcentaje_ccss: 60.0,
        observaciones: "N/A",
      },
      {
        id_incapacidad: 4,
        id_colaborador: 2,
        id_tipo_incap: ids.incap.MATERNIDAD,
        fecha_inicio: "2025-12-01",
        fecha_fin: "2026-03-01",
        porcentaje_patrono: 0.0,
        porcentaje_ccss: 100.0,
        observaciones: "N/A",
      },
    ];

    // Para evitar colisiones de PK si ya existen, recalcular ids faltantes si hay choque
    const existingIncs = await Incapacidad.findAll({
      where: { id_incapacidad: incapacidades.map((x) => x.id_incapacidad) },
      transaction: tx,
    });
    const incIds = new Set(existingIncs.map((x) => Number(x.get("id_incapacidad"))));
    let nextIncapId = (await getMaxId(Incapacidad, "id_incapacidad", tx)) + 1;
    const newIncs = [];
    for (const inc of incapacidades) {
      if (!incIds.has(inc.id_incapacidad)) {
        newIncs.push(inc);
      } else {
        // si ya existe ese id, NO duplicamos (asumimos que es la misma)
      }
    }
    // Si hubiera necesidad de insertar adicionales sin ids, aquí reasignarías:
    // (no aplica en tu dataset actual)
    if (newIncs.length) await Incapacidad.bulkCreate(newIncs, { transaction: tx });

    const SolicitudPermisosLicencias =
      getModelByAnyName(
        "solicitud_permisos_licencias",
        "SolicitudPermisosLicencias",
        "solicitud_permiso_licencia",
        "SolicitudPermisoLicencia",
      ) || null;

    const solicitudes = [
      {
        id_solicitud: 1,
        id_colaborador: 2,
        id_aprobador: 1,
        estado_solicitud: ids.estado.PENDIENTE,
        tipo_solicitud: tipoSolicitudId.get("CON GOCE"),
        fecha_inicio: "2025-04-18 14:00:00",
        fecha_fin: "2025-04-18 16:00:00",
        con_goce_salarial: true,
        observaciones: "N/A",
        cantidad_horas: 2.0,
        cantidad_dias: 0.0,
      },
      {
        id_solicitud: 2,
        id_colaborador: 4,
        id_aprobador: 1,
        estado_solicitud: ids.estado.APROBADO,
        tipo_solicitud: tipoSolicitudId.get("CON GOCE"),
        fecha_inicio: "2025-08-12 08:00:00",
        fecha_fin: "2025-08-12 12:00:00",
        con_goce_salarial: true,
        observaciones: "N/A",
        cantidad_horas: 4.0,
        cantidad_dias: 0.0,
      },
      {
        id_solicitud: 3,
        id_colaborador: 3,
        id_aprobador: 1,
        estado_solicitud: ids.estado.RECHAZADO,
        tipo_solicitud: tipoSolicitudId.get("LICENCIA"),
        fecha_inicio: "2025-11-20 08:00:00",
        fecha_fin: "2025-11-22 17:00:00",
        con_goce_salarial: false,
        observaciones: "N/A",
        cantidad_horas: 0.0,
        cantidad_dias: 2.0,
      },
      {
        id_solicitud: 4,
        id_colaborador: 5,
        id_aprobador: 1,
        estado_solicitud: ids.estado.APROBADO,
        tipo_solicitud: tipoSolicitudId.get("CON GOCE"),
        fecha_inicio: "2026-03-05 15:00:00",
        fecha_fin: "2026-03-05 17:00:00",
        con_goce_salarial: true,
        observaciones: "N/A",
        cantidad_horas: 2.0,
        cantidad_dias: 0.0,
      },
      {
        id_solicitud: 5,
        id_colaborador: 1,
        id_aprobador: 1,
        estado_solicitud: ids.estado.APROBADO,
        tipo_solicitud: tipoSolicitudId.get("SIN GOCE"),
        fecha_inicio: "2025-12-22 08:00:00",
        fecha_fin: "2025-12-31 17:00:00",
        con_goce_salarial: false,
        observaciones: "N/A",
        cantidad_horas: 0.0,
        cantidad_dias: 8.0,
      },
      {
        id_solicitud: 6,
        id_colaborador: 4,
        id_aprobador: 1,
        estado_solicitud: ids.estado.CANCELADO,
        tipo_solicitud: tipoSolicitudId.get("CON GOCE"),
        fecha_inicio: "2026-01-20 08:00:00",
        fecha_fin: "2026-01-24 17:00:00",
        con_goce_salarial: true,
        observaciones: "N/A",
        cantidad_horas: 0.0,
        cantidad_dias: 4.0,
      },
    ];

    if (SolicitudPermisosLicencias) {
      const existingSol = await SolicitudPermisosLicencias.findAll({
        where: { id_solicitud: solicitudes.map((x) => x.id_solicitud) },
        transaction: tx,
      });
      const solIds = new Set(existingSol.map((x) => Number(x.get("id_solicitud"))));
      const newSol = solicitudes.filter((x) => !solIds.has(x.id_solicitud));
      if (newSol.length) await SolicitudPermisosLicencias.bulkCreate(newSol, { transaction: tx });
    }

    // =========================
    // EXCLUSIONES: incapacidad / permisos / vacaciones
    // =========================
    // excludedDaysByColaborador: id_colaborador -> Set("YYYY-MM-DD")
    const excludedDaysByColaborador = new Map();

    function ensureSetForColaborador(id_colaborador) {
      if (!excludedDaysByColaborador.has(id_colaborador)) excludedDaysByColaborador.set(id_colaborador, new Set());
      return excludedDaysByColaborador.get(id_colaborador);
    }

    // Incapacidades: siempre excluyen
    for (const inc of incapacidades) {
      const set = ensureSetForColaborador(inc.id_colaborador);
      addRangeToSet(set, inc.fecha_inicio, inc.fecha_fin);
    }

    // Solicitudes: excluyen si no están CANCELADO/RECHAZADO
    for (const sol of solicitudes) {
      if (!shouldExcludeSolicitud(sol.estado_solicitud, ids)) continue;
      const set = ensureSetForColaborador(sol.id_colaborador);
      addRangeToSet(set, sol.fecha_inicio, sol.fecha_fin);
    }

    // =========================
    // MARCAS + JORNADAS (sin días excluidos)
    // =========================
    const colaboradores = [1, 2, 3, 4, 5];

    // Evitar colisión de PK si ya hay data
    let marcaId = (await getMaxId(MarcaAsistencia, "id_marca", tx)) + 1;
    let jornadaId = (await getMaxId(JornadaDiaria, "id_jornada", tx)) + 1;

    const marcas = [];
    const jornadas = [];

    for (const dateDayjs of iterBusinessDays(RANGE_START, RANGE_END)) {
      const dayKey = dateDayjs.format("YYYY-MM-DD");

      for (const id_colaborador of colaboradores) {
        const excluded = excludedDaysByColaborador.get(id_colaborador);
        if (excluded && excluded.has(dayKey)) {
          // Regla solicitada: si hay incapacidad/permiso/vacaciones, NO generar marcas NI jornada ese día
          continue;
        }

        const absentAllDay = rng() < 0.015;
        if (absentAllDay) continue;

        const { missing, entrada, salida } = generateDayMarks(dateDayjs);

        if (!missing) {
          marcas.push({
            id_marca: marcaId++,
            id_colaborador,
            id_tipo_marca: ids.marca.ENTRADA,
            timestamp: entrada.toDate(),
            observaciones: "N/A",
          });

          marcas.push({
            id_marca: marcaId++,
            id_colaborador,
            id_tipo_marca: ids.marca.SALIDA,
            timestamp: salida.toDate(),
            observaciones: "N/A",
          });
        } else {
          marcas.push({
            id_marca: marcaId++,
            id_colaborador,
            id_tipo_marca: ids.marca.ENTRADA,
            timestamp: entrada.toDate(),
            observaciones: "Falta marca de salida",
          });
        }

        let horas_trabajadas = 0;
        let horas_extra = 0;

        if (!missing) {
          const h = computeWorkedHours(entrada, salida, 60);
          horas_trabajadas = to2(clamp(h, 6.0, 11.0));
          horas_extra = to2(Math.max(0, horas_trabajadas - 8.0));
        }

        jornadas.push({
          id_jornada: jornadaId++,
          id_colaborador,
          fecha: dayKey,
          horas_trabajadas,
          horas_extra,
          horas_nocturnas: 0.0,
          feriado_obligatorio: false,
        });
      }
    }

    const chunkSize = 5000;
    for (let i = 0; i < marcas.length; i += chunkSize) {
      await MarcaAsistencia.bulkCreate(marcas.slice(i, i + chunkSize), { transaction: tx });
    }
    for (let i = 0; i < jornadas.length; i += chunkSize) {
      await JornadaDiaria.bulkCreate(jornadas.slice(i, i + chunkSize), { transaction: tx });
    }

    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
