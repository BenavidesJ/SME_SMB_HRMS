import api from "./api";

export interface AguinaldoDesglose {
  mes: number;
  anio: number;
  total: number;
}

export interface AguinaldoSimulacion {
  id_colaborador: number;
  nombre_completo: string;
  identificacion: string | number | null;
  desglose: AguinaldoDesglose[];
  total_bruto: number;
  monto_aguinaldo: number;
  error: string | null;
}

export interface AguinaldoSimulacionResponse {
  periodo_desde: string;
  periodo_hasta: string;
  total_colaboradores: number;
  resultados: AguinaldoSimulacion[];
}

export interface AguinaldoDuplicado {
  id_colaborador: number;
  nombre_completo: string;
  id_aguinaldo: number;
  monto_existente: number;
}

export interface AguinaldoCreado {
  id_aguinaldo: number;
  id_colaborador: number;
  nombre_completo: string;
  monto_calculado: number;
}

export interface CrearLoteResponse {
  creados: AguinaldoCreado[];
  duplicados: AguinaldoDuplicado[];
  mensaje: string;
}

export interface AguinaldoRecalculado {
  id_aguinaldo: number;
  id_colaborador: number;
  nombre_completo: string;
  monto_anterior: number;
  monto_nuevo: number;
  diferencia: number;
}

export interface RecalcularResponse {
  total_recalculados: number;
  recalculados: AguinaldoRecalculado[];
}

export interface AguinaldoRegistro {
  id_aguinaldo: number;
  id_colaborador: number;
  nombre_completo: string;
  identificacion: string | number | null;
  anio: number;
  periodo_desde: string;
  periodo_hasta: string;
  monto_calculado: number;
  fecha_pago: string;
  registrado_por_nombre: string;
}

// ── API calls ──

export const calcularLoteAguinaldo = (payload: {
  colaboradores: number[];
  periodo_desde: string;
  periodo_hasta: string;
}) => {
  return api.post<{ data: AguinaldoSimulacionResponse }>(
    "aguinaldos/calcular-lote",
    payload,
  );
};

export const crearLoteAguinaldo = (payload: {
  colaboradores: number[];
  periodo_desde: string;
  periodo_hasta: string;
  anio: number;
  fecha_pago: string;
  registrado_por: number;
}) => {
  return api.post<{ data: CrearLoteResponse }>("aguinaldos/crear-lote", payload);
};

export const recalcularAguinaldos = (payload: { ids: number[] }) => {
  return api.patch<{ data: RecalcularResponse }>(
    "aguinaldos/recalcular",
    payload,
  );
};

export const listarAguinaldos = (params?: {
  anio?: number;
  id_colaborador?: number;
}) => {
  return api.get<{ data: AguinaldoRegistro[] }>("aguinaldos", { params });
};
