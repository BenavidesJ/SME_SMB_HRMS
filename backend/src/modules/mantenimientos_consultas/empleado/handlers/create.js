import bcrypt from "bcrypt";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString, requireUppercaseString } from "../../shared/validators.js";
import { generateTempPassword } from "../../../../common/genTempPassword.js";
import { generateUsername } from "../../../../common/genUsername.js";
import { plantillaEmailBienvenida } from "../../../../common/htmlLayouts/plantillaEmailBienvenida.js";
import { sendEmail } from "../../../../services/mail.js";
import {
  empleadoModels,
  sanitizeNombre,
  sanitizeIdentificacion,
  sanitizeFechaNacimiento,
  sanitizeCorreo,
  sanitizeTelefono,
  sanitizeCantidadHijos,
  resolveEstadoCivil,
  ensureEstado,
  resolveDireccionPayload,
  ensureUniqueIdentificacion,
  fetchEmpleadoById,
} from "./shared.js";

const { Colaborador, Usuario, Rol } = empleadoModels;

export const createEmpleado = (payload) =>
  runInTransaction(async (transaction) => {
    const nombre = sanitizeNombre(payload.nombre, "nombre");
    const primerApellido = sanitizeNombre(payload.primer_apellido, "primer_apellido");
    const segundoApellido = sanitizeNombre(payload.segundo_apellido, "segundo_apellido");
    const identificacion = sanitizeIdentificacion(payload.identificacion);
    const fechaNacimiento = sanitizeFechaNacimiento(payload.fecha_nacimiento);
    const correo = sanitizeCorreo(payload.correo_electronico);
    const telefono = sanitizeTelefono(payload.telefono);
    const cantidadHijos = sanitizeCantidadHijos(payload.cantidad_hijos);
    const estadoCivil = await resolveEstadoCivil(payload.estado_civil, transaction);
    const estadoActivo = await ensureEstado("ACTIVO", transaction);

    await ensureUniqueIdentificacion(identificacion, null, transaction);

    const direccionPayload = payload.direccion
      ? await resolveDireccionPayload(payload.direccion, transaction)
      : null;

    const rolNombre = requireUppercaseString(payload.rol ?? "EMPLEADO", "rol");

    const colaborador = await Colaborador.create(
      {
        nombre,
        primer_apellido: primerApellido,
        segundo_apellido: segundoApellido,
        identificacion,
        fecha_nacimiento: fechaNacimiento,
        correo_electronico: correo,
        telefono,
        cantidad_hijos: cantidadHijos,
        estado_civil: estadoCivil.id_estado_civil,
        estado: estadoActivo.id_estado,
      },
      { transaction },
    );

    if (direccionPayload) {
      await empleadoModels.Direccion.create(
        {
          id_colaborador: colaborador.id_colaborador,
          id_provincia: direccionPayload.provincia.id_provincia,
          id_canton: direccionPayload.canton.id_canton,
          id_distrito: direccionPayload.distrito.id_distrito,
          otros_datos: direccionPayload.otrosDatos,
          es_principal: true,
        },
        { transaction },
      );
    }

    const username = generateUsername(nombre, primerApellido, String(identificacion));
    const tempPassword = generateTempPassword(12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const usuario = await Usuario.create(
      {
        username,
        contrasena_hash: passwordHash,
        requiere_cambio_contrasena: true,
        id_colaborador: colaborador.id_colaborador,
        estado: estadoActivo.id_estado,
      },
      { transaction },
    );

    await Rol.create(
      {
        id_usuario: usuario.id_usuario,
        nombre: rolNombre,
      },
      { transaction },
    );

    const empleado = await fetchEmpleadoById(colaborador.id_colaborador, transaction);

    const mensaje = plantillaEmailBienvenida({
      nombre,
      primer_apellido: primerApellido,
      segundo_apellido: segundoApellido,
      username,
      temporalPass: tempPassword,
    });

    transaction.afterCommit(async () => {
      try {
        await sendEmail({
          recipient: correo,
          subject: "Bienvenido a BioAlquimia!",
          message: mensaje,
        });
      } catch (error) {
        console.error("[correo] Error al enviar credenciales de empleado:", error);
      }
    });

    return empleado;
  });
