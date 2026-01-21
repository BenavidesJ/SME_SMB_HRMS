import dayjs from "dayjs";
import {
  Colaborador,
  Usuario,
  Rol,
  Genero,
  EstadoCivil,
  Estado,
  Telefono,
  Direccion,
  Provincia,
  Canton,
  Distrito,
} from "../../../../models/index.js";

/**
 * Obtiene el "full empleado" por id_colaborador.
 *
 * @param {{ id_colaborador: number|string }} params
 * @returns {Promise<object>}
 */
export const obtenerFullEmpleadoPorIdColaborador = async ({ id_colaborador }) => {

  if (
    id_colaborador === undefined ||
    id_colaborador === null ||
    String(id_colaborador).trim() === ""
  ) {
    throw new Error("El parámetro id_colaborador es obligatorio");
  }

  const id = Number(id_colaborador);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("id_colaborador debe ser un número entero válido");
  }


  const colaborador = await Colaborador.findByPk(id, {
    attributes: [
      "id_colaborador",
      "nombre",
      "primer_apellido",
      "segundo_apellido",
      "correo_electronico",
      "identificacion",
      "fecha_ingreso",
      "fecha_nacimiento",
      "cantidad_hijos",
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
        model: Telefono,
        as: "telefonoColaborador",
        attributes: ["id_telefono", "numero", "es_principal"],
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
          { model: Rol, attributes: ["nombre"], through: { attributes: [] }, required: false },
          { model: Estado, as: "estadoUsuario", attributes: ["estado"], required: false },
        ],
      },
    ],
  });

  if (!colaborador) {
    throw new Error(`No existe un colaborador con id ${id}`);
  }


  const telefonos = colaborador.telefonoColaborador ?? [];
  const telPrincipal = telefonos.find((t) => t.es_principal) ?? telefonos[0] ?? null;


  const usuarios = colaborador.Usuarios ?? colaborador.usuarios ?? [];
  const user = usuarios[0] ?? null;


  const direccionDb = await Direccion.findOne({
    where: {
      id_colaborador: colaborador.id_colaborador,
      es_principal: true,
    },
    attributes: ["id_direccion", "id_provincia", "id_canton", "id_distrito", "otros_datos", "es_principal", "estado"],
    order: [["id_direccion", "DESC"]],
  });

  let direccion = null;

  if (direccionDb) {
    const [prov, cant, dist, estadoDir] = await Promise.all([
      Provincia.findByPk(direccionDb.id_provincia, { attributes: ["id_provincia", "nombre"] }),
      Canton.findByPk(direccionDb.id_canton, { attributes: ["id_canton", "nombre"] }),
      Distrito.findByPk(direccionDb.id_distrito, { attributes: ["id_distrito", "nombre"] }),
      Estado.findByPk(direccionDb.estado, { attributes: ["id_estado", "estado"] }),
    ]);

    direccion = {
      id_direccion: direccionDb.id_direccion,
      provincia: prov?.nombre ?? null,
      canton: cant?.nombre ?? null,
      distrito: dist?.nombre ?? null,
      otros_datos: direccionDb.otros_datos,
      es_principal: direccionDb.es_principal,
      estado: estadoDir?.estado ?? direccionDb.estado,
    };
  }


  return {
    id: colaborador.id_colaborador,
    nombre: colaborador.nombre,
    primer_apellido: colaborador.primer_apellido,
    segundo_apellido: colaborador.segundo_apellido,
    correo_electronico: colaborador.correo_electronico,
    identificacion: colaborador.identificacion,

    genero: colaborador.Genero?.genero ?? colaborador.genero?.genero ?? null,
    estado_civil: colaborador.estadoCivil?.estado_civil ?? null,

    fecha_ingreso: colaborador.fecha_ingreso ? dayjs(colaborador.fecha_ingreso).format("YYYY-MM-DD") : null,
    fecha_nacimiento: colaborador.fecha_nacimiento ? dayjs(colaborador.fecha_nacimiento).format("YYYY-MM-DD") : null,

    cantidad_hijos: colaborador.cantidad_hijos ?? 0,

    estado: colaborador.estadoColaborador?.estado ?? colaborador.estado,

    telefono: telPrincipal?.numero ?? "",

    direccion, 

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
};
