import bcrypt from "bcrypt";
import dayjs from "dayjs";
import { genJWT } from "../../../common/genJWT.js";
import { Usuario, Rol, Colaborador, Estado } from "../../../models/index.js";

/**
 * Autenticar Usuario
 * 
 * @param {String<obj>} {username , password }
 * @returns {Promise<{ usuario }>}
 */
export const autenticarUsuario = async ({ username, password }) => {
  if (!username) throw new Error("El username es obligatorio.");
  if (!password) throw new Error("La contraseña es obligatoria.");

  const user = await Usuario.findOne({
    where: { username },
    attributes: [
      "id_usuario",
      "username",
      "contrasena_hash",
      "requiere_cambio_contrasena",
      "ultimo_acceso_en",
      "id_colaborador",
      "estado",
    ],
    include: [
      {
        model: Rol,
        attributes: ["nombre"],
        through: { attributes: [] }
      },
      {
        model: Colaborador,
        as: "colaborador",
        attributes: ["id_colaborador", "nombre", "primer_apellido"]
      },
      {
        model: Estado,
        as: "estadoUsuario",
        attributes: ["estado"]
      }
    ]
  });

  if (!user) throw new Error("Credenciales incorrectas, por favor verifique e ingrese de nuevo sus datos.");

  if (String(user.estadoUsuario.estado).toLowerCase() !== "activo") throw new Error("El usuario está inactivo. Contacte al administrador.");

  const isPasswordValid = await bcrypt.compare(password, user.contrasena_hash);

  if (!isPasswordValid) {
    throw new Error(
      'Contraseña incorrecta, por favor verifique e ingrese de nuevo sus datos.'
    );
  }

  await user.update({ ultimo_acceso_en: dayjs().format("DD-MM-YYYY HH:mm:ss") });

  const payload = {
    id: user.id_usuario,
    roles: user.rols.map(r => r.nombre),
  };

  const access_token = genJWT(payload);

  return {
    access_token,
  };
};