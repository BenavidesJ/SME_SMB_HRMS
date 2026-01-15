import { Provincia } from "../../../../../models/index.js";

export const actualizarProvincia = async ({ id, patch = {} }) => {
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error("id inválido");

  const { nombre } = patch;

  if (nombre === undefined || String(nombre).trim() === "")
    throw new Error("El campo nombre es obligatorio");

  const txt = String(nombre).trim();

  const existsByName = await Provincia.findOne({ where: { nombre: txt } });
  if (existsByName && Number(existsByName.id_provincia) !== pid) {
    throw new Error(`Ya existe una provincia con nombre ${txt}`);
  }

  const [updated] = await Provincia.update(
    { nombre: txt },
    { where: { id_provincia: pid } }
  );

  if (!updated) throw new Error("Registro no encontrado / sin cambios");

  return { id_provincia: pid, nombre: txt };
};
