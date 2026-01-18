import { Canton, Provincia } from "../../../../../models/index.js";

export const actualizarCanton = async ({ id, patch = {} }) => {
  const cid = Number(id);
  if (!Number.isInteger(cid) || cid <= 0) throw new Error("id inválido");

  const { nombre, id_provincia } = patch;

  // Permitimos actualizar nombre y/o provincia, pero al menos uno debe venir
  const hasNombre = nombre !== undefined;
  const hasProv = id_provincia !== undefined;
  if (!hasNombre && !hasProv) throw new Error("No se enviaron campos para actualizar");

  const canton = await Canton.findByPk(cid);
  if (!canton) throw new Error(`No existe cantón con id ${cid}`);

  const next = {};

  if (hasNombre) {
    if (String(nombre).trim() === "") throw new Error("El campo nombre es obligatorio");
    next.nombre = String(nombre).trim();
  }

  if (hasProv) {
    const pid = Number(id_provincia);
    if (!Number.isInteger(pid) || pid <= 0) throw new Error("id_provincia inválido");

    const prov = await Provincia.findByPk(pid);
    if (!prov) throw new Error(`No existe provincia con id ${pid}`);

    next.id_provincia = pid;
  }

  const finalProv = next.id_provincia ?? canton.id_provincia;
  const finalNombre = next.nombre ?? canton.nombre;

  const existsCombo = await Canton.findOne({
    where: { id_provincia: finalProv, nombre: finalNombre },
  });

  if (existsCombo && Number(existsCombo.id_canton) !== cid) {
    throw new Error(`Ya existe un cantón llamado ${finalNombre} en esa provincia`);
  }

  const [updated] = await Canton.update(next, { where: { id_canton: cid } });
  if (!updated) throw new Error("Registro no encontrado / sin cambios");

  return {
    id_canton: cid,
    id_provincia: finalProv,
    nombre: finalNombre,
  };
};
