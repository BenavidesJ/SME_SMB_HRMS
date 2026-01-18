import { TipoContrato } from "../../../../../../models/index.js";

export const obtenerTipoContratoPorId = async ({ id }) => {
  const found = await TipoContrato.findByPk(id);

  if (!found) throw new Error(`No existe el tipo de contrato con id: ${id}`);

  return {
    id_tipo_contrato: found.id_tipo_contrato,
    tipo_contrato: found.tipo_contrato,
  };
};
