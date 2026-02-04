import api from "./api";
import type { ApiResponse } from "../../types";

export type TipoContratoRow = {
  id: number;
  tipo_contrato: string;
};

export type TipoContratoCreatePayload = { tipo_contrato: string };
export type TipoContratoPatchPayload = { tipo_contrato: string };

export const getAllContractTypesFull = () => {
  return api.get<ApiResponse<TipoContratoRow[]>>("mantenimientos/tipos-contrato");
};

export const getContractTypeById = (id: number) => {
  return api.get<ApiResponse<TipoContratoRow>>(`mantenimientos/tipos-contrato/${id}`);
};

export const createContractType = (payload: TipoContratoCreatePayload) => {
  return api.post("mantenimientos/tipos-contrato", payload);
};

export const patchContractType = (id: number, payload: TipoContratoPatchPayload) => {
  return api.patch(`mantenimientos/tipos-contrato/${id}`, payload);
};

export const deleteContractType = (id: number) => {
  return api.delete(`mantenimientos/tipos-contrato/${id}`);
};
