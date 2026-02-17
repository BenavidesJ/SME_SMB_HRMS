import bcrypt from "bcrypt";
import { models } from "../../../models/index.js";
import { requireNonEmptyString, requirePositiveInt } from "../../mantenimientos_consultas/shared/validators.js";

export const cambiarPassword = async ({ id, password_anterior, password_nuevo }) => {
	const uid = requirePositiveInt(id, "id_usuario");
	const currentPassword = requireNonEmptyString(password_anterior, "password_anterior");
	const newPassword = requireNonEmptyString(password_nuevo, "password_nuevo");

	const user = await models.Usuario.findByPk(uid);
	if (!user) throw new Error("El usuario no existe.");

	const passwordMatch = await bcrypt.compare(currentPassword, user.contrasena_hash);
	if (!passwordMatch) {
		throw new Error(
			"La contraseña actual es incorrecta. Si la olvidó, solicite un reinicio; o bien contacte a soporte o administración."
		);
	}

	const newPasswordHash = await bcrypt.hash(newPassword, 10);

	await user.update({
		contrasena_hash: newPasswordHash,
		requiere_cambio_contrasena: false,
	});

	return { id: uid };
};
