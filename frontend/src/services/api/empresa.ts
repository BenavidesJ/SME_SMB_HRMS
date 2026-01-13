import api from "./api";

export const deleteDepartment = (id: number) => {
  return api.delete(`departamentos/${id}`);
};
