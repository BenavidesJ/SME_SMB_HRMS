import { normalizeDecimal } from "../../../../../common/normalizeDecimal.js";
import { sequelize, Departamento, Puesto, Estado } from "../../../../../models/index.js";

/**
 * Actualizar Puesto
 *
 * Campos permitidos: nombre, departamento, sal_base_referencia_min,
 * sal_base_referencia_max, estado
 */
export const actualizarPuesto = async ({ id, patch = {} }) => {
  const tx = await sequelize.transaction();

  try {

    const pid = Number(id);
    if (!Number.isInteger(pid) || pid <= 0) throw new Error("id inválido");

    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new Error("El body debe ser un objeto");
    }

    const allowed = new Set([
      "nombre",
      "departamento",
      "sal_base_referencia_min",
      "sal_base_referencia_max",
      "estado",
    ]);

    const keys = Object.keys(patch);
    if (keys.length === 0) throw new Error("No se enviaron campos a actualizar");
    for (const k of keys) if (!allowed.has(k)) throw new Error(`Campo no permitido: ${k}`);

    const current = await Puesto.findByPk(pid, { transaction: tx });
    if (!current) throw new Error(`No existe un puesto con id ${pid}`);

    const next = {
      nombre: current.nombre,
      id_departamento: current.id_departamento,
      sal_min: current.sal_base_referencia_min,
      sal_max: current.sal_base_referencia_max,
      estado: current.estado,
    };

    if (patch.nombre !== undefined) {
      const name = String(patch.nombre).trim().toUpperCase();
      if (!name) throw new Error("nombre no puede ser vacío");

      const dup = await Puesto.findOne({
        where: { nombre: name, id_puesto: { [sequelize.Sequelize.Op.ne]: pid } },
        transaction: tx,
      });
      if (dup) throw new Error(`Ya existe un puesto: ${name}`);

      next.nombre = name;
    }

    if (patch.departamento !== undefined) {
      const depName = String(patch.departamento).trim().toUpperCase();
      if (!depName) throw new Error("departamento no puede ser vacío");

      const dep = await Departamento.findOne({
        where: { nombre: depName },
        transaction: tx,
      });
      if (!dep) throw new Error(`No existe un departamento: ${depName}`);

      next.id_departamento = dep.id_departamento;
    }

    // salarios
    if (patch.sal_base_referencia_min !== undefined) {
      next.sal_min = normalizeDecimal(patch.sal_base_referencia_min, {
        precision: 12,
        scale: 2,
        fieldName: "sal_base_referencia_min",
      });
    }
    if (patch.sal_base_referencia_max !== undefined) {
      next.sal_max = normalizeDecimal(patch.sal_base_referencia_max, {
        precision: 12,
        scale: 2,
        fieldName: "sal_base_referencia_max",
      });
    }
    if (Number(next.sal_min) > Number(next.sal_max)) {
      throw new Error("El salario mínimo no puede ser mayor que el salario máximo");
    }

    if (patch.estado !== undefined) {
      let estadoId = null;
      const maybeNum = Number(String(patch.estado).trim());
      if (Number.isFinite(maybeNum) && String(patch.estado).trim() !== "") {
        const st = await Estado.findByPk(maybeNum, { transaction: tx });
        if (!st) throw new Error(`No existe estado con id ${maybeNum}`);
        estadoId = st.id_estado;
      } else {
        const txt = String(patch.estado).trim().toUpperCase();
        if (!txt) throw new Error("estado no puede ser vacío");
        const st = await Estado.findOne({
          where: { estado: txt },
          transaction: tx,
        });
        if (!st) throw new Error(`No existe estado ${patch.estado}`);
        estadoId = st.id_estado;
      }
      next.estado = estadoId;
    }

    const updatePayload = {};

    if (next.nombre !== current.nombre) updatePayload.nombre = next.nombre;
    if (next.id_departamento !== current.id_departamento)
      updatePayload.id_departamento = next.id_departamento;
    if (next.sal_min !== current.sal_base_referencia_min)
      updatePayload.sal_base_referencia_min = next.sal_min;
    if (next.sal_max !== current.sal_base_referencia_max)
      updatePayload.sal_base_referencia_max = next.sal_max;
    if (next.estado !== current.estado) updatePayload.estado = next.estado;

    if (Object.keys(updatePayload).length === 0) {
      throw new Error("No hay cambios efectivos para aplicar");
    }

    await Puesto.update(updatePayload, { where: { id_puesto: pid }, transaction: tx });

    const updatedFull = await Puesto.findByPk(pid, {
      transaction: tx,
      attributes: ["id_puesto", "nombre", "sal_base_referencia_min", "sal_base_referencia_max"],
      include: [
        { model: Departamento, as: "departamentoPuesto", attributes: ["nombre"] },
        { model: Estado, as: "estadoPuesto", attributes: ["estado"] },
      ],
    });

    await tx.commit();

    return {
      id: updatedFull.id_puesto,
      departamento: updatedFull.departamentoPuesto?.nombre ?? "",
      puesto: updatedFull.nombre,
      salario_ref_minimo: updatedFull.sal_base_referencia_min,
      salario_ref_maximo: updatedFull.sal_base_referencia_max,
      estado: updatedFull.estadoPuesto?.estado ?? "",
    };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
};
