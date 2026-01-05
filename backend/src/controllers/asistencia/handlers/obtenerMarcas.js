import dayjs from "dayjs";
import { Op } from "sequelize";
import {
  sequelize,
  Colaborador,
  MarcaAsistencia,
  TipoMarca,
} from "../../../models/index.js";

/**
 * Obtener marcas por rango de fechas
 *
 * @param {{
 *  identificacion: number|string,
 *  desde: string, // YYYY-MM-DD
 *  hasta: string, // YYYY-MM-DD
 *  tipo_marca?: string
 * }} payload
 */
export const obtenerMarcasAsistenciaPorRango = async ({
  identificacion,
  desde,
  hasta,
  tipo_marca,
}) => {
  const tx = await sequelize.transaction();

  try {
    const identNum = Number(String(identificacion).trim());
    if (!Number.isFinite(identNum)) {
      throw new Error("identificacion debe ser numérica");
    }

    const d = dayjs(String(desde).trim(), "YYYY-MM-DD", true);
    const h = dayjs(String(hasta).trim(), "YYYY-MM-DD", true);

    if (!d.isValid()) throw new Error("desde inválido. Use YYYY-MM-DD");
    if (!h.isValid()) throw new Error("hasta inválido. Use YYYY-MM-DD");
    if (h.isBefore(d)) throw new Error("hasta no puede ser menor que desde");

    // Rango desde 00:00:00 hasta 23:59:59.999
    const start = d.startOf("day").toDate();
    const end = h.endOf("day").toDate();

    const colaborador = await Colaborador.findOne({
      where: { identificacion: identNum },
      attributes: ["id_colaborador", "identificacion", "nombre", "primer_apellido", "segundo_apellido"],
      transaction: tx,
    });

    if (!colaborador) {
      throw new Error(`No existe un colaborador con identificación ${identNum}`);
    }

    const where = {
      id_colaborador: colaborador.id_colaborador,
      timestamp: { [Op.between]: [start, end] },
    };

    // Filtro opcional por tipo
    const tipoTxt = tipo_marca ? String(tipo_marca).trim().toUpperCase() : null;
    if (tipoTxt) {
      if (tipoTxt !== "ENTRADA" && tipoTxt !== "SALIDA") {
        throw new Error("Tipo de Marca debe ser ENTRADA o SALIDA");
      }
    }

    const marcas = await MarcaAsistencia.findAll({
      where,
      include: [
        {
          model: TipoMarca,
          attributes: ["nombre"],
          ...(tipoTxt ? { where: { nombre: tipoTxt } } : {}),
        },
      ],
      attributes: ["id_marca", "timestamp", "observaciones"],
      order: [["timestamp", "ASC"]],
      transaction: tx,
    });

    await tx.commit();

    return {
      colaborador,
      filtro: {
        desde: d.format("YYYY-MM-DD"),
        hasta: h.format("YYYY-MM-DD"),
        tipo_marca: tipoTxt ?? null,
      },
      total: marcas.length,
      marcas: marcas.map((m) => ({
        id_marca: m.id_marca,
        tipo_marca: m.tipo_marca?.nombre ?? null,
        timestamp: m.timestamp,
        observaciones: m.observaciones,
      })),
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
