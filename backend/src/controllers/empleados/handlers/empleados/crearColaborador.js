import bcrypt from "bcrypt";
import dayjs from "dayjs";
import { sendEmail } from "../../../../services/mail.js";
import { Usuario, Rol, Colaborador, Telefono, sequelize, Genero, EstadoCivil } from "../../../../models/index.js";
import { plantillaEmailBienvenida } from "../../../../common/htmlLayouts/plantillaEmailBienvenida.js";
import { generateTempPassword } from "../../../../common/genTempPassword.js";
import { generateUsername } from "../../../../common/genUsername.js";

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
 *      telefono, 
 *      rol,
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
    telefono,
    rol
  }) => {

  const tx = await sequelize.transaction();

  try {
    const exists = await Colaborador.findOne({
      where: { identificacion },
      transaction: tx
    })

    if (exists) throw new Error(`Ya existe un colaborador con el número de identificación: ${identificacion}`)

    const genderValue = genero?.trim().toUpperCase();
    const maritalStatusValue = estado_civil?.trim().toUpperCase();
    const roleValue = rol?.trim().toUpperCase();

    const [gender, maritalStatus, foundRole] = await Promise.all([
      Genero.findOne({
        where: { genero: genderValue },
        transaction: tx
      }),
      EstadoCivil.findOne({ where: { estado_civil: maritalStatusValue }, transaction: tx }),
      Rol.findOne({
        where: { nombre: roleValue },
        transaction: tx
      })
    ])

    if (!gender) {
      throw new Error(`El género '${genero}' no existe.`);
    }

    if (!maritalStatus) {
      throw new Error(`El estado civil '${estado_civil}' no existe.`);
    }

    if (!foundRole) {
      throw new Error(`El rol '${rol}' no existe.`);
    }

    const employee = await Colaborador.create({
      nombre,
      primer_apellido,
      segundo_apellido,
      id_genero: gender.id_genero,
      identificacion,
      fecha_nacimiento,
      correo_electronico,
      fecha_ingreso,
      cantidad_hijos,
      estado_civil: maritalStatus.id_estado_civil,
      estado: 1
    }, { transaction: tx });

    if (telefono != null && String(telefono).trim() !== "") {
      await Telefono.create(
        {
          id_colaborador: employee.id_colaborador,
          numero: Number(telefono),
          es_principal: true,
        },
        { transaction: tx }
      );
    }

    const username = generateUsername(nombre, primer_apellido, identificacion);
    const temporalPass = generateTempPassword(12);
    const contrasena_hash = await bcrypt.hash(temporalPass, 10);

    const user = await Usuario.create({
      username,
      contrasena_hash,
      requiere_cambio_contrasena: true,
      ultimo_acceso_en: dayjs().toDate(),
      id_colaborador: employee.id_colaborador,
      estado: 1,
    }, { transaction: tx })

    await user.addRol(foundRole, { transaction: tx });

    await tx.commit();

    await sendEmail({
      recipient: correo_electronico,
      subject: "Bienvenido a BioAlquimia!",
      message: plantillaEmailBienvenida({ nombre, primer_apellido, segundo_apellido, username, temporalPass })
    })

    return {
      id: employee.id_colaborador,
      username,
      rol_asignado: rol,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};