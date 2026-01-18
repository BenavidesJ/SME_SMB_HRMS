import api from "./api";
import type { ApiResponse } from "../../types";

export type TipoContratoRow = {
  id_tipo_contrato: number;
  tipo_contrato: string;
};

export type TipoContratoCreatePayload = { tipo: string };
export type TipoContratoPatchPayload = { tipo_contrato: string };

export const getAllContractTypesFull = () => {
  return api.get<ApiResponse<TipoContratoRow[]>>("tipos_contrato");
};

export const getContractTypeById = (id: number) => {
  return api.get<ApiResponse<TipoContratoRow>>(`tipos_contrato/${id}`);
};

export const createContractType = (payload: TipoContratoCreatePayload) => {
  return api.post("tipos_contrato", payload);
};

export const patchContractType = (id: number, payload: TipoContratoPatchPayload) => {
  return api.patch(`tipos_contrato/${id}`, payload);
};

export const deleteContractType = (id: number) => {
  return api.delete(`tipos_contrato/${id}`);
};
