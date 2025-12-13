import dayjs from "dayjs";
import { Colaborador, Usuario, Rol, Estado, EstadoCivil, Genero } from "../../../models/index.js";

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
        attributes: [
          "id_colaborador",
          "nombre",
          "primer_apellido",
          "segundo_apellido",
          "id_genero",
          "correo_electronico",
          "identificacion",
          "fecha_ingreso",
          "fecha_nacimiento",
          "estado_civil",
          "estado"
        ],
      },
      {
        model: Rol,
        attributes: ["nombre"],
        through: { attributes: [] },
      },
      {
        model: Estado,
        as: "estadoUsuario",
        attributes: ["estado"]
      },
    ],
  });

  if (!user) throw new Error(`El colaborador con id de usuario: ${id} no existe`);

  if (!user.colaborador) {
    throw new Error(
      `El usuario con id ${id} no tiene un colaborador asociado.`
    );
  }

  const employee = user.colaborador;
  const employeeGender = await Genero.findByPk(employee.id_genero);
  const employeeMaritalStatus = await EstadoCivil.findByPk(employee.estado_civil);

  return {
    id: employee.id_colaborador,
    nombre: employee.nombre,
    primer_apellido: employee.primer_apellido,
    segundo_apellido: employee.segundo_apellido,
    correo_electronico: employee.correo_electronico,
    identificacion: employee.identificacion,
    genero: employeeGender.genero,
    fecha_ingreso: dayjs(employee.fecha_ingreso).format("DD-MM-YYYY HH:mm:ss"),
    fecha_nacimiento: dayjs(employee.fecha_nacimiento).format("DD-MM-YYYY HH:mm:ss"),
    estado_civil: employeeMaritalStatus.estado_civil,
    usuario: user
      ? {
        id_usuario: user.id_usuario,
        username: user.username,
        activo: user.estado,
        requiere_cambio_contrasena: user.requiere_cambio_contrasena,
        ultimo_acceso: dayjs(user.ultimo_acceso_en).format("DD-MM-YYYY HH:mm:ss"),
        roles: user.rols?.map((r) => r.nombre) || [],
      }
      : {},
  };
};
