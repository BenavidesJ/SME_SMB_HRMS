export type ContractTemplate = {
  id: string;
  nombre: string;
  puesto: string;
  tipo_jornada: string;
  salario_base: number;
  hora_inicio: string;
  hora_fin: string;
  dias_laborales: string[];
  dias_libres: string[];
};

const STANDARD_TIPO_JORNADA = "DIURNA";
const STANDARD_HORA_INICIO = "08:00";
const STANDARD_HORA_FIN = "17:00";
const STANDARD_DIAS_LABORALES = ["L", "K", "M", "J", "V"];
const STANDARD_DIAS_LIBRES = ["S", "D"];

const salarioMensualDesdeDiario = (salarioDiario: number) => Number((salarioDiario * 30).toFixed(2));

export const contractTemplates: ContractTemplate[] = [
  {
    id: "ADMINISTRADOR_GENERAL_TECNICO_MEDIO",
    nombre: "Gerente general técnico medio",
    puesto: "ADMINISTRADOR GENERAL",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: 496836.17,
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
  {
    id: "ADMINISTRADOR_GENERAL_TECNICO_SUPERIOR",
    nombre: "Gerente general técnico educación superior",
    puesto: "ADMINISTRADOR GENERAL",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: 542096.58,
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
  {
    id: "INGENIERO_SOFTWARE_ESTANDAR",
    nombre: "Plantilla estándar",
    puesto: "INGENIERO DE SOFTWARE",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: 1100000,
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
  {
    id: "CONTADOR_TECNICO_MEDIO",
    nombre: "Contador técnico medio",
    puesto: "CONTADOR",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: 496838.17,
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
  {
    id: "CONTADOR_DIPLOMADO",
    nombre: "Contador diplomado",
    puesto: "CONTADOR",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: 585484.58,
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
  {
    id: "CONTADOR_BACHILLER_UNIVERSITARIO",
    nombre: "Contador bachiller universitario",
    puesto: "CONTADOR",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: 664078.07,
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
  {
    id: "OPERARIO_NIVEL_UNO_LABORATORISTA_QUIMICO_SIN_TITULO",
    nombre: "Operario laboratorista químico sin título",
    puesto: "OPERARIO DE PRODUCCIÓN NIVEL UNO",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: salarioMensualDesdeDiario(13991.86),
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
  {
    id: "OPERARIO_NIVEL_DOS_LABORATORISTA_QUIMICO_TECNICO",
    nombre: "Operario laboratorista químico técnico",
    puesto: "OPERARIO DE PRODUCCIÓN NIVEL DOS",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: 542096.58,
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
  {
    id: "LIDER_PRODUCCION_ESTANDAR",
    nombre: "Plantilla estándar",
    puesto: "LIDER DE PRODUCCIÓN",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: 680000,
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
  {
    id: "VENDEDOR_NIVEL_UNO_ESTANDAR",
    nombre: "Plantilla estándar",
    puesto: "VENDEDOR NIVEL UNO",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: 420000,
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
  {
    id: "VENDEDOR_NIVEL_DOS_ESTANDAR",
    nombre: "Plantilla estándar",
    puesto: "VENDEDOR NIVEL DOS",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: 500000,
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
  {
    id: "SERVICIO_CLIENTE_ESTANDAR",
    nombre: "Plantilla estándar",
    puesto: "OPERADOR DE SERVICIO AL CLIENTE",
    tipo_jornada: STANDARD_TIPO_JORNADA,
    salario_base: 460000,
    hora_inicio: STANDARD_HORA_INICIO,
    hora_fin: STANDARD_HORA_FIN,
    dias_laborales: STANDARD_DIAS_LABORALES,
    dias_libres: STANDARD_DIAS_LIBRES,
  },
];

const normalizePuesto = (puesto?: string | null) => String(puesto ?? "").trim().toUpperCase();

export const getContractTemplatesByPuesto = (puesto?: string | null) => {
  const puestoNormalized = normalizePuesto(puesto);
  if (!puestoNormalized) return [];

  return contractTemplates.filter((template) => normalizePuesto(template.puesto) === puestoNormalized);
};

export const getContractTemplateById = (templateId?: string | null) => {
  if (!templateId) return null;
  return contractTemplates.find((template) => template.id === templateId) ?? null;
};
