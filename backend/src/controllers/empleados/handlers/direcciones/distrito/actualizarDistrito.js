import { Canton, Distrito } from "../../../../../models/index.js";

export const actualizarDistrito = async ({ id, patch = {} }) => {
  const did = Number(id);
  if (!Number.isInteger(did) || did <= 0) throw new Error("id inválido");

  const { nombre, id_canton } = patch;

  const hasNombre = nombre !== undefined;
  const hasCanton = id_canton !== undefined;
  if (!hasNombre && !hasCanton) throw new Error("No se enviaron campos para actualizar");

  const distrito = await Distrito.findByPk(did);
  if (!distrito) throw new Error(`No existe distrito con id ${did}`);

  const next = {};

  if (hasNombre) {
    if (String(nombre).trim() === "") throw new Error("El campo nombre es obligatorio");
    next.nombre = String(nombre).trim();
  }

  if (hasCanton) {
    const cid = Number(id_canton);
    if (!Number.isInteger(cid) || cid <= 0) throw new Error("id_canton inválido");

    const canton = await Canton.findByPk(cid);
    if (!canton) throw new Error(`No existe cantón con id ${cid}`);

    next.id_canton = cid;
  }

  const finalCanton = next.id_canton ?? distrito.id_canton;
  const finalNombre = next.nombre ?? distrito.nombre;

  const existsCombo = await Distrito.findOne({
    where: { id_canton: finalCanton, nombre: finalNombre },
  });

  if (existsCombo && Number(existsCombo.id_distrito) !== did) {
    throw new Error(`Ya existe un distrito llamado ${finalNombre} en ese cantón`);
  }

  const [updated] = await Distrito.update(next, { where: { id_distrito: did } });
  if (!updated) throw new Error("Registro no encontrado / sin cambios");

  return {
    id_distrito: did,
    id_canton: finalCanton,
    nombre: finalNombre,
  };
};
