import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

const serialize = (puesto) => ({
  id: puesto.id_puesto,
  puesto: puesto.nombre,
  departamento: puesto.departamento?.nombre,
  salario_ref_minimo: puesto.sal_base_referencia_min,
  salario_ref_maximo: puesto.sal_base_referencia_max,
  estado: puesto.estadoRef?.estado,
});

export const listPuestos = async () =>
  (await models.Puesto.findAll({
    include: [
      { model: models.Departamento, as: "departamento", attributes: ["nombre"] },
      { model: models.Estado, as: "estadoRef", attributes: ["estado"] },
    ],
    order: [["id_puesto", "ASC"]],
  })).map(serialize);

export const getPuesto = async ({ id }) => {
  const pid = requirePositiveInt(id, "id");
  const puesto = await models.Puesto.findByPk(pid, {
    include: [
      { model: models.Departamento, as: "departamento", attributes: ["nombre"] },
      { model: models.Estado, as: "estadoRef", attributes: ["estado"] },
    ],
  });
  if (!puesto) throw new Error(`No existe puesto con id ${pid}`);
  return serialize(puesto);
};
