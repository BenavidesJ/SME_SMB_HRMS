import dayjs from "dayjs";
import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { requireNonEmptyString, requirePositiveInt, requireDateOnly } from "../../shared/validators.js";

const {
  Colaborador,
  Usuario,
  Rol,
  Estado,
  EstadoCivil,
  Direccion,
  Provincia,
  Canton,
  Distrito,
} = models;

const empleadoInclude = [
  { model: EstadoCivil, as: "estadoCivilRef", attributes: ["id_estado_civil", "estado_civil"] },
  { model: Estado, as: "estadoRef", attributes: ["id_estado", "estado"] },
  {
    model: Direccion,
    as: "direcciones",
    attributes: ["id_direccion", "id_provincia", "id_canton", "id_distrito", "otros_datos", "es_principal"],
    include: [
      { model: Provincia, as: "provincia", attributes: ["id_provincia", "nombre"] },
      { model: Canton, as: "canton", attributes: ["id_canton", "nombre", "id_provincia"] },
      { model: Distrito, as: "distrito", attributes: ["id_distrito", "nombre", "id_canton"] },
    ],
    required: false,
  },
  {
    model: Usuario,
    as: "usuarios",
    attributes: ["id_usuario", "username", "estado", "requiere_cambio_contrasena"],
    include: [{ model: Rol, as: "rol", attributes: ["id_rol", "nombre"] }],
    required: false,
  },
];

export function sanitizeNombre(value, fieldName) {
  return requireNonEmptyString(value, fieldName);
}

export function sanitizeIdentificacion(value) {
  return requirePositiveInt(value, "identificacion");
}

export function sanitizeFechaNacimiento(value) {
  const fecha = requireDateOnly(value, "fecha_nacimiento");
  const edad = dayjs().diff(dayjs(fecha), "year");
  if (edad < 18) {
    throw new Error("El colaborador debe ser mayor de edad");
  }
  return fecha;
}

export function sanitizeCorreo(value) {
  const correo = requireNonEmptyString(value, "correo_electronico");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    throw new Error("El correo electrónico no es válido");
  }
  return correo;
}

export function sanitizeTelefono(value) {
  const telefono = requireNonEmptyString(value, "telefono");
  if (!/^\d{8,15}$/.test(telefono)) {
    throw new Error("El teléfono debe contener entre 8 y 15 dígitos");
  }
  return telefono;
}

export function sanitizeCantidadHijos(value) {
  if (value === undefined || value === null || value === "") return 0;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) {
    throw new Error("La cantidad de hijos debe ser un entero mayor o igual a cero");
  }
  return num;
}

export async function resolveEstadoCivil(value, transaction) {
  const raw = requireNonEmptyString(value, "estado_civil");
  const where = /^\d+$/.test(raw)
    ? { id_estado_civil: Number(raw) }
    : { estado_civil: raw.toUpperCase() };

  const record = await EstadoCivil.findOne({ where, transaction });
  if (!record) throw new Error(`No existe estado civil '${value}'`);
  return record;
}

export async function resolveEstado(value, transaction) {
  const raw = requireNonEmptyString(value, "estado");
  const where = /^\d+$/.test(raw) ? { id_estado: Number(raw) } : { estado: raw.toUpperCase() };

  const record = await Estado.findOne({ where, transaction });
  if (!record) throw new Error(`No existe estado '${value}'`);
  return record;
}

export async function resolveRol(value, transaction) {
  const raw = requireNonEmptyString(value, "rol");
  const where = /^\d+$/.test(raw) ? { id_rol: Number(raw) } : { nombre: raw.toUpperCase() };

  const record = await Rol.findOne({ where, transaction });
  if (!record) throw new Error(`No existe rol '${value}'`);
  return record;
}

export async function ensureEstado(nombre, transaction) {
  return resolveEstado(nombre, transaction);
}

export async function resolveDireccionPayload(payload = {}, transaction) {
  if (payload === null) return null;
  const {
    id_provincia,
    provincia,
    id_canton,
    canton,
    id_distrito,
    distrito,
    otros_datos,
  } = payload;

  const provinciaRecord = await resolveProvincia({ id: id_provincia, nombre: provincia }, transaction);
  const cantonRecord = await resolveCanton({ id: id_canton, nombre: canton }, provinciaRecord.id_provincia, transaction);
  const distritoRecord = await resolveDistrito({ id: id_distrito, nombre: distrito }, cantonRecord.id_canton, transaction);
  const detalle = requireNonEmptyString(otros_datos, "direccion.otros_datos");

  return {
    provincia: provinciaRecord,
    canton: cantonRecord,
    distrito: distritoRecord,
    otrosDatos: detalle,
  };
}

