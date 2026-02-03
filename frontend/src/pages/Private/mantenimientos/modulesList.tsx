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
  FiSettings,
  FiClipboard,
  FiAlertCircle,
  FiPhone,
  FiCalendar,
} from "react-icons/fi";
import { MdOutlineWorkOutline, MdOutlineLocationCity } from "react-icons/md";
import { RiExchangeDollarLine, RiTimerLine } from "react-icons/ri";
import { BsClipboardData } from "react-icons/bs";

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
    { name: "Contratos", path: "contratos", color: "blue", icon: <FiClipboard /> },
    { name: "Horarios Laborales", path: "horarios_laborales", color: "cyan", icon: <RiTimerLine /> },
    { name: "Deducciones de Planilla", path: "deducciones_planilla", color: "red", icon: <RiExchangeDollarLine /> },
    { name: "Provincias", path: "provincias", color: "green", icon: <FiMap /> },
    { name: "Cantones", path: "cantones", color: "teal", icon: <MdOutlineLocationCity /> },
    { name: "Distritos", path: "distritos", color: "cyan", icon: <FiMapPin /> },
    { name: "Direcciones", path: "direcciones", color: "blue", icon: <FiHome /> },
    { name: "Tipos de Marca", path: "tipos_marca", color: "yellow", icon: <FiClock /> },
    { name: "Tipos de Incapacidad", path: "tipos_incapacidad", color: "purple", icon: <FiAlertCircle /> },
    { name: "Jornadas Diarias", path: "jornadas_diarias", color: "teal", icon: <BsClipboardData /> },
    { name: "Tipos de Hora Extra", path: "tipos_hora_extra", color: "orange", icon: <FiClock /> },
    { name: "Tipos de Solicitud", path: "tipos_solicitud", color: "yellow", icon: <FiSettings /> },
    { name: "Causas de Liquidación", path: "causas_liquidacion", color: "orange", icon: <FiTag /> },
    { name: "Feriados", path: "feriados", color: "pink", icon: <FiCalendar /> },
    { name: "Teléfonos", path: "telefonos", color: "pink", icon: <FiPhone /> },
  ];