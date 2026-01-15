import type { SolicitudesQuery } from "../../../../../types/Overtime";


export const buildQuery = (f: SolicitudesQuery) => {
  const params = new URLSearchParams();

  if (f.modo === "por_estado") params.set("agrupamiento", "estado");
  if (f.modo === "por_colaborador") params.set("agrupamiento", "id_colaborador");

  if (f.estado) params.set("estado", f.estado);
  if (f.id_colaborador != null) params.set("id_colaborador", String(f.id_colaborador));

  const qs = params.toString();
  return `/horas-extra/solicitudes${qs ? `?${qs}` : ""}`;
};