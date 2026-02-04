import { Op } from "sequelize";
import { runInTransaction } from "../../shared/transaction.js";
import {
  requirePositiveInt,
  ensurePatchHasAllowedFields,
  optionalUppercaseString,
} from "../../shared/validators.js";
import {
  empleadoModels,
  sanitizeNombre,
  sanitizeIdentificacion,
  sanitizeFechaNacimiento,
  sanitizeCorreo,
  sanitizeTelefono,
  sanitizeCantidadHijos,
  resolveEstadoCivil,
  resolveEstado,
  resolveDireccionPayload,
  ensureUniqueIdentificacion,
  fetchEmpleadoById,
  findUsuarioPorColaborador,
} from "./shared.js";

const { Colaborador, Direccion, Rol } = empleadoModels;

export const updateEmpleado = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const empleadoId = requirePositiveInt(id, "id");
    const payload = patch ?? {};

    ensurePatchHasAllowedFields(payload, [
      "nombre",
      "primer_apellido",
      "segundo_apellido",
      "identificacion",
      "fecha_nacimiento",
      "correo_electronico",
      "telefono",
      "cantidad_hijos",
      "estado_civil",
      "estado",
      "direccion",
      "rol",
    ]);

    const colaborador = await Colaborador.findByPk(empleadoId, { transaction });
    if (!colaborador) throw new Error(`No existe colaborador con id ${empleadoId}`);

    const updates = {};

    if (payload.nombre !== undefined) updates.nombre = sanitizeNombre(payload.nombre, "nombre");
    if (payload.primer_apellido !== undefined)
      updates.primer_apellido = sanitizeNombre(payload.primer_apellido, "primer_apellido");
    if (payload.segundo_apellido !== undefined)
      updates.segundo_apellido = sanitizeNombre(payload.segundo_apellido, "segundo_apellido");

    if (payload.identificacion !== undefined) {
      const nuevaIdentificacion = sanitizeIdentificacion(payload.identificacion);
      await ensureUniqueIdentificacion(nuevaIdentificacion, empleadoId, transaction);
      updates.identificacion = nuevaIdentificacion;
    }

    if (payload.fecha_nacimiento !== undefined) {
      updates.fecha_nacimiento = sanitizeFechaNacimiento(payload.fecha_nacimiento);
    }

    if (payload.correo_electronico !== undefined) {
      updates.correo_electronico = sanitizeCorreo(payload.correo_electronico);
    }

    if (payload.telefono !== undefined) {
      updates.telefono = sanitizeTelefono(payload.telefono);
    }

    if (payload.cantidad_hijos !== undefined) {
      updates.cantidad_hijos = sanitizeCantidadHijos(payload.cantidad_hijos);
    }

    if (payload.estado_civil !== undefined) {
      const estadoCivil = await resolveEstadoCivil(payload.estado_civil, transaction);
      updates.estado_civil = estadoCivil.id_estado_civil;
    }

    if (payload.estado !== undefined) {
      const estado = await resolveEstado(payload.estado, transaction);
      updates.estado = estado.id_estado;
    }

    if (Object.keys(updates).length > 0) {
      await colaborador.update(updates, { transaction });
    }

    if (payload.direccion !== undefined) {
      if (payload.direccion === null) {
        await Direccion.destroy({
          where: { id_colaborador: empleadoId },
          transaction,
        });
      } else {
        const direccionPayload = await resolveDireccionPayload(payload.direccion, transaction);
        const currentDireccion = await Direccion.findOne({
          where: { id_colaborador: empleadoId, es_principal: true },
          transaction,
        });

        const direccionData = {
          id_colaborador: empleadoId,
          id_provincia: direccionPayload.provincia.id_provincia,
          id_canton: direccionPayload.canton.id_canton,
          id_distrito: direccionPayload.distrito.id_distrito,
          otros_datos: direccionPayload.otrosDatos,
          es_principal: true,
        };

        if (currentDireccion) {
          await currentDireccion.update(direccionData, { transaction });
        } else {
          await Direccion.create(direccionData, { transaction });
        }
      }
    }

    if (payload.rol !== undefined) {
      const usuario = await findUsuarioPorColaborador(empleadoId, transaction);
      if (!usuario) throw new Error("El colaborador no tiene usuario asociado");

      if (payload.rol === null) {
        await Rol.destroy({ where: { id_usuario: usuario.id_usuario }, transaction });
      } else {
        const rolNombre = optionalUppercaseString(payload.rol, "rol");
        await Rol.destroy({ where: { id_usuario: usuario.id_usuario, nombre: { [Op.ne]: rolNombre } }, transaction });
        await Rol.findOrCreate({
          where: { id_usuario: usuario.id_usuario, nombre: rolNombre },
          defaults: { id_usuario: usuario.id_usuario, nombre: rolNombre },
          transaction,
        });
      }
    }

    const empleado = await fetchEmpleadoById(empleadoId, transaction);
    if (!empleado) throw new Error(`No existe colaborador con id ${empleadoId}`);
    return empleado;
  });
