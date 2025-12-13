import bcrypt from "bcrypt";
import dayjs from "dayjs";
import { sendEmail } from "../../../services/mail.js";
import { Usuario, Rol, Colaborador, sequelize, Genero } from "../../../models/index.js";
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
 *      id_genero,
 *      identificacion,
 *      fecha_nacimiento,
 *      correo_electronico,
 *      fecha_ingreso,
 *      cantidad_hijos,
 *      estado_civil,
 *      rol 
 *  }
 * @returns {Promise<{ colaborador }>}
 */
export const crearColaborador = async (
  {
    nombre,
    primer_apellido,
    segundo_apellido,
    genero,
    identificacion,
    fecha_nacimiento,
    correo_electronico,
    fecha_ingreso,
    cantidad_hijos,
    estado_civil,
    rol
  }) => {

  const tx = await sequelize.transaction();

  try {
    console.log(identificacion)
    const userExists = await Colaborador.findOne({
      where: { identificacion },
      transaction: tx
    })

    if (userExists) throw new Error(`Ya existe un colaborador con el número de identificación: ${identificacion}`)

    const newEmployeeGender = String(genero).toUpperCase();
    const gender = await Genero.findOne({
      where: { genero: newEmployeeGender },
      transaction: tx
    });
    const maritalStatus = String(estado_civil).toUpperCase();

    const employee = await Colaborador.create({
      nombre,
      primer_apellido,
      segundo_apellido,
      genero: gender,
      identificacion,
      fecha_nacimiento,
      correo_electronico,
      fecha_ingreso,
      cantidad_hijos,
      estado_civil: maritalStatus,
      estado: 1
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
      requiere_cambio_contrasena: true,
      ultimo_acceso_en: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      id_colaborador: employee.id_colaborador,
      estado: 1,
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