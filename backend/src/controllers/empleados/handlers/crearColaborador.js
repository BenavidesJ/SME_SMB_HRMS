import bcrypt from "bcrypt";
import dayjs from "dayjs";
import { sendEmail } from "../../../services/mail.js";
import { Usuario, Rol, Colaborador, sequelize } from "../../../models/index.js";
import { plantillaEmailBienvenida } from "../../../common/htmlLayouts/plantillaEmailBienvenida.js";
import { generateTempPassword } from "../../../common/genTempPassword.js";
import { generateUsername } from "../../../common/genUsername.js";

/**
 * Crear Colaborador
 * 
 * @param {String<obj>} { 
 *      nombre, 
 *      primer_apellido,
 *      segundo_apellido,
 *      nacionalidad,
 *      genero,
 *      identificacion,
 *      fecha_nacimiento,
 *      correo_electronico,
 *      fecha_ingreso,
 *      rol 
 *  }
 * @returns {Promise<{ colaborador }>}
 */
export const crearColaborador = async (
  {
    nombre,
    primer_apellido,
    segundo_apellido,
    nacionalidad,
    genero,
    identificacion,
    fecha_nacimiento,
    correo_electronico,
    fecha_ingreso,
    rol
  }) => {

  const tx = await sequelize.transaction();

  try {
    const userExists = await Colaborador.findOne({
      where: { identificacion },
      transaction: tx
    })

    if (userExists) throw new Error(`Ya existe un colaborador con el número de identificación: ${identificacion}`)

    const employee = await Colaborador.create({
      nombre,
      primer_apellido,
      segundo_apellido,
      nacionalidad,
      genero,
      identificacion,
      fecha_nacimiento,
      correo_electronico,
      fecha_ingreso,
    }, { transaction: tx });

    const foundRole = await Rol.findOne({
      where: { nombre: String(rol).toUpperCase() },
      transaction: tx
    });

    if (!foundRole) {
      throw new Error(`El rol: '${rol}' no existe.`);
    }

    const username = generateUsername(nombre, primer_apellido, identificacion);
    const temporalPass = generateTempPassword(12);
    const contrasena_hash = await bcrypt.hash(temporalPass, 10);

    const user = await Usuario.create({
      username,
      contrasena_hash,
      activo: true,
      requiere_cambio_contrasena: true,
      ultimo_acceso_en: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      id_colaborador: employee.id_colaborador
    }, { transaction: tx })

    await user.addRol(foundRole, { transaction: tx });

    await sendEmail({
      recipient: correo_electronico,
      subject: "Bienvenido a BioAlquimia!",
      message: plantillaEmailBienvenida({ nombre, primer_apellido, segundo_apellido, username, temporalPass })
    })

    await tx.commit();

    return {
      id: employee.id_colaborador,
      username,
      rol_asignado: rol,
    };
  } catch (error) {
    await tx.rollback();
  }
};