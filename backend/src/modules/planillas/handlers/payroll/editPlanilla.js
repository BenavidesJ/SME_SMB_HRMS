import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../../mantenimientos_consultas/shared/transaction.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import { roundCurrency, roundDecimal, serializePlanilla } from "../../shared/formatters.js";

const { Planilla, DeduccionPlanilla, Deduccion } = models;

/**
 * Campos editables de una planilla.
 */
const CAMPOS_EDITABLES = [
  "horas_ordinarias",
  "horas_extra",
  "horas_nocturnas",
  "horas_feriado",
  "bruto",
  "deducciones",
  "neto",
];

/**
 * Edita una planilla existente. Acepta campos parciales.
 * Si se pasa `recalcular_deducciones: true`, recalcula deducciones obligatorias
 * a partir del bruto actualizado.
 *
 * @param {{
 *   id_detalle: number,
 *   datos: Partial<{ horas_ordinarias, horas_extra, horas_nocturnas, horas_feriado, bruto, deducciones, neto }>,
 *   recalcular_deducciones?: boolean
 * }} payload
 */
export const editarPlanilla = (payload = {}) =>
  runInTransaction(async (transaction) => {
    const idDetalle = requirePositiveInt(payload.id_detalle, "id_detalle");

    if (!payload.datos || typeof payload.datos !== "object") {
      throw new Error("Debe proporcionar los datos a actualizar");
    }

    const planilla = await Planilla.findByPk(idDetalle, { transaction });
    if (!planilla) {
      throw new Error(`No existe una planilla con id ${idDetalle}`);
    }

    // Filtrar solo campos permitidos
    const actualizaciones = {};
    for (const campo of CAMPOS_EDITABLES) {
      if (payload.datos[campo] !== undefined) {
        const valor = Number(payload.datos[campo]);
        if (!Number.isFinite(valor) || valor < 0) {
          throw new Error(`El campo ${campo} debe ser un numero positivo`);
        }
        actualizaciones[campo] = campo === "bruto" || campo === "deducciones" || campo === "neto"
          ? roundCurrency(valor)
          : roundDecimal(valor);
      }
    }

    if (Object.keys(actualizaciones).length === 0) {
      throw new Error("No se proporcionaron campos validos para actualizar");
    }

    // Recalcular deducciones si se solicita
    if (payload.recalcular_deducciones) {
      const brutoFinal = actualizaciones.bruto ?? Number(planilla.bruto);

      const deduccionesObligatorias = await Deduccion.findAll({
        where: { es_voluntaria: false },
        transaction,
      });

      let totalDeducciones = 0;
      const detallesDeducciones = [];

      for (const ded of deduccionesObligatorias) {
        const porcentaje = Number(ded.valor);
        const monto = roundCurrency((brutoFinal * porcentaje) / 100);
        totalDeducciones += monto;
        detallesDeducciones.push({
          id_deduccion: ded.id_deduccion,
          monto,
        });
      }

      actualizaciones.deducciones = roundCurrency(totalDeducciones);
      actualizaciones.neto = Math.max(0, roundCurrency(brutoFinal - totalDeducciones));

      // Actualizar tabla detalle de deducciones
      await DeduccionPlanilla.destroy({
        where: { id_planilla: idDetalle },
        transaction,
      });

      for (const dd of detallesDeducciones) {
        await DeduccionPlanilla.create(
          {
            id_planilla: idDetalle,
            id_deduccion: dd.id_deduccion,
            monto: dd.monto,
          },
          { transaction }
        );
      }
    }

    await planilla.update(actualizaciones, { transaction });

    return serializePlanilla({
      ...planilla.get({ plain: true }),
      ...actualizaciones,
    });
  });
