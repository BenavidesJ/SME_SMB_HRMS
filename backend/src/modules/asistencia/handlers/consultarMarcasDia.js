import dayjs from "dayjs";
import { sequelize, Colaborador, MarcaAsistencia, TipoMarca } from "../../../models/index.js";

/**
 * Obtiene el estado de marcas de asistencia para un día específico
 *
 * @param {{
 *   identificacion: number|string,
 *   timestamp: string
 * }} payload
 */
export const obtenerMarcasDeDia = async ({ identificacion, timestamp }) => {
  const tx = await sequelize.transaction();

  try {
    if (
      identificacion === undefined ||
      identificacion === null ||
      String(identificacion).trim() === ""
    ) {
      throw new Error("La identificación es obligatoria");
    }

    const identNum = Number(String(identificacion).trim());
    if (!Number.isFinite(identNum)) {
      throw new Error("La identificación debe ser numérica");
    }

    if (!timestamp) {
      throw new Error("El timestamp es obligatorio");
    }

    const timestampDate = new Date(timestamp);
    if (isNaN(timestampDate.getTime())) {
      throw new Error("El timestamp no es una fecha válida");
    }

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

    const inicioDia = dayjs(timestampDate).startOf("day").toDate();
    const finDia = dayjs(timestampDate).endOf("day").toDate();

    const marcas = await MarcaAsistencia.findAll({
      where: {
        id_colaborador: colaborador.id_colaborador,
        timestamp: {
          [sequelize.Sequelize.Op.between]: [inicioDia, finDia],
        },
      },
      include: [
        {
          model: TipoMarca,
          as: "tipoMarca",
          attributes: ["nombre"],
        },
      ],
      attributes: ["id_marca", "timestamp"],
      order: [["timestamp", "ASC"]],
      transaction: tx,
    });

    const items = marcas.map((m) => ({
      id_marca: m.id_marca,
      tipo_marca: String(m.tipoMarca?.nombre ?? ""),
      timestamp: m.timestamp,
    }));

    const hasEntrada = items.some((m) => m.tipo_marca.toUpperCase() === "ENTRADA");
    const hasSalida = items.some((m) => m.tipo_marca.toUpperCase() === "SALIDA");

    let estado = "SIN_MARCAS";
    if (hasEntrada && hasSalida) {
      estado = "ENTRADA_Y_SALIDA";
    } else if (hasEntrada) {
      estado = "SOLO_ENTRADA";
    }

    const fecha = dayjs(timestampDate).format("YYYY-MM-DD");

    await tx.commit();

    return {
      colaborador,
      fecha,
      estado_marcas: estado,
      marcas: items,
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
};
