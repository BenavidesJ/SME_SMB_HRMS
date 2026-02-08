import bcrypt from "bcrypt";
import dayjs from "dayjs";
import { genJWT } from "../../../common/genJWT.js";
import { models } from "../../../models/index.js";
import { requireNonEmptyString } from "../../mantenimientos_consultas/shared/validators.js";

export const autenticarUsuario = async ({ username, password }) => {
	const normalizedUsername = requireNonEmptyString(username, "username");
	const normalizedPassword = requireNonEmptyString(password, "password");

	const user = await models.Usuario.findOne({
		where: { username: normalizedUsername },
		attributes: [
			"id_usuario",
			"username",
			"contrasena_hash",
			"requiere_cambio_contrasena",
			"id_colaborador",
			"estado",
			"id_rol"
		],
		include: [
			{
				model: models.Colaborador,
				as: "colaborador",
				attributes: ["id_colaborador", "nombre", "primer_apellido"],
			},
			{
				model: models.Estado,
				as: "estadoRef",
				attributes: ["estado"],
			},
		],
	});

	if (!user) throw new Error("Credenciales incorrectas, por favor verifique e ingrese de nuevo sus datos.");

	const estado = user.estadoRef?.estado ?? "";
	if (String(estado).trim().toLowerCase() !== "activo") {
		throw new Error("El usuario está inactivo. Contacte al administrador.");
	}

	const passwordValido = await bcrypt.compare(normalizedPassword, user.contrasena_hash);
	if (!passwordValido) {
		throw new Error("Contraseña incorrecta, por favor verifique e ingrese de nuevo sus datos.");
	}

	await user.update({ ultimo_acceso_en: dayjs().format("YYYY-MM-DD HH:mm:ss") });

	const rol = await models.Rol.findByPk(user.id_rol);

	const payload = {
		id: user.id_usuario,
		rol
	};

	const access_token = genJWT(payload);

	return { access_token };
};
