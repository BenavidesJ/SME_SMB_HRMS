export type PermisoTipo = "GOCE" | "SIN_GOCE";

export interface PermisoPayload {
  id_colaborador: number;
  id_aprobador: number;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_permiso: PermisoTipo;
  observaciones?: string;
}

export interface PermisoListItem {
  id_solicitud: number;
  id_colaborador: number;
  id_aprobador: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado_solicitud?: string | null;
  con_goce_salarial: boolean;
  cantidad_dias?: string | null;
  cantidad_horas?: string | null;
  tipo_permiso?: string | null;
  tiposSolicitud?: {
    id_tipo_solicitud: number | null;
    tipo_solicitud: string;
    es_permiso: boolean;
    es_licencia: boolean;
  } | null;
  estadoSolicitudPermisos?: {
    id_estado: number;
    estado: string;
  } | null;
  dias_solicitados?: string | null;
  dias_aprobados?: string | null;
  dias_solicitados_detalle?: string[];
  dias_skipped_detalle?: Array<{
    date: string;
    reason: string;
    holiday: string | null;
  }>;
  observaciones?: string | null;
  colaborador?: {
    id_colaborador: number;
    nombre: string | null;
    primer_apellido: string | null;
    segundo_apellido: string | null;
    correo_electronico: string | null;
  } | null;
  aprobador?: {
    id_colaborador: number;
    nombre: string | null;
    primer_apellido: string | null;
    segundo_apellido: string | null;
    correo_electronico: string | null;
  } | null;
  meta_permiso?: {
    chargeableDates: string[];
    skippedDates: Array<{
      date: string;
      reason: string;
      holiday: string | null;
    }>;
  } | null;
}

export interface PermisoCreateResponse {
  id_solicitud: number;
  id_colaborador: number;
  id_aprobador: number;
  estado_solicitud: string;
  fecha_inicio: string;
  fecha_fin: string;
  con_goce_salarial: boolean;
  cantidad_dias: number;
  cantidad_horas: number;
  tipo_permiso: PermisoTipo;
  warnings?: string[];
}

export interface PermisoUpdateResponse {
  id_solicitud: number;
  estado_solicitud: string;
  fechas_registradas?: string[];
}

export type CreatePermisoFormValues = {
  id_aprobador: string;
  tipo_permiso: PermisoTipo | "";
  fecha_inicio: string;
  fecha_fin: string;
  observaciones?: string;
};