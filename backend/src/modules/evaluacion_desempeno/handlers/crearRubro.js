import { RubroEvaluacion } from "../../../models/index.js";

/**
 * Crea un nuevo rubro (rubrica) de evaluación.
 * @param {{ rubro: string, calificacion: number, comentarios: string }} data
 * @returns {Promise<object>} Rubro creado
 */
export async function crearRubro({ rubro, calificacion, comentarios }) {
  if (!rubro || String(rubro).trim() === "") {
    throw new Error("El nombre del rubro es obligatorio");
  }
  if (calificacion === undefined || calificacion === null) {
    throw new Error("La calificación máxima es obligatoria");
  }

  const nuevoRubro = await RubroEvaluacion.create({
    rubro: String(rubro).trim(),
    calificacion: Number(calificacion),
    comentarios: comentarios ? String(comentarios).trim() : "",
  });

  return nuevoRubro;
}
