import type { JSX } from "react";
import {
  FiBriefcase,
  FiShield,
  FiHome,
  FiMapPin,
  FiMap,
  FiGrid,
  FiTag,
  FiFileText,
  FiClock,
  FiDollarSign,
  FiAlertCircle,
  FiCalendar,
} from "react-icons/fi";
import { MdOutlineWorkOutline, MdOutlineLocationCity } from "react-icons/md";
import { RiExchangeDollarLine } from "react-icons/ri";

type ModuleColor =
  | "gray"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "cyan"
  | "purple"
  | "pink";

export const modules: Array<{
  name: string;
  path: string;
  description: string;
  color: ModuleColor;
  icon: JSX.Element;
}> = [
    { name: "Colaboradores", description: "Gestión de colaboradores y sus contratos", path: "colaboradores", color: "blue", icon: <FiBriefcase /> },
    { name: "Estados Civiles", description: "Gestión de los estados civiles disponibles para los usuarios", path: "estados_civiles", color: "cyan", icon: <FiHome /> },
    { name: "Estados", description: "Gestión de los estados disponibles en el sistema.", path: "estados", color: "gray", icon: <FiTag /> },
    { name: "Roles", description: "Gestión de los roles y permisos disponibles para controlar el acceso dentro del sistema", path: "roles", color: "purple", icon: <FiShield /> },
    { name: "Departamentos", description: "Gestión de los departamentos que organizan la estructura interna de la empresa", path: "departamentos", color: "teal", icon: <FiGrid /> },
    { name: "Puestos", path: "puestos", description: "Gestión de los puestos de trabajo que se asignan a los colaboradores", color: "blue", icon: <MdOutlineWorkOutline /> },
    { name: "Tipos de Contrato", description: "Gestión de los tipos de contrato disponibles para la contratación del personal", path: "tipos_contrato", color: "purple", icon: <FiFileText /> },
    { name: "Tipos de Jornada", description: "Gestión de los tipos de jornada laboral que utiliza la empresa", path: "tipos_jornada", color: "cyan", icon: <FiClock /> },
    { name: "Ciclos de Pago", description: "Gestión de los ciclos de pago que se aplican en planillas y contratos", path: "ciclos_pago", color: "green", icon: <FiDollarSign /> },
    { name: "Deducciones de Planilla", description: "Gestión de las deducciones que se aplican al cálculo de la planilla", path: "deducciones_planilla", color: "red", icon: <RiExchangeDollarLine /> },
    { name: "Provincias", description: "Gestión de las provincias registradas para la ubicación de colaboradores y empresas", path: "provincias", color: "green", icon: <FiMap /> },
    { name: "Cantones", description: "Gestión de los cantones asociados a las provincias registradas en el sistema", path: "cantones", color: "teal", icon: <MdOutlineLocationCity /> },
    { name: "Distritos", description: "Gestión de los distritos asociados a los cantones registrados en el sistema", path: "distritos", color: "cyan", icon: <FiMapPin /> },
    { name: "Tipos de Marca", description: "Gestión de los tipos de marca utilizados para el control de asistencia", path: "tipos_marca", color: "yellow", icon: <FiClock /> },
    { name: "Tipos de Incapacidad", description: "Gestión de los tipos de incapacidad y sus reglas de aplicación en el sistema", path: "tipos_incapacidad", color: "purple", icon: <FiAlertCircle /> },
    { name: "Tipos de Hora Extra", description: "Gestión de los tipos de hora extra disponibles para el cálculo de recargos", path: "tipos_hora_extra", color: "orange", icon: <FiClock /> },
    { name: "Causas de Liquidación", description: "Gestión de las causas de liquidación utilizadas al registrar la terminación laboral", path: "causas_liquidacion", color: "orange", icon: <FiTag /> },
    { name: "Feriados", description: "Gestión de los feriados que afectan la asistencia, planilla y cálculos laborales", path: "feriados", color: "pink", icon: <FiCalendar /> },
  ];