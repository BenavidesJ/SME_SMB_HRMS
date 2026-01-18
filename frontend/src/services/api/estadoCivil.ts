import api from "./api";

export const deleteMaritalStatus = (id: number) => {
  return api.delete(`estado_civil/${id}`);
};