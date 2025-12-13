import bcrypt from "bcrypt";
import { Usuario } from "../../../models/index.js";

/**
 * Cambio de contraseña
 * 
 * @param {String<obj>} { id, password_anterior, password_nuevo }
 */
export const cambiarPassword = async ({
  id,
  password_anterior,
  password_nuevo
}) => {
  if (!password_anterior) throw new Error("La contraseña actual es obligatoria.");
  if (!password_nuevo) throw new Error("La contraseña nueva es obligatoria.");

  const user = await Usuario.findByPk(id);

  if (!user) {
    throw new Error("El usuario no existe.");
  }

  const passwordMatch = await bcrypt.compare(
    password_anterior,
    user.contrasena_hash
  );

  if (!passwordMatch) {
    throw new Error(
      "La contraseña actual es incorrecta. Si la olvidó, solicite un reinicio; o bien contacte a soporte o administración."
    );
  }

  const newPasswordHash = await bcrypt.hash(password_nuevo, 10);

  await Usuario.update(
    {
      contrasena_hash: newPasswordHash,
      requiere_cambio_contrasena: false
    },
    {
      where: { id_usuario: id }
    }
  );
};