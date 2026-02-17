import { runInTransaction } from "../../../shared/transaction.js";
import { contractInclude, ensureColaboradorExists, serializeContract } from "../helpers/shared.js";
import { models } from "../../../../../models/index.js";

export const listContractsByColaborador = ({ id }) =>
  runInTransaction(async (transaction) => {
    const colaborador = await ensureColaboradorExists(id, transaction);

    const contratos = await models.Contrato.findAll({
      where: { id_colaborador: colaborador.id_colaborador },
      include: contractInclude,
      order: [["fecha_inicio", "DESC"], ["id_contrato", "DESC"]],
      transaction,
    });

    return contratos.map(serializeContract);
  });
