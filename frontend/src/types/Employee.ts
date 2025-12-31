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
