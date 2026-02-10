export type AccessRule = {
  path: string;
  roles: string[];
  match?: "exact" | "prefix";
};

const normalizePath = (path: string) => {
  if (!path) return "/";
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

const matchesRule = (rule: AccessRule, path: string) => {
  const rulePath = normalizePath(rule.path);
  const target = normalizePath(path);

  if (rule.match === "prefix") {
    return target === rulePath || target.startsWith(`${rulePath}/`);
  }

  return target === rulePath;
};

export const ACCESS_RULES: AccessRule[] = [
  // Mantenimientos y consultas
  { path: "/mantenimientos-consultas", roles: ["SUPER_ADMIN", "ADMIN"], match: "prefix" },

  // Planillas
  { path: "/planillas", roles: ["SUPER_ADMIN", "ADMIN"], match: "prefix" },
  { path: "/planillas/periodo_planilla", roles: ["SUPER_ADMIN", "ADMIN"], match: "prefix" },

  // Asistencia
  { path: "/asistencia", roles: ["SUPER_ADMIN", "ADMIN", "EMPLEADO"], match: "prefix" },
  { path: "/asistencia/gestion", roles: ["SUPER_ADMIN", "ADMIN"], match: "prefix" },

  // Horas extra
  { path: "/horas-extra", roles: ["SUPER_ADMIN", "ADMIN", "EMPLEADO"], match: "prefix" },
  { path: "/horas-extra/gestion", roles: ["SUPER_ADMIN", "ADMIN"], match: "prefix" },

  // Vacaciones
  { path: "/vacaciones", roles: ["SUPER_ADMIN", "ADMIN", "EMPLEADO"], match: "prefix" },
  { path: "/vacaciones/gestion", roles: ["SUPER_ADMIN", "ADMIN"], match: "prefix" },

  // Permisos
  { path: "/permisos", roles: ["SUPER_ADMIN", "ADMIN", "EMPLEADO"], match: "prefix" },
  { path: "/permisos/gestion", roles: ["SUPER_ADMIN", "ADMIN"], match: "prefix" },

  // Incapacidades
  { path: "/incapacidades", roles: ["SUPER_ADMIN", "ADMIN", "EMPLEADO"], match: "prefix" },

  // Otras secciones
  { path: "/aguinaldos", roles: ["SUPER_ADMIN", "ADMIN"], match: "prefix" },
  { path: "/liquidaciones", roles: ["SUPER_ADMIN", "ADMIN"], match: "prefix" },
  { path: "/evaluacion", roles: ["SUPER_ADMIN", "ADMIN"], match: "prefix" },
];

export const getAllowedRolesForPath = (path: string): string[] | undefined => {
  const matches = ACCESS_RULES.filter((rule) => matchesRule(rule, path));
  if (matches.length === 0) return undefined;

  const best = matches.sort((a, b) => b.path.length - a.path.length)[0];
  return best.roles;
};

export const rolesForPath = (path: string) => getAllowedRolesForPath(path);