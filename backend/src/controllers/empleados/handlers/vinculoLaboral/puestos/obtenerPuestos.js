import { Departamento, Estado, Puesto } from "../../../../../models/index.js";



export const obtenerPuestos = async () => {
  const puestos = await Puesto.findAll({
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
    order: [["id_puesto", "DESC"]],
  });

  return puestos.map((p) => ({
    id: p.id_puesto,
    puesto: p.nombre,
    departamento: p.departamentoPuesto?.nombre,
    salario_ref_minimo: p.sal_base_referencia_min,
    salario_ref_maximo: p.sal_base_referencia_max,
    estado: p.estadoPuesto?.estado,
  }));
};
