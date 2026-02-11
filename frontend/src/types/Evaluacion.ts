/* ─── Rubros de Evaluación ───────────────────────────────────────────────────── */

export interface RubroEvaluacion {
  id_rubro_evaluacion: number;
  rubro: string;
  calificacion: number;
  comentarios: string;
}

export interface CrearRubroPayload {
  rubro: string;
  calificacion: number;
  comentarios?: string;
}

/* ─── Evaluaciones ──────────────────────────────────────────────────────────── */

export interface EvaluacionColaboradorInfo {
  id_colaborador: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  contratos?: Array<{
    id_contrato: number;
    id_puesto: number;
    puesto?: {
      id_puesto: number;
      nombre: string;
      id_departamento: number;
      departamento?: {
        id_departamento: number;
        nombre: string;
      };
    };
  }>;
}

export interface EvaluacionRubroDetalle {
  id_evaluacion: number;
  id_rubro_evaluacion: number;
  rubro: RubroEvaluacion;
}

export interface Evaluacion {
  id_evaluacion: number;
  id_colaborador: number;
  id_evaluador: number;
  puntaje_general: number;
  plan_accion: string;
  finalizada: boolean;
  fecha_inicio: string;
  fecha_fin: string;
  colaborador: EvaluacionColaboradorInfo;
  evaluador: EvaluacionColaboradorInfo;
  rubros: EvaluacionRubroDetalle[];
}

export interface CrearEvaluacionPayload {
  id_colaborador: number;
  id_evaluador: number;
  fecha_inicio: string;
  fecha_fin: string;
  rubros_ids: number[];
}

export interface CalificacionRubro {
  id_rubro_evaluacion: number;
  calificacion: number;
  comentarios?: string;
}

export interface FinalizarEvaluacionPayload {
  calificaciones: CalificacionRubro[];
  plan_accion: string;
}

/* ─── Filtros ───────────────────────────────────────────────────────────────── */

export interface EvaluacionFiltros {
  id_evaluador?: number;
  finalizada?: boolean;
  departamento?: number;
}
