import api from "./api";

export const deleteTipoJornada = (id: number) => {
  return api.delete(`tipos_jornada/${id}`);
};
