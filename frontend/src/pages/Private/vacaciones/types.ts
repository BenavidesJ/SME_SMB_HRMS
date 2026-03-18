export interface VacacionPayload {
  id_colaborador: number;
  id_aprobador: number;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones?: string;
}

export interface VacacionListItem {
  id_solicitud_vacaciones: number;
  id_colaborador: number;
  id_aprobador: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias_aprobados?: string | null;
  dias_solicitados?: string | null;
  observaciones?: string | null;
  dias_solicitados_detalle: string[];
  dias_skipped_detalle?: Array<{
    date: string;
    reason: string;
    holiday: string | null;
  }>;
  meta_vacaciones?: {
    chargeableDates: string[];
    skippedDates: Array<{
      date: string;
      reason: string;
      holiday: string | null;
    }>;
  };
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
  saldo_vacaciones?: {
    dias_ganados: number;
    dias_tomados: number;
  } | null;
  estadoSolicitudVacaciones?: {
    id_estado: number;
    estado: string;
  };
}

export interface VacacionMetaEngine {
  chargeableDays: number;
  chargeableDates: string[];
  skippedDates: Array<{
    date: string;
    reason: string;
    holiday?: string | null;
  }>;
  dias_ganados_recalculados: number;
  disponibles: number;
  id_saldo_vacaciones: number;
}

export interface VacacionCreateResponse {
  id_solicitud_vacaciones: number;
  id_colaborador: number;
  id_aprobador: number;
  estado_solicitud: string;
  fecha_inicio: string;
  fecha_fin: string;
  id_saldo_vacaciones: number;
  meta_engine?: VacacionMetaEngine;
  warnings?: string[];
  notificaciones?: {
    aprobador_notificado: boolean;
  };
}

export interface VacacionUpdateResponse {
  id_solicitud_vacaciones: number;
  estado_solicitud: string;
}

export type CreateVacacionFormValues = Pick<VacacionPayload, "fecha_inicio" | "fecha_fin" | "observaciones"> & {
  id_aprobador: string;
};