async function resolveProvincia(input, transaction) {
  if (input?.id !== undefined && input?.id !== null) {
    const id = requirePositiveInt(input.id, "direccion.id_provincia");
    const record = await Provincia.findByPk(id, { transaction });
    if (!record) throw new Error(`No existe provincia con id ${id}`);
    return record;
  }
  const nombre = requireNonEmptyString(input?.nombre, "direccion.provincia");
  const record = await Provincia.findOne({ where: { nombre }, transaction });
  if (!record) throw new Error(`No existe provincia '${nombre}'`);
  return record;
}

async function resolveCanton(input, provinciaId, transaction) {
  if (input?.id !== undefined && input?.id !== null) {
    const id = requirePositiveInt(input.id, "direccion.id_canton");
    const record = await Canton.findByPk(id, { transaction });
    if (!record) throw new Error(`No existe cantón con id ${id}`);
    if (record.id_provincia !== provinciaId) {
      throw new Error("El cantón no pertenece a la provincia especificada");
    }
    return record;
  }
  const nombre = requireNonEmptyString(input?.nombre, "direccion.canton");
  const record = await Canton.findOne({ where: { nombre, id_provincia: provinciaId }, transaction });
  if (!record) throw new Error(`No existe cantón '${nombre}' en la provincia indicada`);
  return record;
}

async function resolveDistrito(input, cantonId, transaction) {
  if (input?.id !== undefined && input?.id !== null) {
    const id = requirePositiveInt(input.id, "direccion.id_distrito");
    const record = await Distrito.findByPk(id, { transaction });
    if (!record) throw new Error(`No existe distrito con id ${id}`);
    if (record.id_canton !== cantonId) {
      throw new Error("El distrito no pertenece al cantón especificado");
    }
    return record;
  }
  const nombre = requireNonEmptyString(input?.nombre, "direccion.distrito");
  const record = await Distrito.findOne({ where: { nombre, id_canton: cantonId }, transaction });
  if (!record) throw new Error(`No existe distrito '${nombre}' en el cantón indicado`);
  return record;
}

export async function fetchEmpleados(transaction) {
  const empleados = await Colaborador.findAll({
    include: empleadoInclude,
    order: [["id_colaborador", "ASC"]],
    transaction,
  });
  return empleados.map(serializeEmpleado);
}

export async function fetchEmpleadoById(id, transaction) {
  const empleado = await Colaborador.findByPk(id, {
    include: empleadoInclude,
    transaction,
  });
  return empleado ? serializeEmpleado(empleado) : null;
}

export function serializeEmpleado(instance) {
  if (!instance) return null;
  const plain = typeof instance.get === "function" ? instance.get({ plain: true }) : instance;

  const principalDireccion = (plain.direcciones ?? []).find((dir) => dir.es_principal) ?? (plain.direcciones ?? [])[0] ?? null;
  const usuario = (plain.usuarios ?? [])[0] ?? null;
  const rol = usuario?.rol ?? null;

  return {
    id: plain.id_colaborador,
    nombre: plain.nombre,
    primer_apellido: plain.primer_apellido,
    segundo_apellido: plain.segundo_apellido,
    correo_electronico: plain.correo_electronico,
    identificacion: plain.identificacion,
    fecha_nacimiento: plain.fecha_nacimiento,
    telefono: plain.telefono,
    cantidad_hijos: plain.cantidad_hijos,
    estado: plain.estadoRef
      ? { id: plain.estadoRef.id_estado, nombre: plain.estadoRef.estado }
      : null,
    estado_civil: plain.estadoCivilRef
      ? { id: plain.estadoCivilRef.id_estado_civil, nombre: plain.estadoCivilRef.estado_civil }
      : null,
    direccion: principalDireccion
      ? {
          id: principalDireccion.id_direccion,
          provincia: principalDireccion.provincia?.nombre ?? null,
          canton: principalDireccion.canton?.nombre ?? null,
          distrito: principalDireccion.distrito?.nombre ?? null,
          otros_datos: principalDireccion.otros_datos,
        }
      : null,
    usuario: usuario
      ? {
          id_usuario: usuario.id_usuario,
          username: usuario.username,
          estado: usuario.estado,
          requiere_cambio_contrasena: Boolean(usuario.requiere_cambio_contrasena),
          rol: rol.nombre,
        }
      : null,
  };
}

export async function ensureUniqueIdentificacion(identificacion, excludeId, transaction) {
  const where = excludeId
    ? { identificacion, id_colaborador: { [Op.ne]: excludeId } }
    : { identificacion };
  const exists = await Colaborador.findOne({ where, attributes: ["id_colaborador"], transaction });
  if (exists) throw new Error(`Ya existe un colaborador con identificación ${identificacion}`);
}

export async function findUsuarioPorColaborador(idColaborador, transaction) {
  return Usuario.findOne({ where: { id_colaborador: idColaborador }, transaction });
}

export const empleadoModels = {
  Colaborador,
  Usuario,
  Rol,
  Estado,
  EstadoCivil,
  Direccion,
  Provincia,
  Canton,
  Distrito,
};

