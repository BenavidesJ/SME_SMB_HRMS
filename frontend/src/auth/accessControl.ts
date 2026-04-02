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
  { path: "/mantenimientos-consultas", roles: ["ADMINISTRADOR"], match: "prefix" },

  // Planillas
  { path: "/planillas", roles: ["ADMINISTRADOR"], match: "prefix" },
  { path: "/planillas/periodo_planilla", roles: ["ADMINISTRADOR"], match: "prefix" },
  { path: "/planillas/mi-planilla", roles: ["ADMINISTRADOR", "EMPLEADO"], match: "prefix" },

  // Asistencia
  { path: "/asistencia", roles: ["ADMINISTRADOR", "EMPLEADO"], match: "prefix" },
  { path: "/asistencia/gestion", roles: ["ADMINISTRADOR"], match: "prefix" },

  // Horas extra
  { path: "/horas-extra", roles: ["ADMINISTRADOR", "EMPLEADO"], match: "prefix" },
  { path: "/horas-extra/gestion", roles: ["ADMINISTRADOR"], match: "prefix" },

  // Vacaciones
  { path: "/vacaciones", roles: ["ADMINISTRADOR", "EMPLEADO"], match: "prefix" },
  { path: "/vacaciones/gestion", roles: ["ADMINISTRADOR"], match: "prefix" },

  // Permisos
  { path: "/permisos", roles: ["ADMINISTRADOR", "EMPLEADO"], match: "prefix" },
  { path: "/permisos/gestion", roles: ["ADMINISTRADOR"], match: "prefix" },

  // Incapacidades
  { path: "/incapacidades", roles: ["ADMINISTRADOR", "EMPLEADO"], match: "prefix" },
  { path: "/incapacidades/gestion", roles: ["ADMINISTRADOR"], match: "prefix" },

  // Otras secciones
  { path: "/aguinaldos", roles: ["ADMINISTRADOR"], match: "prefix" },
  { path: "/liquidaciones", roles: ["ADMINISTRADOR"], match: "prefix" },
  { path: "/reportes", roles: ["ADMINISTRADOR"], match: "prefix" },
  { path: "/evaluacion", roles: ["ADMINISTRADOR"], match: "prefix" },
];

export const getAllowedRolesForPath = (path: string): string[] | undefined => {
  const matches = ACCESS_RULES.filter((rule) => matchesRule(rule, path));
  if (matches.length === 0) return undefined;

  const best = matches.sort((a, b) => b.path.length - a.path.length)[0];
  return best.roles;
};

export const rolesForPath = (path: string) => getAllowedRolesForPath(path);