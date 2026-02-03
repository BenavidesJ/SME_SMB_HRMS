import dayjs from "dayjs";
import {
  sequelize,
  Colaborador,
  Contrato,
  HorarioLaboral,
  Estado,
  TipoMarca,
  MarcaAsistencia,
  JornadaDiaria,
} from "../../../models/index.js";
import { getDayInitial } from "./helpers/obtenerInicialDia.js";

/**
 * Registrar marca de asistencia
 *
 * @param {{
 *   identificacion: number|string,
 *   tipo_marca: string,
 *   timestamp: string (ISO 8601)
 * }} payload
 */
export const registrarMarcaAsistencia = async ({
  identificacion,
  tipo_marca,
  timestamp,
}) => {
  const tx = await sequelize.transaction();

  try {
    // Validar identificación
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

    // Validar tipo de marca
    const tipoTxt = String(tipo_marca ?? "").trim().toUpperCase();
    if (!tipoTxt) throw new Error("El tipo de marca es obligatorio");
    if (tipoTxt !== "ENTRADA" && tipoTxt !== "SALIDA") {
      throw new Error("tipo_marca debe ser ENTRADA o SALIDA");
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
      transaction: tx,
    });

    if (!colaborador) {
      throw new Error(`No existe un colaborador con identificación ${identNum}`);
    }

    const estadoActivo = await Estado.findOne({
      where: { estado: "ACTIVO" },
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });

    if (!estadoActivo) {
      throw new Error(`No existe el estado "ACTIVO" en el catálogo estado`);
    }

    const ESTADO_ACTIVO_ID = estadoActivo.id_estado;

    const contratoActivo = await Contrato.findOne({
      where: {
        id_colaborador: colaborador.id_colaborador,
        estado: ESTADO_ACTIVO_ID,
      },
      transaction: tx,
    });

    if (!contratoActivo) {
      throw new Error("El colaborador no tiene un contrato ACTIVO");
    }

    const horarioActivo = await HorarioLaboral.findOne({
      where: {
        id_contrato: contratoActivo.id_contrato,
        estado: ESTADO_ACTIVO_ID,
      },
      transaction: tx,
    });

    if (!horarioActivo) {
      throw new Error("El contrato activo no tiene un horario ACTIVO asignado");
    }

    // Validar si es día laboral
    const dayInitial = getDayInitial(timestampDate);
    const diasLibres = horarioActivo.dias_libres ?? "";
    const diasLaborales = horarioActivo.dias_laborales ?? "";

    // Verificar si el día es día libre
    if (diasLibres.includes(dayInitial)) {
      throw new Error(
        `No se puede registrar marca: ${dayInitial} es día libre según el horario laboral del colaborador`
      );
    }

    // Verificar si el día está dentro de días laborales (optional stricter check)
    if (diasLaborales && !diasLaborales.includes(dayInitial)) {
      throw new Error(
        `No se puede registrar marca: ${dayInitial} no es día laboral según el horario laboral del colaborador`
      );
    }

    // Obtener tipos de marca del catálogo
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

    // Obtener marcas existentes del día
    const startOfDay = dayjs(timestampDate).startOf("day").toDate();
    const endOfDay = dayjs(timestampDate).endOf("day").toDate();

    const marcasDelDia = await MarcaAsistencia.findAll({
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

    const hasEntrada = marcasDelDia.some(
      (m) => String(m.tipoMarca?.nombre ?? "").toUpperCase() === "ENTRADA"
    );
    const hasSalida = marcasDelDia.some(
      (m) => String(m.tipoMarca?.nombre ?? "").toUpperCase() === "SALIDA"
    );

    // Validar regla de ENTRADA/SALIDA
    if (tipoTxt === "ENTRADA" && hasEntrada) {
      throw new Error("Ya existe una marca de ENTRADA para este día");
    }

    if (tipoTxt === "SALIDA" && !hasEntrada) {
      throw new Error("No se puede registrar SALIDA sin una ENTRADA previa");
    }

    if (tipoTxt === "SALIDA" && hasSalida) {
      throw new Error("Ya existe una marca de SALIDA para este día");
    }

    // Crear marca de asistencia
    const marcaCreada = await MarcaAsistencia.create(
      {
        id_colaborador: colaborador.id_colaborador,
        id_tipo_marca: tipoTxt === "ENTRADA" ? tipoEntradaDb.id_tipo_marca : tipoSalidaDb.id_tipo_marca,
        timestamp: timestampDate,
        observaciones: "N/A",
      },
      { transaction: tx }
    );

    //  Si hay ENTRADA y SALIDA, crear registro de JornadaDiaria
    let horasOrdinarias = 0.0;
    const fechaDia = dayjs(timestampDate).format("YYYY-MM-DD");

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

    const entradaMarca = marcasActualizadas.find(
      (m) => String(m.tipoMarca?.nombre ?? "").toUpperCase() === "ENTRADA"
    );
    const salidaMarca = marcasActualizadas.find(
      (m) => String(m.tipoMarca?.nombre ?? "").toUpperCase() === "SALIDA"
    );

    if (entradaMarca && salidaMarca) {
      const entrada = dayjs(entradaMarca.timestamp);
      const salida = dayjs(salidaMarca.timestamp);
      const diferencia = salida.diff(entrada, "minutes");
      horasOrdinarias = Number((diferencia / 60).toFixed(2));

      const jornadaExistente = await JornadaDiaria.findOne({
        where: {
          id_colaborador: colaborador.id_colaborador,
          fecha: fechaDia,
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
      } else {
        await JornadaDiaria.create(
          {
            id_colaborador: colaborador.id_colaborador,
            fecha: fechaDia,
            horas_ordinarias: horasOrdinarias,
            horas_extra: 0.0,
            horas_nocturnas: 0.0,
          },
          { transaction: tx }
        );
      }
    }

    await tx.commit();

    return {
      id_marca: marcaCreada.id_marca,
      colaborador: {
        id_colaborador: colaborador.id_colaborador,
        identificacion: colaborador.identificacion,
        nombre: colaborador.nombre,
        primer_apellido: colaborador.primer_apellido,
        segundo_apellido: colaborador.segundo_apellido,
      },
      tipo_marca: tipoTxt,
      timestamp: marcaCreada.timestamp,
      fecha: fechaDia,
      jornada: {
        fecha: fechaDia,
        horas_ordinarias: horasOrdinarias,
        entrada: entradaMarca?.timestamp ?? null,
        salida: salidaMarca?.timestamp ?? null,
      },
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
};
