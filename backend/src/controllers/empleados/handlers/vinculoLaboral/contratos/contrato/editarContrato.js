import {
  sequelize,
  Contrato,
  Colaborador,
  Puesto,
  TipoContrato,
  TipoJornada,
  CicloPago,
  Estado,
} from "../../../../../../models/index.js";
import { normalizeDecimal } from "../../../../../../common/normalizeDecimal.js";
import { normalizeDateOnly } from "../../../../../../common/normalizeDateOnly.js";

/**
 * Modificar Contrato
 *
 *
 * @param {Object} params
 * @param {number|string} params.id_contrato
 * @param {Object} params.patch
 * @returns {Promise<{id:number, estado:any, warnings:string[]}>}
 */
export const editarContratoExistente = async ({ id_contrato, patch = {} }) => {
  const tx = await sequelize.transaction();

  try {
    if (id_contrato === undefined || id_contrato === null || String(id_contrato).trim() === "") {
      throw new Error("El campo id_contrato es obligatorio");
    }

    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new Error("El formato del body es inválido");
    }

    const allowedFields = new Set([
      "id_colaborador",
      "puesto",
      "fecha_inicio",
      "tipo_contrato",
      "tipo_jornada",
      "salario_base",
      "ciclo_pago",
      "horas_semanales",
      "estado",
    ]);

    const patchKeys = Object.keys(patch);
    if (patchKeys.length === 0) throw new Error("No se enviaron campos para actualizar");

    for (const key of patchKeys) {
      if (!allowedFields.has(key)) {
        throw new Error(`Campo no permitido en el body: ${key}`);
      }
    }

    const contratoActual = await Contrato.findByPk(id_contrato, { transaction: tx });
    if (!contratoActual) throw new Error(`No existe un contrato con id ${id_contrato}`);

    const estadoActivo = await Estado.findOne({
      where: { estado: "ACTIVO" },
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });
    if (!estadoActivo) throw new Error(`No existe el estado "ACTIVO" en catálogo Estado`);
    const ESTADO_ACTIVO_ID = estadoActivo.id_estado;

    const next = {
      id_colaborador: patch.id_colaborador ?? contratoActual.id_colaborador,
      id_puesto: contratoActual.id_puesto,
      id_tipo_contrato: contratoActual.id_tipo_contrato,
      id_tipo_jornada: contratoActual.id_tipo_jornada,
      id_ciclo_pago: contratoActual.id_ciclo_pago,
      fecha_inicio: contratoActual.fecha_inicio,
      horas_semanales: contratoActual.horas_semanales,
      salario_base: contratoActual.salario_base,
      estado: contratoActual.estado,
    };

    let position = null;
    let scheduleType = null;

    if (patch.puesto !== undefined) {
      const nombrePuesto = String(patch.puesto ?? "").trim().toUpperCase();
      if (!nombrePuesto) throw new Error("El puesto no puede ser vacío");
      position = await Puesto.findOne({
        where: { nombre: nombrePuesto },
        transaction: tx,
      });
      if (!position) throw new Error(`No existe un puesto ${patch.puesto}`);
      next.id_puesto = position.id_puesto;
    } else {
      position = await Puesto.findByPk(next.id_puesto, { transaction: tx });
    }

    if (!position) throw new Error("Error interno: no se pudo resolver el puesto");

    if (patch.tipo_contrato !== undefined) {
      const nombreTipoContrato = String(patch.tipo_contrato ?? "").trim().toUpperCase();
      if (!nombreTipoContrato) throw new Error("tipo_contrato no puede ser vacío");

      const contractType = await TipoContrato.findOne({
        where: { tipo_contrato: nombreTipoContrato },
        transaction: tx,
      });
      if (!contractType) throw new Error(`No existe un tipo de contrato ${patch.tipo_contrato}`);
      next.id_tipo_contrato = contractType.id_tipo_contrato;
    }

    if (patch.tipo_jornada !== undefined) {
      const nombreTipoJornada = String(patch.tipo_jornada ?? "").trim().toUpperCase();
      if (!nombreTipoJornada) throw new Error("tipo_jornada no puede ser vacío");

      scheduleType = await TipoJornada.findOne({
        where: { tipo: nombreTipoJornada },
        transaction: tx,
      });
      if (!scheduleType) throw new Error(`No existe un tipo de jornada ${patch.tipo_jornada}`);
      next.id_tipo_jornada = scheduleType.id_tipo_jornada;
    } else {
      scheduleType = await TipoJornada.findByPk(next.id_tipo_jornada, { transaction: tx });
    }

    if (!scheduleType) throw new Error("Error interno: no se pudo resolver el tipo de jornada");

    if (patch.ciclo_pago !== undefined) {
      const nombreCicloPago = String(patch.ciclo_pago ?? "").trim().toUpperCase();
      if (!nombreCicloPago) throw new Error("ciclo_pago no puede ser vacío");

      const paymentCycle = await CicloPago.findOne({
        where: { nombre: nombreCicloPago },
        transaction: tx,
      });
      if (!paymentCycle) throw new Error(`No existe un ciclo de pago ${patch.ciclo_pago}`);
      next.id_ciclo_pago = paymentCycle.id_ciclo_pago;
    }

    const colaborador = await Colaborador.findByPk(next.id_colaborador, { transaction: tx });
    if (!colaborador) throw new Error(`No existe un colaborador con id ${next.id_colaborador}`);

    if (patch.fecha_inicio !== undefined) {
      next.fecha_inicio = normalizeDateOnly(patch.fecha_inicio, "fecha_inicio");
    }

    if (patch.salario_base !== undefined) {
      next.salario_base = normalizeDecimal(patch.salario_base, {
        precision: 12,
        scale: 2,
        fieldName: "salario_base",
      });
    }

    const horasDefault = scheduleType.max_horas_semanales;

    const horasValue =
      patch.horas_semanales === undefined ||
        patch.horas_semanales === null ||
        String(patch.horas_semanales).trim() === ""
        ? horasDefault
        : patch.horas_semanales;

    if (patch.horas_semanales !== undefined || patch.tipo_jornada !== undefined) {
      next.horas_semanales = normalizeDecimal(horasValue, {
        precision: 5,
        scale: 2,
        fieldName: "horas_semanales",
      });

      const maxSem = Number(String(scheduleType.max_horas_semanales).replace(",", "."));
      const horasSem = Number(String(next.horas_semanales).replace(",", "."));
      if (!Number.isFinite(maxSem) || !Number.isFinite(horasSem)) {
        throw new Error("Error interno: horas semanales inválidas");
      }
      if (horasSem <= 0) throw new Error("horas_semanales debe ser mayor a 0");
      if (horasSem > maxSem) {
        throw new Error(
          `horas_semanales (${horasSem}) no puede exceder el máximo semanal del tipo de jornada (${maxSem})`
        );
      }
    }

    if (patch.estado !== undefined) {
      let newEstadoId = null;

      const maybeNum = Number(String(patch.estado).trim());
      if (Number.isFinite(maybeNum) && String(patch.estado).trim() !== "") {
        const st = await Estado.findByPk(maybeNum, { transaction: tx });
        if (!st) throw new Error(`No existe el estado con id ${maybeNum}`);
        newEstadoId = st.id_estado;
      } else {
        const estadoNombre = String(patch.estado ?? "").trim().toUpperCase();
        if (!estadoNombre) throw new Error("estado no puede ser vacío");

        const st = await Estado.findOne({
          where: { estado: estadoNombre },
          attributes: ["id_estado", "estado"],
          transaction: tx,
        });
        if (!st) throw new Error(`No existe el estado ${patch.estado}`);
        newEstadoId = st.id_estado;
      }

      next.estado = newEstadoId;
    }

    // -----------------------------
    // Reglas de negocio: solo 1 contrato ACTIVO por colaborador
    // -----------------------------
    const willBeActive = next.estado === ESTADO_ACTIVO_ID;
    const wasActive = contratoActual.estado === ESTADO_ACTIVO_ID;

    if (willBeActive) {
      const otroActivo = await Contrato.findOne({
        where: {
          id_colaborador: next.id_colaborador,
          estado: ESTADO_ACTIVO_ID,
          id_contrato: { [sequelize.Sequelize.Op.ne]: contratoActual.id_contrato },
        },
        transaction: tx,
      });

      if (otroActivo) {
        throw new Error(
          "El colaborador ya tiene otro contrato activo. Primero desactive el contrato activo actual para activar/asignar este contrato."
        );
      }
    }

    const warnings = [];

    if (patch.salario_base !== undefined || patch.puesto !== undefined) {
      const refMin = Number(String(position.sal_base_referencia_min).replace(",", "."));
      const refMax = Number(String(position.sal_base_referencia_max).replace(",", "."));
      const salarioNum = Number(String(next.salario_base).replace(",", "."));

      if (Number.isFinite(refMin) && Number.isFinite(refMax) && Number.isFinite(salarioNum)) {
        if (salarioNum < refMin) {
          warnings.push(
            `El salario_base (${salarioNum}) es menor al salario de referencia mínimo del puesto (${refMin}). Verifique si corresponde.`
          );
        }
        if (salarioNum > refMax) {
          warnings.push(
            `El salario_base (${salarioNum}) excede el salario de referencia máximo del puesto (${refMax}). Considere actualizar el salario de referencia máximo para este puesto.`
          );
        }
      }
    }

    const updatePayload = {};

    const setIfProvided = (key, value) => {
      if (patch[key] !== undefined) updatePayload[key] = value;
    };

    setIfProvided("id_colaborador", next.id_colaborador);
    if (patch.puesto !== undefined) updatePayload.id_puesto = next.id_puesto;
    if (patch.tipo_contrato !== undefined) updatePayload.id_tipo_contrato = next.id_tipo_contrato;
    if (patch.tipo_jornada !== undefined) updatePayload.id_tipo_jornada = next.id_tipo_jornada;
    if (patch.ciclo_pago !== undefined) updatePayload.id_ciclo_pago = next.id_ciclo_pago;
    if (patch.fecha_inicio !== undefined) updatePayload.fecha_inicio = next.fecha_inicio;
    if (patch.salario_base !== undefined) updatePayload.salario_base = next.salario_base;

    if (patch.horas_semanales !== undefined || patch.tipo_jornada !== undefined) {
      updatePayload.horas_semanales = next.horas_semanales;
    }

    if (patch.estado !== undefined) updatePayload.estado = next.estado;

    if (Object.keys(updatePayload).length === 0) {
      throw new Error("No hay cambios efectivos para aplicar");
    }

    await Contrato.update(updatePayload, {
      where: { id_contrato: contratoActual.id_contrato },
      transaction: tx,
    });

    await tx.commit();

    return {
      id: contratoActual.id_contrato,
      id_colaborador: next.id_colaborador,
      id_puesto: next.id_puesto,
      fecha_inicio: next.fecha_inicio,
      id_tipo_contrato: next.id_tipo_contrato,
      id_tipo_jornada: next.id_tipo_jornada,
      horas_semanales: next.horas_semanales,
      salario_base: next.salario_base,
      id_ciclo_pago: next.id_ciclo_pago,
      estado: next.estado,
      warnings,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
