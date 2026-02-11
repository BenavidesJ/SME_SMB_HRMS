import api from "./api";
import type { ApiResponse } from "../../types";
import type {
  RubroEvaluacion,
  CrearRubroPayload,
  Evaluacion,
  CrearEvaluacionPayload,
  FinalizarEvaluacionPayload,
  EvaluacionFiltros,
} from "../../types/Evaluacion";

const BASE = "evaluacion-desempeno";

// ─── Rubros ────────────────────────────────────────────────────────────────────

export const getRubros = () =>
  api.get<ApiResponse<RubroEvaluacion[]>>(`${BASE}/rubros`);

export const crearRubro = (payload: CrearRubroPayload) =>
  api.post<ApiResponse<RubroEvaluacion>>(`${BASE}/rubros`, payload);

export const eliminarRubro = (id: number) =>
  api.delete<ApiResponse<{ eliminado: boolean }>>(`${BASE}/rubros/${id}`);

// ─── Evaluaciones ──────────────────────────────────────────────────────────────

export const getEvaluaciones = (filtros?: EvaluacionFiltros) =>
  api.get<ApiResponse<Evaluacion[]>>(`${BASE}/evaluaciones`, { params: filtros });

export const getEvaluacionById = (id: number) =>
  api.get<ApiResponse<Evaluacion>>(`${BASE}/evaluaciones/${id}`);

export const crearEvaluacion = (payload: CrearEvaluacionPayload) =>
  api.post<ApiResponse<Evaluacion>>(`${BASE}/evaluaciones`, payload);

export const finalizarEvaluacion = (id: number, payload: FinalizarEvaluacionPayload) =>
  api.patch<ApiResponse<Evaluacion>>(`${BASE}/evaluaciones/${id}/finalizar`, payload);

// ─── Evaluaciones por colaborador (perfil) ─────────────────────────────────────

export const getEvaluacionesColaborador = (idColaborador: number) =>
  api.get<ApiResponse<Evaluacion[]>>(`${BASE}/colaborador/${idColaborador}`);
