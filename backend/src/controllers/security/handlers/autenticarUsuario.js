import bcrypt from "bcrypt";
import { genJWT } from "../../../common/genJWT.js";
import { Usuario, Rol, Colaborador } from "../../../models/index.js";

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
    include: [
      {
        model: Rol,
        as: "roles",
        attributes: ["nombre"],
        through: { attributes: [] }
      },
      {
        model: Colaborador,
        as: "colaborador"
      }
    ]
  });

  if (!user) throw new Error("Credenciales incorrectas, por favor verifique e ingrese de nuevo sus datos.");
  if (!user.activo) throw new Error("El usuario está inactivo. Contacte al administrador.");

  const isPasswordValid = await bcrypt.compare(password, user.get('contrasena_hash'));

  if (!isPasswordValid) {
    throw new Error(
      'Contraseña incorrecta, por favor verifique e ingrese de nuevo sus datos.'
    );
  }
  const payload = {
    id: user.id_usuario,
    roles: user.roles.map(r => r.nombre),
  };
  const access_token = genJWT(payload);

  return {
    access_token,
  };
};