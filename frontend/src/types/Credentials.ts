// Credenciales para ingresar al sistema.
export interface Credentials {
  // Username de la cuenta.
  username: string;
  // Contraseña de la cuenta. 
  password: string;
}

// Cambio de password.
export interface ChangePassword {
  // Password actual o temporal.
  password_anterior: Pick<Credentials, "password">;
  // Nuevo Password. 
  password_nuevo: Pick<Credentials, "password">;
}

// Token de acceso para ingresar al sistema.
export interface Token {
  access_token: string;
}