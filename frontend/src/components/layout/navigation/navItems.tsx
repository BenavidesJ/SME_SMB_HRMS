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
    roles: ["SUPER_ADMIN", "ADMIN"]
  },
  {
    label: "Planillas",
    icon: <PiMoney />,
    path: "/planillas",
    roles: ["SUPER_ADMIN", "ADMIN"]
  },
  {
    label: "Asistencia",
    icon: <PiCalendarCheck />,
    path: "/asistencia",
    roles: ["SUPER_ADMIN", "ADMIN", "EMPLEADO"],
    children: [
      { label: "Marcar Asistencia", path: "/asistencia/marca", roles: ["EMPLEADO", "ADMIN", "SUPER_ADMIN"] },
      { label: "Gestionar Asistencias", path: "/asistencia/gestion", roles: ["ADMIN", "SUPER_ADMIN"] },
    ],
    childrenRoles: ["ADMIN", "SUPER_ADMIN"],
    parentClickBehavior: {
      defaultChildPathForRoles: {
        EMPLEADO: "/asistencia/marca",
      },
    },
  }
  ,
  {
    label: "Vacaciones",
    icon: <FiBatteryCharging />,
    path: "/vacaciones",
    roles: ["SUPER_ADMIN", "ADMIN", "EMPLEADO"],
    children: [
      { label: "Solicitud", path: "/vacaciones/solicitud", roles: ["EMPLEADO", "ADMIN", "SUPER_ADMIN"] },
      { label: "Gestionar Solcitudes", path: "/vacaciones/gestion", roles: ["ADMIN", "SUPER_ADMIN"] },
    ],
    childrenRoles: ["ADMIN", "SUPER_ADMIN"],
    parentClickBehavior: {
      defaultChildPathForRoles: {
        EMPLEADO: "/vacaciones/solicitud",
      },
    },
  },
  {
    label: "Aguinaldos",
    icon: <PiBank />,
    path: "/aguinaldos",
    roles: ["SUPER_ADMIN", "ADMIN"]
  },
  {
    label: "Horas Extra",
    icon: <PiCalendarPlus />,
    path: "/horas-extra",
    roles: ["SUPER_ADMIN", "ADMIN", "EMPLEADO"],
    children: [
      { label: "Horas Extra", path: "/horas-extra/solicitud", roles: ["EMPLEADO", "ADMIN", "SUPER_ADMIN"] },
      { label: "Gestionar Solicitudes", path: "/horas-extra/gestion", roles: ["ADMIN", "SUPER_ADMIN"] },
    ],
    childrenRoles: ["ADMIN", "SUPER_ADMIN"],
    parentClickBehavior: {
      defaultChildPathForRoles: {
        EMPLEADO: "/horas-extra/solicitud",
      },
    },
  },
  {
    label: "Liquidaciones",
    icon: <FiScissors />,
    path: "/liquidaciones",
    roles: ["SUPER_ADMIN", "ADMIN"]
  },
  {
    label: "Evaluación de Desempeño",
    icon: <FiAward />,
    path: "/evaluacion",
    roles: ["SUPER_ADMIN", "ADMIN"]
  },
  {
    label: "Incapacidades",
    icon: <PiHospital />,
    path: "/incapacidades",
    roles: ["SUPER_ADMIN", "ADMIN", "EMPLEADO"]
  },
  {
    label: "Permisos",
    icon: <FiUsers />,
    path: "/permisos",
    roles: ["SUPER_ADMIN", "ADMIN", "EMPLEADO"],
    children: [
      { label: "Solicitud", path: "/permisos/solicitud", roles: ["EMPLEADO", "ADMIN", "SUPER_ADMIN"] },
      { label: "Gestionar Solcitudes", path: "/permisos/gestion", roles: ["ADMIN", "SUPER_ADMIN"] },
    ],
    childrenRoles: ["ADMIN", "SUPER_ADMIN"],
    parentClickBehavior: {
      defaultChildPathForRoles: {
        EMPLEADO: "/permisos/solicitud",
      },
    },
  },
];

export const NAV_SETTINGS: NavItem[] = [
  { label: "Perfil de Usuario", icon: <FiUser />, path: "/perfil" },
  { label: "Documentacion UI", icon: <FiCode />, path: "/ui-docs", roles: ["SUPER_ADMIN"] },
];