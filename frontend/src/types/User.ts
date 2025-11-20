/* Usuario del sistema */
export interface User {
  // Identificacion unica.
  id_usuario: number;
  // Username de la cuenta.
  username: string;
  // Estado
  activo: boolean;
  // Arreglo de roles asociados
  roles: string[];
}

/* Datos del Usuario del sistema */
export interface LoggedUser {
  // Identificacion unica.
  id: number;
  // Nombre de la persona.
  nombre: string;
  // Primer Apellido o Apellido Paterno de la persona.
  primer_apellido: string;
  // Segundo Apellido o Apellido Materno de la persona.
  segundo_apellido: string;
  // Correo electrónico de la persona.
  correo_electronico: string;
  // Nacionalidad o país de origen de la persona.
  nacionalidad: string;
  // Documento de identificación de la persona.
  identificacion: string;
  // Género con el que se identifica la persona.
  genero: string;
  // Fecha de ingreso a la empresa.
  fecha_ingreso: string;
  // Fecha de nacimiento.
  fecha_nacimiento: string;
  // Usuario registrado en el sistema.
  usuario: User;
}