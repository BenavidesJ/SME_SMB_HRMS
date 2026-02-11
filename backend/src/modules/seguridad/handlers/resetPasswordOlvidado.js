import bcrypt from "bcrypt";
import { generateTempPassword } from "../../../common/genTempPassword.js";
import { plantillaEmailResetContrasena } from "../../../common/plantillasEmail/emailTemplate.js";
import { models, sequelize } from "../../../models/index.js";
import { sendEmail } from "../../../services/mail.js";
import { requireNonEmptyString } from "../../mantenimientos_consultas/shared/validators.js";

export const resetPasswordOlvidado = async ({ username }) => {
	const normalizedUsername = requireNonEmptyString(username, "username");

	const transaction = await sequelize.transaction();
	try {
		const userAccount = await models.Usuario.findOne({
			where: { username: normalizedUsername },
			include: [
				{
					model: models.Colaborador,
					as: "colaborador",
					attributes: ["correo_electronico", "nombre", "primer_apellido", "segundo_apellido"],
				},
			],
			transaction,
		});

		if (!userAccount) {
			throw new Error("El usuario no existe. Por favor revise la información ingresada");
		}

		const temporalPass = generateTempPassword(12);
		const contrasena_hash = await bcrypt.hash(temporalPass, 10);

		await userAccount.update(
			{
				contrasena_hash,
				requiere_cambio_contrasena: true,
			},
			{ transaction }
		);

		await transaction.commit();

		const data = {
			nombre: userAccount.colaborador?.nombre ?? "",
			primer_apellido: userAccount.colaborador?.primer_apellido ?? "",
			segundo_apellido: userAccount.colaborador?.segundo_apellido ?? "",
			username: userAccount.username,
			temporalPass,
		};

		await sendEmail({
			recipient: userAccount.colaborador?.correo_electronico,
			subject: "Reset de contraseña",
			message: plantillaEmailResetContrasena(data),
		});

		return { username: normalizedUsername };
	} catch (error) {
		await transaction.rollback();
		throw error;
	}
};
