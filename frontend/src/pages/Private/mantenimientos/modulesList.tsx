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
  color: ModuleColor;
  icon: JSX.Element;
}> = [
    { name: "Colaboradores", path: "colaboradores", color: "blue", icon: <FiBriefcase /> },
    { name: "Estados Civiles", path: "estados_civiles", color: "cyan", icon: <FiHome /> },
    { name: "Estados", path: "estados", color: "gray", icon: <FiTag /> },
    { name: "Roles", path: "roles", color: "purple", icon: <FiShield /> },
    { name: "Departamentos", path: "departamentos", color: "teal", icon: <FiGrid /> },
    { name: "Puestos", path: "puestos", color: "blue", icon: <MdOutlineWorkOutline /> },
    { name: "Tipos de Contrato", path: "tipos_contrato", color: "purple", icon: <FiFileText /> },
    { name: "Tipos de Jornada", path: "tipos_jornada", color: "cyan", icon: <FiClock /> },
    { name: "Ciclos de Pago", path: "ciclos_pago", color: "green", icon: <FiDollarSign /> },
    { name: "Deducciones de Planilla", path: "deducciones_planilla", color: "red", icon: <RiExchangeDollarLine /> },
    { name: "Provincias", path: "provincias", color: "green", icon: <FiMap /> },
    { name: "Cantones", path: "cantones", color: "teal", icon: <MdOutlineLocationCity /> },
    { name: "Distritos", path: "distritos", color: "cyan", icon: <FiMapPin /> },
    { name: "Tipos de Marca", path: "tipos_marca", color: "yellow", icon: <FiClock /> },
    { name: "Tipos de Incapacidad", path: "tipos_incapacidad", color: "purple", icon: <FiAlertCircle /> },
    { name: "Tipos de Hora Extra", path: "tipos_hora_extra", color: "orange", icon: <FiClock /> },
    { name: "Causas de Liquidación", path: "causas_liquidacion", color: "orange", icon: <FiTag /> },
    { name: "Feriados", path: "feriados", color: "pink", icon: <FiCalendar /> },
  ];