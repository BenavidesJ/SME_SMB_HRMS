// Credenciales para ingresar al sistema.
export interface Credentials {
  // Username de la cuenta.
  username: string;
  // Contraseña de la cuenta. 
  password: string;
}

// Token de acceso para ingresar al sistema.
export interface Token {
  access_token: string;
}