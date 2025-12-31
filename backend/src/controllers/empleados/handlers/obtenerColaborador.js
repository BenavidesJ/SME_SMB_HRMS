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

/**
 * Obtiene los datos de todos los colaboradores
 *
 * @returns {Promise<Array<object>>}
 */
export const obtenerColaboradores = async () => {
  const colaboradores = await Colaborador.findAll({
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
      "estado",
    ],
    include: [
      {
        model: Genero,
        attributes: ["genero"],
        required: false,
      },

      {
        model: EstadoCivil,
        as: "estadoCivil",
        attributes: ["estado_civil"],
        required: false,
      },

      {
        model: Estado,
        as: "estadoColaborador",
        attributes: ["estado"],
        required: false,
      },

      {
        model: Usuario,
        attributes: [
          "id_usuario",
          "username",
          "estado",
          "requiere_cambio_contrasena",
          "ultimo_acceso_en",
        ],
        required: false,
        include: [
          {
            model: Rol,
            attributes: ["nombre"],
            through: { attributes: [] },
            required: false,
          },
          {
            model: Estado,
            as: "estadoUsuario",
            attributes: ["estado"],
            required: false,
          },
        ],
      },
    ],
    order: [["id_colaborador", "DESC"]],
  });

  return colaboradores.map((c) => {
    const usuarios = c.Usuarios ?? c.usuarios ?? [];
    const user = usuarios[0] ?? null;
    const genero = c.Genero?.genero ?? c.genero?.genero ?? null;

    return {
      id: c.id_colaborador,
      nombre: c.nombre,
      primer_apellido: c.primer_apellido,
      segundo_apellido: c.segundo_apellido,
      correo_electronico: c.correo_electronico,
      identificacion: c.identificacion,

      genero,
      estado_civil: c.estadoCivil?.estado_civil ?? null,

      fecha_ingreso: c.fecha_ingreso ? dayjs(c.fecha_ingreso).format("YYYY-MM-DD") : null,
      fecha_nacimiento: c.fecha_nacimiento ? dayjs(c.fecha_nacimiento).format("YYYY-MM-DD") : null,

      estado: c.estadoColaborador?.estado ?? c.estado,

      usuario: user
        ? {
          id_usuario: user.id_usuario,
          username: user.username,
          activo: user.estado,
          requiere_cambio_contrasena: user.requiere_cambio_contrasena,
          ultimo_acceso: user.ultimo_acceso_en
            ? dayjs(user.ultimo_acceso_en).format("YYYY-MM-DD HH:mm:ss")
            : null,
          roles: (user.Rols ?? user.rols ?? []).map((r) => r.nombre),
          estado_usuario: user.estadoUsuario?.estado ?? null,
        }
        : null,
    };
  });
};
