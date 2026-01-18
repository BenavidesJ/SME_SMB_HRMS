import api from "./api";

export const deleteStatus = (id: number) => {
  return api.delete(`estados/${id}`);
};
