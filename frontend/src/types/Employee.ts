/* Empleado */
export interface Employee {
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  genero: string;
  identificacion: string | number;
  fecha_nacimiento: string;
  correo_electronico: string;
  telefono?: number | string;
  fecha_ingreso: string;
  cantidad_hijos: number;
  estado_civil: string;
  rol: string;
  provincia?: string;
  canton?: string,
  distrito?: string,
  otros_datos?: string,
  direccion?: object
}

export interface EmployeeCatalogRef {
  id: number;
  nombre: string;
}

export interface EmployeeAddress {
  id: number;
  provincia: string | null;
  canton: string | null;
  distrito: string | null;
  otros_datos: string | null;
}

/* Genero */
export interface Genero {
  data: string[]
}
/* Estado Civil */
export interface EstadoCivil {
  data: string[]
}

export interface EmployeeUserInfo {
  id_usuario: number;
  username: string;
  estado: number | string;
  requiere_cambio_contrasena: boolean;
  rol?: string
}

export interface EmployeeRow {
  id: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  correo_electronico: string;
  identificacion: number | string;
  cantidad_hijos?: number;
  genero?: string | null;
  estado_civil?: EmployeeCatalogRef | null;
  fecha_ingreso?: string;
  fecha_nacimiento?: string;
  estado?: EmployeeCatalogRef | null;
  telefono?: number | string | null;
  direccion?: EmployeeAddress | null;
  usuario?: EmployeeUserInfo | null;
}

export interface TipoJornada {
  id: number
  tipo: string
  max_horas_diarias: string
  max_horas_semanales: string
}

export interface Puesto {
  id: number
  puesto: string
  departamento: string
  salario_ref_minimo: string
  salario_ref_maximo: string
  estado: string
}

export interface ContractPayload {
  id_colaborador: number;
  id_jefe_directo: number;
  puesto: string;
  fecha_inicio: string;
  tipo_contrato: string;
  tipo_jornada: string;
  salario_base: number;
  ciclo_pago: string;
  horas_semanales: number;
  horario: {
    hora_inicio: string;
    hora_fin: string;
    minutos_descanso: number;
    dias_laborales: string;
    dias_libres: string;
  };
};

export interface CreateContractForm {
  id_jefe_directo: string;
  puesto: string;
  tipo_contrato: string;
  tipo_jornada: string;
  ciclo_pago: string;
  salario_base: number | string;
  fecha_ingreso: string;
  horas_semanales: number | string;
  hora_inicio: string;
  hora_fin: string;
  minutos_descanso: number | string;
  dias_laborales: string[];
  dias_libres: string[];
};

export interface Contrato {
  id_contrato: number
  id_colaborador: number
  id_jefe_directo?: number
  puesto: string
  fecha_inicio: string
  tipo_contrato: string
  tipo_jornada: string
  horas_semanales: string
  salario_base: string
  estado: string | null
  jefe_directo?: {
    id_colaborador: number
    nombre: string
    primer_apellido: string
    segundo_apellido: string
  } | null
  horarios: Horario[]
}

export interface Horario {
  id_horario: number
  hora_inicio: string
  hora_fin: string
  minutos_descanso: number
  dias_laborales: string
  dias_libres: string
  estado: number
  fecha_actualizacion: string
}

// Asistencia

interface ColaboradorAsistencia {
  id_colaborador: number
  identificacion: number
  nombre: string
  primer_apellido: string
  segundo_apellido: string
}

export interface Filtro {
  desde: string
  hasta: string
  tipo_marca: "ENTRADA" | "SALIDA"
}

export interface Marca {
  dia: string
  asistencia: AsistenciaResumen[]
}

export interface AsistenciaResumen {
  id_marca: number
  tipo_marca: string
  timestamp: string
  observaciones: string
}

export interface Asistencia {
  colaborador: ColaboradorAsistencia
  filtro: Filtro
  total: number
  marcas: Marca[]
}

export interface Roles {
  id: number,
  nombre: string
}

export type EmployeeFullApi = EmployeeRow & {
  direccion?: EmployeeRow["direccion"];
  usuario?: EmployeeUserInfo | null;
};