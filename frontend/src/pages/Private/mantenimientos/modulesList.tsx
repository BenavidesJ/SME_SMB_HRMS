import type { JSX } from "react";
import {
  FiBriefcase,
  FiUsers,
  FiShield,
  FiBookOpen,
  FiHome,
  FiMapPin,
  FiMap,
  FiGrid,
  FiTag,
  FiFileText,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiSettings,
  FiClipboard,
  FiCheckSquare,
  FiActivity,
  FiAlertCircle,
  FiPhone,
  FiList,
  FiLayers,
  FiLock,
} from "react-icons/fi";
import { ImManWoman } from "react-icons/im";
import { TbChristmasTree, TbFileInvoice, TbFileAnalytics } from "react-icons/tb";
import { MdOutlineWorkOutline, MdOutlineLocationCity } from "react-icons/md";
import { RiExchangeDollarLine, RiTimerLine } from "react-icons/ri";
import { BsClipboardData } from "react-icons/bs";
import { BiInjection } from 'react-icons/bi';

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
      { name: "Usuarios", path: "usuarios", color: "red", icon: <FiUsers /> },
      { name: "Géneros", path: "generos", color: "teal", icon: <ImManWoman /> },
      { name: "Estados Civiles", path: "estados_civiles", color: "cyan", icon: <FiHome /> },
      { name: "Estados", path: "estados", color: "gray", icon: <FiTag /> },
      { name: "Roles", path: "roles", color: "purple", icon: <FiShield /> },
      { name: "Asignar Rol a Usuario", path: "usuario_rol", color: "yellow", icon: <FiLock /> },
      { name: "Bitácora de Auditoría", path: "bitacora_auditoria", color: "orange", icon: <FiBookOpen /> },
      { name: "Departamentos", path: "departamentos", color: "teal", icon: <FiGrid /> },
      { name: "Puestos", path: "puestos", color: "blue", icon: <MdOutlineWorkOutline /> },
      { name: "Tipos de Contrato", path: "tipos_contrato", color: "purple", icon: <FiFileText /> },
      { name: "Tipos de Jornada", path: "tipos_jornada", color: "cyan", icon: <FiClock /> },
      { name: "Ciclos de Pago", path: "ciclos_pago", color: "green", icon: <FiDollarSign /> },
      { name: "Contratos", path: "contratos", color: "blue", icon: <FiClipboard /> },
      { name: "Horarios Laborales", path: "horarios_laborales", color: "cyan", icon: <RiTimerLine /> },
      { name: "Ajustes Salariales", path: "ajustes_salariales", color: "orange", icon: <FiTrendingUp /> },
      { name: "Evaluaciones", path: "evaluaciones", color: "purple", icon: <FiCheckSquare /> },
      { name: "Rubros de Evaluación", path: "rubros_evaluacion", color: "pink", icon: <TbFileAnalytics /> },
      { name: "Asignar Rubro a Evaluación", path: "evaluacion_rubro", color: "yellow", icon: <FiLayers /> },
      { name: "Períodos de Planilla", path: "periodos_planilla", color: "teal", icon: <FiCalendar /> },
      { name: "Detalles de Planilla", path: "detalle_planilla", color: "blue", icon: <TbFileInvoice /> },
      { name: "Tipos de Deducción", path: "tipos_deduccion", color: "purple", icon: <FiList /> },
      { name: "Deducciones de Planilla", path: "deducciones_planilla", color: "red", icon: <RiExchangeDollarLine /> },
      { name: "Aguinaldo", path: "aguinaldo", color: "green", icon: <TbChristmasTree /> },
      { name: "Provincias", path: "provincias", color: "green", icon: <FiMap /> },
      { name: "Cantones", path: "cantones", color: "teal", icon: <MdOutlineLocationCity /> },
      { name: "Distritos", path: "distritos", color: "cyan", icon: <FiMapPin /> },
      { name: "Direcciones", path: "direcciones", color: "blue", icon: <FiHome /> },
      { name: "Tipos de Marca", path: "tipos_marca", color: "yellow", icon: <FiClock /> },
      { name: "Marcas de Asistencia", path: "marcas_asistencia", color: "blue", icon: <FiActivity /> },
      { name: "Tipos de Incapacidad", path: "tipos_incapacidad", color: "purple", icon: <FiAlertCircle /> },
      { name: "Incapacidades", path: "incapacidades", color: "red", icon: <BiInjection /> },
      { name: "Jornadas Diarias", path: "jornadas_diarias", color: "teal", icon: <BsClipboardData /> },
      { name: "Tipos de Hora Extra", path: "tipos_hora_extra", color: "orange", icon: <FiClock /> },
      { name: "Solicitudes de Hora Extra", path: "solicitudes_hora_extra", color: "red", icon: <FiFileText /> },
      { name: "Tipos de Solicitud", path: "tipos_solicitud", color: "yellow", icon: <FiSettings /> },
      { name: "Permisos y Licencias", path: "solicitud_permisos_licencias", color: "cyan", icon: <FiClipboard /> },
      { name: "Saldos de Vacaciones", path: "saldo_vacaciones", color: "green", icon: <FiCalendar /> },
      { name: "Solicitudes de Vacaciones", path: "solicitudes_vacaciones", color: "teal", icon: <FiCalendar /> },
      { name: "Liquidaciones", path: "liquidaciones", color: "red", icon: <FiFileText /> },
      { name: "Causas de Liquidación", path: "causas_liquidacion", color: "orange", icon: <FiTag /> },
      { name: "Teléfonos", path: "telefonos", color: "pink", icon: <FiPhone /> },
    ];