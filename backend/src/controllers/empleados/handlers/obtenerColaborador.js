import { Colaborador, Usuario, Rol } from "../../../models/index.js";

/**
 * Obtiene los datos de un colaborador y su usuario asociado.
 * 
 * @param {{ id: number }} params
 * @returns {Promise<object>}
 */
export const obtenerColaboradorPorIdUsuario = async ({ id }) => {
  const user = await Usuario.findByPk(id, {
    include: [
      {
        model: Colaborador,
        as: "colaborador",
      },
      {
        model: Rol,
        as: "roles",
        attributes: ["nombre"],
        through: { attributes: [] },
      },
    ],
  });

  if (!user) throw new Error(`El colaborador con id de usuario: ${id} no existe`);

  const employee = user.colaborador;

  return {
    id: employee.id_colaborador,
    nombre: employee.nombre,
    primer_apellido: employee.primer_apellido,
    segundo_apellido: employee.segundo_apellido,
    correo_electronico: employee.correo_electronico,
    nacionalidad: employee.nacionalidad,
    identificacion: employee.identificacion,
    genero: employee.genero,
    fecha_ingreso: employee.fecha_ingreso,
    fecha_nacimiento: employee.fecha_nacimiento,
    usuario: user
      ? {
        id_usuario: user.id_usuario,
        username: user.username,
        activo: user.activo,
        roles: user.roles?.map((r) => r.nombre) || [],
      }
      : {},
  };
};
