export interface TipoIncapacidad {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface CrearIncapacidadPayload {
  id_colaborador: number;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_incap: string;
  numero_boleta: string;
}

export interface CrearIncapacidadFormValues {
  id_colaborador?: string | number;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_incap: string;
  numero_boleta: string;
}

export interface DiaIncapacidad {
  id_jornada: number;
  fecha: string;
  id_incapacidad: number | null;
  porcentaje_patrono: number;
  porcentaje_ccss: number;
}

export interface IncapacidadGrupo {
  numero_boleta: string | null;
  tipo_incapacidad: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias: DiaIncapacidad[];
}
