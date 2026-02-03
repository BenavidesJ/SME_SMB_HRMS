import dayjs from "dayjs";
import { Op } from "sequelize";
import { sequelize, Colaborador, MarcaAsistencia, TipoMarca } from "../../../models/index.js";
import { agruparMarcasPorDia } from "./helpers/agruparMarcasPorDia.js";

/**
 * Obtener marcas de asistencia por rango de fechas
 *
 * @param {{
 *   identificacion: number|string,
 *   desde: string,
 *   hasta: string,
 *   tipo_marca?: string
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

    const desdeParsed = dayjs(String(desde).trim(), "YYYY-MM-DD", true);
    const hastaParsed = dayjs(String(hasta).trim(), "YYYY-MM-DD", true);

    if (!desdeParsed.isValid()) {
      throw new Error("desde inválido. Use YYYY-MM-DD");
    }

    if (!hastaParsed.isValid()) {
      throw new Error("hasta inválido. Use YYYY-MM-DD");
    }

    if (hastaParsed.isBefore(desdeParsed)) {
      throw new Error("hasta no puede ser menor que desde");
    }

    const start = desdeParsed.startOf("day").toDate();
    const end = hastaParsed.endOf("day").toDate();

    const colaborador = await Colaborador.findOne({
      where: { identificacion: identNum },
      attributes: [
        "id_colaborador",
        "identificacion",
        "nombre",
        "primer_apellido",
        "segundo_apellido",
      ],
      transaction: tx,
    });

    if (!colaborador) {
      throw new Error(`No existe un colaborador con identificación ${identNum}`);
    }

    const where = {
      id_colaborador: colaborador.id_colaborador,
      timestamp: { [Op.between]: [start, end] },
    };

    const tipoTxt = tipo_marca ? String(tipo_marca).trim().toUpperCase() : null;
    if (tipoTxt && tipoTxt !== "ENTRADA" && tipoTxt !== "SALIDA") {
      throw new Error("tipo_marca debe ser ENTRADA o SALIDA");
    }

    const includeTipo = {
      model: TipoMarca,
      as: "tipoMarca",
      attributes: ["nombre"],
      required: Boolean(tipoTxt),
      ...(tipoTxt ? { where: { nombre: tipoTxt } } : {}),
    };

    const marcas = await MarcaAsistencia.findAll({
      where,
      include: [includeTipo],
      attributes: ["id_marca", "timestamp"],
      order: [["timestamp", "ASC"]],
      transaction: tx,
    });

    const datosMarcas = marcas.map((m) => ({
      id_marca: m.id_marca,
      tipo_marca: m.tipoMarca?.nombre ?? null,
      timestamp: m.timestamp,
      observaciones: "N/A",
    }));

    const marcasAgrupadas = agruparMarcasPorDia(datosMarcas);

    const result = {
      colaborador,
      filtro: {
        desde: desdeParsed.format("YYYY-MM-DD"),
        hasta: hastaParsed.format("YYYY-MM-DD"),
        tipo_marca: tipoTxt ?? null,
      },
      total: marcas.length,
      marcas: marcasAgrupadas,
    };

    await tx.commit();
    return result;
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
};
