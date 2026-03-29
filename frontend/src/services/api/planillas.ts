import api from "./api";
import { apiRequest } from "./request";

export type PayrollSortField =
  | "id_periodo"
  | "fecha_inicio"
  | "fecha_fin"
  | "fecha_pago"
  | "estado"
  | "bruto"
  | "deducciones"
  | "neto"
  | "horas_extra";

export type PayrollListItem = {
  id_detalle: number;
  id_periodo: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  fecha_pago: string | null;
  estado: string;
  horas_ordinarias: number;
  horas_extra: number;
  horas_nocturnas: number;
  horas_feriado: number;
  bruto: number;
  deducciones: number;
  neto: number;
};

export type PayrollListResponse = {
  items: PayrollListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  summary: {
    total_bruto: number;
    total_neto: number;
    total_periodos: number;
  };
};

export type PayrollReceipt = {
  id_detalle: number;
  id_periodo: number;
  id_colaborador: number;
  id_contrato: number;
  salario_mensual: number;
  salario_quincenal: number;
  salario_diario: number;
  tarifa_hora: number;
  horas_ordinarias: { cantidad: number; monto: number };
  horas_extra: { cantidad: number; monto: number };
  horas_nocturnas: { cantidad: number; monto: number };
  horas_feriado: { cantidad: number; monto: number };
  salario_devengado: number;
  deducciones: Array<{
    id_deduccion: number;
    nombre: string;
    porcentaje: number;
    monto: number;
  }>;
  total_cargas_sociales: number;
  renta: {
    monto_quincenal: number;
    proyectado_mensual: number;
    impuesto_mensual?: number;
  };
  total_deducciones: number;
  salario_neto: number;
};

export type PayrollReceiptResponse = {
  comprobante: PayrollReceipt;
  periodo: {
    id_periodo: number;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    fecha_pago: string | null;
    estado: string | null;
  };
  colaborador: {
    id_colaborador: number;
    nombre_completo: string;
    identificacion: string | number | null;
    correo_electronico: string | null;
    puesto: string | null;
    departamento: string | null;
  };
  empresa: {
    nombre: string;
  };
  generado_en: string;
};

export type PayrollListQuery = {
  page?: number;
  limit?: number;
  sortBy?: PayrollSortField;
  sortDir?: "asc" | "desc";
  search?: string;
  month?: string;
  year?: string;
};

export function buildMyPayrollsUrl(params: PayrollListQuery = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `planillas/mis-planillas?${query}` : "planillas/mis-planillas";
}

export const deletePeriodoPlanilla = (id: number) => {
  return api.delete(`planillas/periodo_planilla/${id}`);
};

export const getMyPayrollReceipt = (idDetalle: number) => {
  return apiRequest<PayrollReceiptResponse>({
    url: `planillas/mis-planillas/${idDetalle}`,
    method: "GET",
  });
};