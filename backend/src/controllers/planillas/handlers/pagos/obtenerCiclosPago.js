import { CicloPago } from "../../../../models/index.js";

/**
 * Obtiene los datos de todos los ciclos de pago
 *
 * @returns {Promise<Array<object>>}
 */
export const obtenerCiclosPago = async () => {
  const cycles = await CicloPago.findAll();

  return cycles.map((c) => {
    return c.nombre;
  });
};
