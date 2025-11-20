import type { JSX } from "react";
import { FiHome, FiUsers, FiSettings, FiCode } from "react-icons/fi";
import { PiMoney } from "react-icons/pi";

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
  { label: "Gestión de Empleados", icon: <FiUsers />, path: "/empleados" },
  { label: "Planillas", icon: <PiMoney />, path: "/planillas" },
  { label: "Schedules", icon: <FiUsers />, path: "/schedules" },
];

export const NAV_SETTINGS: NavItem[] = [
  { label: "Notification", icon: <FiUsers />, path: "/settings/notifications" },
  { label: "Settings", icon: <FiSettings />, path: "/settings" },
  { label: "Documentacion UI", icon: <FiCode />, path: "/ui-docs", roles: ["SUPER_ADMIN"] },
];