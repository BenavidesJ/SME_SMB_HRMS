import bcrypt from "bcrypt";
import { Colaborador, sequelize, Usuario } from "../../../models/index.js";
import { generateTempPassword } from "../../../common/genTempPassword.js";
import { plantillaEmailResetContrasena } from "../../../common/htmlLayouts/plantillaEmailResetContrasena.js";
import { sendEmail } from "../../../services/mail.js";

/**
 * Reset de contraseña olvidada
 * 
 * @param {string} params.username username del usuario
 */
export const resetPasswordOlvidado = async (username) => {
  const tx = await sequelize.transaction();
  try {
    if (!username) throw new Error("El username es obligatorio.");

    const userAccount = await Usuario.findOne({
      where: {
        username
      },
      include: [
        {
          model: Colaborador,
          as: "colaborador",
          attributes: [
            "correo_electronico",
            "nombre",
            "primer_apellido",
            "segundo_apellido",
          ]
        }
      ],
      transaction: tx,
    });

    if (!userAccount) {
      throw new Error("El usuario no existe. Por favor revise la información ingresada");
    }

    const temporalPass = generateTempPassword(12);
    const contrasena_hash = await bcrypt.hash(temporalPass, 10);

    await Usuario.update(
      {
        contrasena_hash,
        requiere_cambio_contrasena: true
      },
      {
        where: { username },
        transaction: tx,
      }
    );

    await tx.commit();


    const data = {
      nombre: userAccount.colaborador.nombre,
      primer_apellido: userAccount.colaborador.primer_apellido,
      segundo_apellido: userAccount.colaborador.segundo_apellido,
      username: userAccount.username,
      temporalPass
    };

    await sendEmail({
      recipient: userAccount.colaborador.correo_electronico,
      subject: "Reset de contraseña",
      message: plantillaEmailResetContrasena(data)
    })
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};