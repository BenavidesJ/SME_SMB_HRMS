import seedTemplates from "./evaluationTemplates.seed.json";

export type EvaluationTemplate = {
  id: string;
  nombre: string;
  puesto: string;
  puesto_id?: number;
  rubros_ids: number[];
  fecha_actualizacion?: string;
};

type StoragePayload = {
  version: number;
  templates: EvaluationTemplate[];
};

type ResolveTemplateInput = {
  puestoId?: number;
  puestoNombre?: string | null;
};

type ReplaceEvaluationTemplateInput = {
  puestoId?: number;
  puestoNombre: string;
  template: Omit<EvaluationTemplate, "id" | "puesto" | "puesto_id"> & { id?: string };
};

const STORAGE_KEY = "bioalquimia.evaluation_templates.v1";
const STORAGE_VERSION = 1;

const normalizePuesto = (puesto?: string | null) => String(puesto ?? "").trim().toUpperCase();
const hasRubros = (template: EvaluationTemplate) => template.rubros_ids.length > 0;

const normalizeRubrosIds = (rubrosIds?: number[]) => {
  const seen = new Set<number>();

  return (Array.isArray(rubrosIds) ? rubrosIds : []).reduce<number[]>((acc, value) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0 || seen.has(parsed)) {
      return acc;
    }

    seen.add(parsed);
    acc.push(parsed);
    return acc;
  }, []);
};

const normalizeTemplate = (template: EvaluationTemplate): EvaluationTemplate => ({
  ...template,
  nombre: String(template.nombre ?? "").trim() || "Plantilla de evaluación",
  puesto: normalizePuesto(template.puesto),
  puesto_id:
    typeof template.puesto_id === "number" && Number.isFinite(template.puesto_id)
      ? template.puesto_id
      : undefined,
  rubros_ids: normalizeRubrosIds(template.rubros_ids),
  fecha_actualizacion: String(template.fecha_actualizacion ?? "").trim() || undefined,
});

const sanitizeTemplates = (templates: EvaluationTemplate[]) =>
  templates.map(normalizeTemplate).filter(hasRubros);

const getSeedTemplates = (): EvaluationTemplate[] =>
  seedTemplates.map((template) => normalizeTemplate(template as EvaluationTemplate));

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
      templates: sanitizeTemplates(parsed.templates as EvaluationTemplate[]),
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

const saveAll = (templates: EvaluationTemplate[]) => {
  const sanitizedTemplates = sanitizeTemplates(templates);

  writeStorage({
    version: STORAGE_VERSION,
    templates: sanitizedTemplates,
  });
};

const newTemplateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `eval_tpl_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

const isTemplateFromPuesto = (
  template: EvaluationTemplate,
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

export const listEvaluationTemplates = () => getAll();

export const getEvaluationTemplateById = (templateId?: string | null) => {
  if (!templateId) return null;
  return getAll().find((template) => template.id === templateId && hasRubros(template)) ?? null;
};

export const getEvaluationTemplateForPuesto = ({ puestoId, puestoNombre }: ResolveTemplateInput) => {
  if (!puestoNombre && typeof puestoId !== "number") return null;
  return getAll().find((template) => isTemplateFromPuesto(template, puestoId, puestoNombre) && hasRubros(template)) ?? null;
};

export const replaceEvaluationTemplateForPuesto = ({
  puestoId,
  puestoNombre,
  template,
}: ReplaceEvaluationTemplateInput) => {
  const all = getAll();
  const filtered = all.filter((item) => !isTemplateFromPuesto(item, puestoId, puestoNombre));

  const nextTemplate = normalizeTemplate({
    ...template,
    id: template.id || newTemplateId(),
    puesto: normalizePuesto(puestoNombre),
    puesto_id: puestoId,
    fecha_actualizacion: new Date().toISOString(),
  });

  saveAll([...filtered, nextTemplate]);
  return nextTemplate;
};

export const deleteEvaluationTemplateForPuesto = ({ puestoId, puestoNombre }: ResolveTemplateInput) => {
  const all = getAll();
  const next = all.filter((template) => !isTemplateFromPuesto(template, puestoId, puestoNombre));
  saveAll(next);
};

export const removeRubroFromEvaluationTemplates = (rubroId: number) => {
  const all = getAll();
  const next = all.map((template) => ({
    ...template,
    rubros_ids: template.rubros_ids.filter((id) => id !== rubroId),
  }));
  saveAll(next);
};

export const pruneInvalidRubrosFromEvaluationTemplates = (validRubrosIds: number[]) => {
  const validIds = new Set(validRubrosIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0));
  const all = getAll();

  const next = all.map((template) => ({
    ...template,
    rubros_ids: template.rubros_ids.filter((id) => validIds.has(id)),
  }));

  const changed = next.some((template, index) => template.rubros_ids.length !== all[index]?.rubros_ids.length);
  if (changed) {
    saveAll(next);
  }

  return next;
};
