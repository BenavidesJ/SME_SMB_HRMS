import { requirePositiveInt } from "../../shared/validators.js";
import { fetchEmpleados, fetchEmpleadoById } from "./shared.js";

export const listEmpleados = async () => fetchEmpleados();

export const getEmpleado = async ({ id }) => {
  const empleadoId = requirePositiveInt(id, "id");
  const empleado = await fetchEmpleadoById(empleadoId);
  if (!empleado) throw new Error(`No existe colaborador con id ${empleadoId}`);
  return empleado;
};
