import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import {
  sequelize,
  Colaborador,
  TipoMarca,
  MarcaAsistencia,
  JornadaDiaria,
} from "../../../models/index.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const COSTA_RICA_TZ = "America/Costa_Rica";

/**
 * Actualiza la marca de asistencia para un colaborador en un día específico
 *
 * @param {{
 *   identificacion: number|string,
 *   tipo_marca: string,
 *   timestamp: string,
 *   nuevo_timestamp: string
 * }} payload
 */
export const actualizarMarcaAsistencia = async ({
  identificacion,
  tipo_marca,
  timestamp,
  nuevo_timestamp,
}) => {
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

    const tipoTxt = String(tipo_marca ?? "").trim().toUpperCase();
    if (!tipoTxt) {
      throw new Error("El tipo de marca es obligatorio");
    }

    if (tipoTxt !== "ENTRADA" && tipoTxt !== "SALIDA") {
      throw new Error("tipo_marca debe ser ENTRADA o SALIDA");
    }

    const marcaOriginalTs = dayjs.utc(timestamp);
    if (!marcaOriginalTs.isValid()) {
      throw new Error("El timestamp original no es válido");
    }
    const fechaOriginal = marcaOriginalTs.tz(COSTA_RICA_TZ).format("YYYY-MM-DD");

    const hasNuevoTimestamp = Boolean(
      nuevo_timestamp && String(nuevo_timestamp).trim() !== ""
    );

    if (!hasNuevoTimestamp) {
      throw new Error("Debes proporcionar un nuevo timestamp para actualizar");
    }

    let marcaNuevaTs = marcaOriginalTs;
    if (hasNuevoTimestamp) {
      const parsedNuevo = dayjs.utc(nuevo_timestamp);
      if (!parsedNuevo.isValid()) {
        throw new Error("El nuevo timestamp no es válido");
      }
      const fechaNueva = parsedNuevo.tz(COSTA_RICA_TZ).format("YYYY-MM-DD");
      if (fechaOriginal !== fechaNueva) {
        throw new Error("La corrección debe mantenerse dentro del mismo día");
      }
      marcaNuevaTs = parsedNuevo;
    }

    const fechaJornada = marcaNuevaTs.tz(COSTA_RICA_TZ).format("YYYY-MM-DD");

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

    const tiposMarca = await TipoMarca.findAll({
      where: {
        nombre: {
          [sequelize.Sequelize.Op.in]: ["ENTRADA", "SALIDA"],
        },
      },
      attributes: ["id_tipo_marca", "nombre"],
      transaction: tx,
    });

    const tipoEntradaDb = tiposMarca.find(
      (t) => String(t.nombre).toUpperCase() === "ENTRADA"
    );
    const tipoSalidaDb = tiposMarca.find(
      (t) => String(t.nombre).toUpperCase() === "SALIDA"
    );

    if (!tipoEntradaDb || !tipoSalidaDb) {
      throw new Error("No existen ENTRADA y/o SALIDA en el catálogo tipo_marca");
    }

    const tipoBuscado = tipoTxt === "ENTRADA" ? tipoEntradaDb : tipoSalidaDb;

    const startOfDay = marcaOriginalTs.tz(COSTA_RICA_TZ).startOf("day").utc().toDate();
    const endOfDay = marcaOriginalTs.tz(COSTA_RICA_TZ).endOf("day").utc().toDate();

    const marca = await MarcaAsistencia.findOne({
      where: {
        id_colaborador: colaborador.id_colaborador,
        id_tipo_marca: tipoBuscado.id_tipo_marca,
        timestamp: {
          [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay],
        },
      },
      order: [["timestamp", "ASC"]],
      transaction: tx,
    });

    if (!marca) {
      throw new Error(
        `No existe una marca ${tipoTxt} para la fecha ${fechaOriginal} que se pueda actualizar`
      );
    }

    await marca.update(
      {
        timestamp: marcaNuevaTs.toDate(),
      },
      { transaction: tx },
    );
    await marca.reload({ transaction: tx });

    const marcasActualizadas = await MarcaAsistencia.findAll({
      where: {
        id_colaborador: colaborador.id_colaborador,
        timestamp: {
          [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay],
        },
      },
      include: [
        {
          model: TipoMarca,
          as: "tipoMarca",
          attributes: ["nombre"],
        },
      ],
      order: [["timestamp", "ASC"]],
      transaction: tx,
    });

    const entrada = marcasActualizadas.find(
      (m) => String(m.tipoMarca?.nombre ?? "").toUpperCase() === "ENTRADA"
    );
    const salida = [...marcasActualizadas]
      .reverse()
      .find((m) => String(m.tipoMarca?.nombre ?? "").toUpperCase() === "SALIDA");

    let horasOrdinarias = 0.0;

    if (entrada && salida) {
      const entradaTs = dayjs(entrada.timestamp);
      const salidaTs = dayjs(salida.timestamp);

      if (!salidaTs.isAfter(entradaTs)) {
        throw new Error("La hora de salida debe ser posterior a la hora de entrada");
      }

      const diferencia = salidaTs.diff(entradaTs, "minutes");
      horasOrdinarias = Number((diferencia / 60).toFixed(2));
    }

    const jornadaExistente = await JornadaDiaria.findOne({
      where: {
        id_colaborador: colaborador.id_colaborador,
        fecha: fechaJornada,
      },
      transaction: tx,
    });

    if (jornadaExistente) {
      await jornadaExistente.update(
        {
          horas_ordinarias: horasOrdinarias,
        },
        { transaction: tx }
      );
    } else if (entrada && salida) {
      await JornadaDiaria.create(
        {
          id_colaborador: colaborador.id_colaborador,
          fecha: fechaJornada,
          horas_ordinarias: horasOrdinarias,
          horas_extra: 0.0,
          horas_nocturnas: 0.0,
        },
        { transaction: tx }
      );
    }

    await tx.commit();

    return {
      colaborador,
      fecha: fechaJornada,
      tipo_marca: tipoTxt,
      marca_actualizada: {
        id_marca: marca.id_marca,
        timestamp: marcaNuevaTs.toDate(),
      },
      jornada: {
        fecha: fechaJornada,
        horas_ordinarias: horasOrdinarias,
        entrada: entrada?.timestamp ?? null,
        salida: salida?.timestamp ?? null,
      },
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
};
