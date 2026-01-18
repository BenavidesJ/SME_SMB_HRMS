import type { ApiResponse } from "./ApiResponse";

export type ISODate = string;
export type ISODateTime = string;

export interface TipoHx {
  id: number;
  nombre: string;
  multiplicador: string;
}

export interface EstadoSolicitud {
  id: number;
  estado: string;
}

export interface ColaboradorLite {
  id: number;
  nombre_completo: string;
  correo: string;
}

export interface SolicitudHoraExtra {
  id_solicitud_hx: number;
  fecha_solicitud: ISODateTime;
  fecha_trabajo: ISODate;
  horas_solicitadas: string;
  justificacion: string;
  tipo_hx: TipoHx;
  estado: EstadoSolicitud;
  colaborador: ColaboradorLite;
}

export type Agrupamiento =
  | "fecha_solicitud"
  | "estado"
  | "id_colaborador"
  | string;

export interface DataListaSolicitudes {
  agrupamiento: Agrupamiento;
  total: number;
  items: SolicitudHoraExtra[];
}

export interface GrupoSolicitudes<TKey extends string | number = string | number> {
  clave: TKey;
  etiqueta: string;
  cantidad: number;
  items: SolicitudHoraExtra[];
}

export interface DataSolicitudesAgrupadas<TKey extends string | number = string | number> {
  agrupamiento: Agrupamiento;
  total: number;
  grupos: GrupoSolicitudes<TKey>[];
}

export type DataConsultaSolicitudes =
  | DataListaSolicitudes
  | DataSolicitudesAgrupadas;

export type HorasExtraSolicitudesResponse = ApiResponse<DataConsultaSolicitudes>;

export const isAgrupada = (
  d: DataConsultaSolicitudes
): d is DataSolicitudesAgrupadas => "grupos" in d;

export const isLista = (
  d: DataConsultaSolicitudes
): d is DataListaSolicitudes => "items" in d;

export type Modo = "reciente" | "por_estado" | "por_colaborador";

export type SolicitudesQuery = {
  modo: Modo;
  estado?: string;
  id_colaborador?: number;
};
