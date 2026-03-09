export type PendingApprovalRequestType = "HORA_EXTRA" | "VACACIONES" | "PERMISO";

export interface PendingApprovalItem {
  id_solicitud: number;
  tipo_solicitud: PendingApprovalRequestType;
  tipo_label: string;
  nombre_solicitante: string;
  id_colaborador_solicitante: number;
  id_aprobador: number;
  estado: string;
  fecha_principal: string;
  fecha_fin: string | null;
  fecha_orden: string;
  descripcion: string;
  ruta_destino: string;
}

export interface PendingApprovalsResponse {
  total_pendientes: number;
  items: PendingApprovalItem[];
}
