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

export const extenderIncapacidad = (
  grupo: string,
  data: { fecha_fin: string },
) => {
  return api.patch<ApiResponse<unknown>>(`incapacidades/${grupo}`, data);
};
