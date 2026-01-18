import api from "./api";
import type { ApiResponse, Gender } from "../../types";

export const getAllGenders = () => {
  return api.get<ApiResponse<Gender[]>>("generos");
};

export const createGender = (payload: { genero: string }) => {
  return api.post("generos", payload);
};

export const patchGender = (id: number, payload: { genero: string }) => {
  return api.patch(`generos/${id}`, payload);
};

export const deleteGender = (id: number) => {
  return api.delete(`generos/${id}`);
};
