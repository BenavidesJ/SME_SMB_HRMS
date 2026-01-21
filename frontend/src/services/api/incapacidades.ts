import api from "./api";
import type { ApiResponse } from "../../types";

interface TipoIncapacidad {
  id: number;
  nombre: string;
  descripcion: string;
}

export const getTipoIncapacidad = (id: number) => {
  return api.get<ApiResponse<TipoIncapacidad>>(`incapacidades/tipos/${id}`);
};

export const deleteTipoIncapacidad = (id: number) => {
  return api.delete(`generos/${id}`);
};
