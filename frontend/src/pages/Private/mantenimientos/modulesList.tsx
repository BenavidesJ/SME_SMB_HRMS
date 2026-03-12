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
    { name: "Colaboradores", description: "Aquí puedes gestionar los colaboradores de la empresa y sus contratos", path: "colaboradores", color: "blue", icon: <FiBriefcase /> },
    { name: "Estados Civiles", description: "Aquí puedes gestionar los estados civiles disponibles para los usuarios", path: "estados_civiles", color: "cyan", icon: <FiHome /> },
    { name: "Estados", description: "Aquí puedes gestionar los estados disponibles en el sistema.", path: "estados", color: "gray", icon: <FiTag /> },
    { name: "Roles", description: "", path: "roles", color: "purple", icon: <FiShield /> },
    { name: "Departamentos", description: "", path: "departamentos", color: "teal", icon: <FiGrid /> },
    { name: "Puestos", path: "puestos", description: "", color: "blue", icon: <MdOutlineWorkOutline /> },
    { name: "Tipos de Contrato", description: "", path: "tipos_contrato", color: "purple", icon: <FiFileText /> },
    { name: "Tipos de Jornada", description: "", path: "tipos_jornada", color: "cyan", icon: <FiClock /> },
    { name: "Ciclos de Pago", description: "", path: "ciclos_pago", color: "green", icon: <FiDollarSign /> },
    { name: "Deducciones de Planilla", description: "", path: "deducciones_planilla", color: "red", icon: <RiExchangeDollarLine /> },
    { name: "Provincias", description: "", path: "provincias", color: "green", icon: <FiMap /> },
    { name: "Cantones", description: "", path: "cantones", color: "teal", icon: <MdOutlineLocationCity /> },
    { name: "Distritos", description: "", path: "distritos", color: "cyan", icon: <FiMapPin /> },
    { name: "Tipos de Marca", description: "", path: "tipos_marca", color: "yellow", icon: <FiClock /> },
    { name: "Tipos de Incapacidad", description: "", path: "tipos_incapacidad", color: "purple", icon: <FiAlertCircle /> },
    { name: "Tipos de Hora Extra", description: "", path: "tipos_hora_extra", color: "orange", icon: <FiClock /> },
    { name: "Causas de Liquidación", description: "", path: "causas_liquidacion", color: "orange", icon: <FiTag /> },
    { name: "Feriados", description: "", path: "feriados", color: "pink", icon: <FiCalendar /> },
  ];