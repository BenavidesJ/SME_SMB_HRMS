
/**
 * Genera un nombre de usuario basado en el nombre, apellido e identificación.
 * 
 * @param {string} nombre 
 * @param {string} primer_apellido 
 * @param {string} identificacion 
 * @returns {string} username generado
 */
export const generateUsername = (nombre, primer_apellido, identificacion) => {
  if (!nombre || !primer_apellido || !identificacion) {
    throw new Error("Faltan datos para generar el nombre de usuario");
  }

  const inicial = nombre.trim().charAt(0).toUpperCase();
  const apellido = primer_apellido.trim().replace(/\s+/g, '');
  const ultimos4 = identificacion.slice(-4);

  return `${inicial}${apellido}${ultimos4}`;
};
