import api from "./api";

export const deleteDepartment = (id: number) => {
  return api.delete(`mantenimientos/departamentos/${id}`);
};
