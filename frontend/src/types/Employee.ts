/* Empleado */
export interface Employee {
    nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    genero: string;
    identificacion: number;
    fecha_nacimiento: string;
    correo_electronico: string;
    fecha_ingreso: string;
    cantidad_hijos: number;
    estado_civil: string;
    rol: string;
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
  activo: number; 
  requiere_cambio_contrasena: boolean;
  ultimo_acceso: string;
  roles: string[];
  estado_usuario: string;
}

export interface EmployeeRow {
  id: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  correo_electronico: string;
  identificacion: number;
  genero: string;
  estado_civil: string;
  fecha_ingreso: string; 
  fecha_nacimiento: string;   
  estado: string;
  telefono: number | string;         
  usuario: EmployeeUserInfo | null;
}