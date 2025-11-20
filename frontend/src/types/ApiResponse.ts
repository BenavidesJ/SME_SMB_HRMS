// Estructura de la respuesta de un request al API
export interface ApiResponse<T> {
  // Estado.
  success: boolean;
  // Código HTTP.
  status_code: number;
  // Mensaje de descripción.
  message: string;
  // Datos consultados.
  data: T;
}