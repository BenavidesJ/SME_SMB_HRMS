import type { JSX } from "react";
import { FiUsers, FiSettings, FiCode, FiTable, FiAward, FiBatteryCharging, FiScissors, FiHome } from "react-icons/fi";
import { PiBank, PiCalendarCheck, PiCalendarPlus, PiHospital, PiMoney } from "react-icons/pi";

/*
  El item de navegacion a renderizar en AppNavigation
*/
export interface NavItem {
  /*
    El label o nombre del item.
  */
  label: string;

  /*
    El icono del item.
  */
  icon: JSX.Element;

  /*
    La ruta hacia donde debe navegar.
  */
  path: string;

  /*
    Items anidados.
  */
  children?: NavItem[];

  /*
    Array de roles que pueden acceder esa ruta.
  */
  roles?: string[];
}

export const NAV_MAIN: NavItem[] = [
  { label: "Principal", icon: <FiHome />, path: "/" },
  { label: "Mantenimientos", icon: <FiTable />, path: "/mantenimientos" },
  { label: "Gestión de Planillas", icon: <PiMoney />, path: "/planillas" },
  { label: "Asistencia de Empleados", icon: <PiCalendarCheck />, path: "/asistencia" },
  { label: "Gestión de Vacaciones", icon: <FiBatteryCharging />, path: "/vacaciones" },
  { label: "Gestión de Aguinaldos", icon: <PiBank />, path: "/aguinaldos" },
  { label: "Gestión de Horas Extra", icon: <PiCalendarPlus />, path: "/horas-extra" },
  { label: "Gestión de Liquidaciones", icon: <FiScissors />, path: "/liquidaciones" },
  { label: "Evaluación de Desempeño", icon: <FiAward />, path: "/evaluacion" },
  { label: "Gestión de Incapacidades", icon: <PiHospital />, path: "/incapacidades" },
  { label: "Gestión de Permisos", icon: <FiUsers />, path: "/permisos" },
];

export const NAV_SETTINGS: NavItem[] = [
  { label: "Notification", icon: <FiUsers />, path: "/settings/notifications" },
  { label: "Settings", icon: <FiSettings />, path: "/settings" },
  { label: "Documentacion UI", icon: <FiCode />, path: "/ui-docs", roles: ["SUPER_ADMIN"] },
];