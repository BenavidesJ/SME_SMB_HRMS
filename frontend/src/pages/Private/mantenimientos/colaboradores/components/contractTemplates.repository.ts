import seedTemplates from "./contractTemplates.seed.json";

export type ContractTemplate = {
  id: string;
  nombre: string;
  puesto: string;
  puesto_id?: number;
  tipo_jornada: string;
  salario_base: number;
  hora_inicio: string;
  hora_fin: string;
  dias_laborales: string[];
  dias_libres: string[];
};

type StoragePayload = {
  version: number;
  templates: ContractTemplate[];
};

type ReplaceTemplatesInput = {
  puestoId?: number;
  puestoNombre: string;
  templates: ContractTemplate[];
};

const STORAGE_KEY = "bioalquimia.contract_templates.v1";
const STORAGE_VERSION = 1;

const normalizePuesto = (puesto?: string | null) =>
  String(puesto ?? "").trim().toUpperCase();

const normalizeTemplate = (template: ContractTemplate): ContractTemplate => ({
  ...template,
  puesto: normalizePuesto(template.puesto),
  tipo_jornada: String(template.tipo_jornada ?? "").trim().toUpperCase(),
  salario_base: Number(template.salario_base),
  hora_inicio: String(template.hora_inicio ?? "").slice(0, 5),
  hora_fin: String(template.hora_fin ?? "").slice(0, 5),
  dias_laborales: Array.isArray(template.dias_laborales) ? template.dias_laborales : [],
  dias_libres: Array.isArray(template.dias_libres) ? template.dias_libres : [],
});

const getSeedTemplates = (): ContractTemplate[] =>
  seedTemplates.map((template) => normalizeTemplate(template as ContractTemplate));

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readStorage = (): StoragePayload | null => {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoragePayload;
    if (!parsed || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.templates)) {
      return null;
    }

    return {
      version: STORAGE_VERSION,
      templates: parsed.templates.map(normalizeTemplate),
    };
  } catch {
    return null;
  }
};

const writeStorage = (payload: StoragePayload) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const ensureStorage = (): StoragePayload => {
  const existing = readStorage();
  if (existing) return existing;

  const seeded = {
    version: STORAGE_VERSION,
    templates: getSeedTemplates(),
  };
  writeStorage(seeded);
  return seeded;
};

const getAll = () => ensureStorage().templates;

const saveAll = (templates: ContractTemplate[]) => {
  writeStorage({
    version: STORAGE_VERSION,
    templates: templates.map(normalizeTemplate),
  });
};

const newTemplateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `tpl_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

const isTemplateFromPuesto = (
  template: ContractTemplate,
  puestoId?: number,
  puestoNombre?: string | null,
) => {
  const normalizedPuesto = normalizePuesto(puestoNombre);

  if (typeof puestoId === "number" && Number.isFinite(puestoId)) {
    if (template.puesto_id === puestoId) return true;
    return normalizePuesto(template.puesto) === normalizedPuesto;
  }

  return normalizePuesto(template.puesto) === normalizedPuesto;
};

export const listContractTemplates = () => getAll();

export const getContractTemplateById = (templateId?: string | null) => {
  if (!templateId) return null;
  return getAll().find((template) => template.id === templateId) ?? null;
};

export const getContractTemplatesByPuesto = (puesto?: string | null) => {
  const puestoNormalized = normalizePuesto(puesto);
  if (!puestoNormalized) return [];

  return getAll().filter((template) => normalizePuesto(template.puesto) === puestoNormalized);
};

export const getContractTemplatesForPuesto = (params: {
  puestoId?: number;
  puestoNombre?: string | null;
}) => {
  const { puestoId, puestoNombre } = params;
  if (!puestoNombre && typeof puestoId !== "number") return [];

  return getAll().filter((template) => isTemplateFromPuesto(template, puestoId, puestoNombre));
};

export const replaceContractTemplatesForPuesto = ({
  puestoId,
  puestoNombre,
  templates,
}: ReplaceTemplatesInput) => {
  const all = getAll();
  const filtered = all.filter((template) => !isTemplateFromPuesto(template, puestoId, puestoNombre));

  const normalizedPuesto = normalizePuesto(puestoNombre);
  const nextTemplates = templates.map((template) =>
    normalizeTemplate({
      ...template,
      id: template.id || newTemplateId(),
      puesto: normalizedPuesto,
      puesto_id: puestoId,
    }),
  );

  saveAll([...filtered, ...nextTemplates]);
  return nextTemplates;
};

export const createContractTemplateForPuesto = (
  puestoId: number | undefined,
  puestoNombre: string,
  template: Omit<ContractTemplate, "id" | "puesto" | "puesto_id">,
) => {
  const all = getAll();
  const created = normalizeTemplate({
    ...template,
    id: newTemplateId(),
    puesto: normalizePuesto(puestoNombre),
    puesto_id: puestoId,
  });

  saveAll([...all, created]);
  return created;
};

export const updateContractTemplate = (
  templateId: string,
  patch: Partial<Omit<ContractTemplate, "id">>,
) => {
  const all = getAll();
  const next = all.map((template) => {
    if (template.id !== templateId) return template;
    return normalizeTemplate({ ...template, ...patch, id: template.id });
  });
  saveAll(next);
};

export const deleteContractTemplate = (templateId: string) => {
  const all = getAll();
  saveAll(all.filter((template) => template.id !== templateId));
};
