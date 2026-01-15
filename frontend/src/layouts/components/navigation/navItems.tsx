import type { JSX } from "react";
import { FiUsers, FiCode, FiTable, FiAward, FiBatteryCharging, FiScissors, FiHome, FiUser } from "react-icons/fi";
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
  children?: Omit<NavItem, "icon">[];

  /*
    Array de roles que pueden acceder esa ruta.
  */
  roles?: string[];
  /*
    Array de roles que pueden acceder el submenu.
  */
  childrenRoles?: string[];

  parentClickBehavior?: {
    // path por rol 
    defaultChildPathForRoles?: Record<string, string>;
  };
}

export const NAV_MAIN: NavItem[] = [
  { label: "Principal", icon: <FiHome />, path: "/" },
  {
    label: "Mantenimientos y Consultas",
    icon: <FiTable />,
    path: "/mantenimientos-consultas",
    roles: ["SUPER_ADMIN", "ADMINISTRADOR"]
  },
  {
    label: "Gestión de Planillas",
    icon: <PiMoney />,
    path: "/planillas",
    roles: ["SUPER_ADMIN", "ADMINISTRADOR"]
  },
  {
    label: "Asistencia",
    icon: <PiCalendarCheck />,
    path: "/asistencia",
    roles: ["SUPER_ADMIN", "ADMINISTRADOR", "EMPLEADO"],
    children: [
      { label: "Marcar Asistencia", path: "/asistencia/marca", roles: ["EMPLEADO", "ADMINISTRADOR", "SUPER_ADMIN"] },
      { label: "Gestionar Asistencias", path: "/asistencia/gestion", roles: ["ADMINISTRADOR", "SUPER_ADMIN"] },
    ],
    childrenRoles: ["ADMINISTRADOR", "SUPER_ADMIN"],
    parentClickBehavior: {
      defaultChildPathForRoles: {
        EMPLEADO: "/asistencia/marca",
      },
    },
  }
  ,
  {
    label: "Gestión de Vacaciones",
    icon: <FiBatteryCharging />,
    path: "/vacaciones",
    roles: ["SUPER_ADMIN", "ADMINISTRADOR", "EMPLEADO"]
  },
  {
    label: "Gestión de Aguinaldos",
    icon: <PiBank />,
    path: "/aguinaldos",
    roles: ["SUPER_ADMIN", "ADMINISTRADOR"]
  },
  {
    label: "Horas Extra",
    icon: <PiCalendarPlus />,
    path: "/horas-extra",
    roles: ["SUPER_ADMIN", "ADMINISTRADOR", "EMPLEADO"],
    children: [
      { label: "Horas Extra", path: "/horas-extra/solicitud", roles: ["EMPLEADO", "ADMINISTRADOR", "SUPER_ADMIN"] },
      { label: "Gestionar Solicitudes", path: "/horas-extra/gestion", roles: ["ADMINISTRADOR", "SUPER_ADMIN"] },
    ],
    childrenRoles: ["ADMINISTRADOR", "SUPER_ADMIN"],
    parentClickBehavior: {
      defaultChildPathForRoles: {
        EMPLEADO: "/horas-extra/solicitud",
      },
    },
  },
  {
    label: "Gestión de Liquidaciones",
    icon: <FiScissors />,
    path: "/liquidaciones",
    roles: ["SUPER_ADMIN", "ADMINISTRADOR"]
  },
  {
    label: "Evaluación de Desempeño",
    icon: <FiAward />,
    path: "/evaluacion",
    roles: ["SUPER_ADMIN", "ADMINISTRADOR"]
  },
  {
    label: "Gestión de Incapacidades",
    icon: <PiHospital />,
    path: "/incapacidades",
    roles: ["SUPER_ADMIN", "ADMINISTRADOR", "EMPLEADO"]
  },
  {
    label: "Gestión de Permisos",
    icon: <FiUsers />,
    path: "/permisos",
    roles: ["SUPER_ADMIN", "ADMINISTRADOR", "EMPLEADO"]
  },
];

export const NAV_SETTINGS: NavItem[] = [
  { label: "Perfil de Usuario", icon: <FiUser />, path: "/perfil" },
  { label: "Documentacion UI", icon: <FiCode />, path: "/ui-docs", roles: ["SUPER_ADMIN"] },
];