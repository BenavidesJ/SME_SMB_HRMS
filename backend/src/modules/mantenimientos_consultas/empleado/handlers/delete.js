import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";
import {
  empleadoModels,
  ensureEstado,
  fetchEmpleadoById,
} from "./shared.js";

const { Colaborador, Usuario } = empleadoModels;

export const deleteEmpleado = ({ id }) =>
  runInTransaction(async (transaction) => {
    const empleadoId = requirePositiveInt(id, "id");

    const colaborador = await Colaborador.findByPk(empleadoId, { transaction });
    if (!colaborador) throw new Error(`No existe colaborador con id ${empleadoId}`);

    const estadoInactivo = await ensureEstado("INACTIVO", transaction);
    await colaborador.update({ estado: estadoInactivo.id_estado }, { transaction });

    const usuarios = await Usuario.findAll({ where: { id_colaborador: empleadoId }, transaction });
    if (usuarios.length > 0) {
      await Promise.all(
        usuarios.map((usuario) =>
          usuario.update({ estado: estadoInactivo.id_estado }, { transaction })
        ),
      );
    }

    const empleado = await fetchEmpleadoById(empleadoId, transaction);
    if (!empleado) throw new Error(`No existe colaborador con id ${empleadoId}`);
    return empleado;
  });
