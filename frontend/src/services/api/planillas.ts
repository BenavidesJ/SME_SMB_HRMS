import api from "./api";

export const deletePeriodoPlanilla = (id: number) => {
  return api.delete(`planillas/periodo_planilla/${id}`);
};