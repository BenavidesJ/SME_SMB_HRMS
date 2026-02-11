import type { JSX } from "react";
import { FiUsers, FiTable, FiAward, FiBatteryCharging, FiScissors, FiHome, FiUser } from "react-icons/fi";
import { PiBank, PiCalendarCheck, PiCalendarPlus, PiHospital, PiMoney } from "react-icons/pi";
import { rolesForPath } from "../../../auth/accessControl";

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
    roles: rolesForPath("/mantenimientos-consultas"),
  },
  {
    label: "Planillas",
    icon: <PiMoney />,
    path: "/planillas",
    roles: rolesForPath("/planillas"),
  },
  {
    label: "Asistencia",
    icon: <PiCalendarCheck />,
    path: "/asistencia",
    roles: rolesForPath("/asistencia"),
    children: [
      { label: "Marcar Asistencia", path: "/asistencia/marca", roles: rolesForPath("/asistencia/marca") },
      { label: "Gestionar Asistencias", path: "/asistencia/gestion", roles: rolesForPath("/asistencia/gestion") },
    ],
    childrenRoles: rolesForPath("/asistencia/gestion"),
    parentClickBehavior: {
      defaultChildPathForRoles: {
        EMPLEADO: "/asistencia/marca",
      },
    },
  },
  {
    label: "Vacaciones",
    icon: <FiBatteryCharging />,
    path: "/vacaciones",
    roles: rolesForPath("/vacaciones"),
    children: [
      { label: "Solicitud", path: "/vacaciones/solicitud", roles: rolesForPath("/vacaciones/solicitud") },
      { label: "Gestionar Solcitudes", path: "/vacaciones/gestion", roles: rolesForPath("/vacaciones/gestion") },
    ],
    childrenRoles: rolesForPath("/vacaciones/gestion"),
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
    roles: rolesForPath("/aguinaldos"),
  },
  {
    label: "Horas Extra",
    icon: <PiCalendarPlus />,
    path: "/horas-extra",
    roles: rolesForPath("/horas-extra"),
    children: [
      { label: "Horas Extra", path: "/horas-extra/solicitud", roles: rolesForPath("/horas-extra/solicitud") },
      { label: "Gestionar Solicitudes", path: "/horas-extra/gestion", roles: rolesForPath("/horas-extra/gestion") },
    ],
    childrenRoles: rolesForPath("/horas-extra/gestion"),
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
    roles: rolesForPath("/liquidaciones"),
  },
  {
    label: "Evaluación de Desempeño",
    icon: <FiAward />,
    path: "/evaluacion",
    roles: rolesForPath("/evaluacion"),
  },
  {
    label: "Incapacidades",
    icon: <PiHospital />,
    path: "/incapacidades",
    roles: rolesForPath("/incapacidades"),
  },
  {
    label: "Permisos",
    icon: <FiUsers />,
    path: "/permisos",
    roles: rolesForPath("/permisos"),
    children: [
      { label: "Solicitud", path: "/permisos/solicitud", roles: rolesForPath("/permisos/solicitud") },
      { label: "Gestionar Solcitudes", path: "/permisos/gestion", roles: rolesForPath("/permisos/gestion") },
    ],
    childrenRoles: rolesForPath("/permisos/gestion"),
    parentClickBehavior: {
      defaultChildPathForRoles: {
        EMPLEADO: "/permisos/solicitud",
      },
    },
  },
];

export const NAV_SETTINGS: NavItem[] = [
  { label: "Perfil de Usuario", icon: <FiUser />, path: "/perfil" },
];