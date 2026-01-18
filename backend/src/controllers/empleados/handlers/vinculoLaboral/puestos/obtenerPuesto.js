import { Departamento, Estado, Puesto } from "../../../../../models/index.js";

/**
 * Devuelve un puesto por su id_puesto
 *
 * @param {{ id: number|string }} params
 * @returns {Promise<object>}
 */
export const obtenerPuestoPorId = async ({ id }) => {
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error("id inválido; debe ser un entero positivo");
  }

  const puesto = await Puesto.findByPk(pid, {
    attributes: [
      "id_puesto",
      "nombre",
      "sal_base_referencia_min",
      "sal_base_referencia_max",
      "estado",
    ],
    include: [
      {
        model: Departamento,
        as: "departamentoPuesto",
        attributes: ["nombre"],
        required: false,
      },
      {
        model: Estado,
        as: "estadoPuesto",
        attributes: ["estado"],
        required: false,
      },
    ],
  });

  if (!puesto) {
    throw new Error(`No existe un puesto con id ${pid}`);
  }

  return {
    id: puesto.id_puesto,
    puesto: puesto.nombre,
    departamento: puesto.departamentoPuesto?.nombre ?? null,
    salario_ref_minimo: puesto.sal_base_referencia_min,
    salario_ref_maximo: puesto.sal_base_referencia_max,
    estado: puesto.estadoPuesto?.estado ?? null,
  };
};
