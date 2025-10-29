import bcrypt from "bcrypt";
import { genJWT } from "../../../common/genJWT.js";
import { parseToCostaRica } from "../../../common/parseDatestoCR.js";
import { Usuario, Rol, Colaborador } from "../../../models/index.js";
/**
 * Autenticar Usuario
 * 
 * @param {String<obj>} {username , password }
 * @returns {Promise<{ usuario }>}
 */
export const autenticarUsuario = async ({username, password}) => {
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
        model: Colaborador
      }
    ]
  });

  if (!user) throw new Error("Credenciales incorrectas, por favor verifique e ingrese de nuevo sus datos.");

  const isPasswordValid = await bcrypt.compare(password, user.get('contrasena_hash'));

  if (!isPasswordValid) {
    throw new Error(
      'Contraseña incorrecta, por favor verifique e ingrese de nuevo sus datos.'
    );
  }
  const access_token = genJWT(user);

  return {
    id: user.id_usuario,
    access_token,
    usuario: user.username,
    correo: user.correo_electronico,
    genero: user.genero,
    fecha_nacimiento: parseToCostaRica(user.colaborador.fecha_nacimiento, "YYYY-MM-DD"),
    fecha_ingreso: parseToCostaRica(user.colaborador.fecha_ingreso),
    req_cambio_password: Boolean(user.req_cambio_pass),
    ultimo_cambio_password: parseToCostaRica(user.ultimo_cambio_pass),
    nombre: user.colaborador.nombre,
    p_apellido: user.colaborador.primer_apellido,
    s_apellido: user.colaborador.segundo_apellido,
    rol: user.roles,
    activo: user.activo
  };
};