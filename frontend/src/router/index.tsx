import { createBrowserRouter, Navigate } from "react-router";
import { Route as GuardRoute } from "./Route";

import LoginPage from "../pages/Public/LoginPage";
import ForgotPasswordPage from "../pages/Public/ForgotPasswordPage";
import Main from "../pages/Private/Main";
import Perfil from "../pages/Private/administracion/Perfil";
import { MarcasAsistencia } from "../pages/Private/asistencias/MarcasAsistencia";
import { GestionarAsistencias } from "../pages/Private/asistencias/GestionarAsistencias";
import { MarcasAsistenciaColaborador } from "../pages/Private/asistencias/MarcasAsistenciaColaborador";
import { SolicitudHorasExtra } from "../pages/Private/horasExtra/SolicitudHorasExtra";
import { GestionSolicitudes } from "../pages/Private/horasExtra/GestionSolicitudes";
import { RegistroIncapacidades } from "../pages/Private/incapacidades/RegistroIncapacidades";
import DetalleIncapacidad from "../pages/Private/incapacidades/DetalleIncapacidad";
import Mantenimientos from "../pages/Private/mantenimientos/Mantenimientos";
import GestionEmpleados from "../pages/Private/mantenimientos/colaboradores/page/GestionEmpleados";
import ColaboradorDetalle from "../pages/Private/mantenimientos/colaboradores/page/ColaboradorDetalle";
import { Estados } from "../pages/Private/mantenimientos/estados/Estados";
import Puestos from "../pages/Private/mantenimientos/puestos/Puestos";
import { EstadosCiviles } from "../pages/Private/mantenimientos/estadosCiviles/EstadosCiviles";
import { Departamentos } from "../pages/Private/mantenimientos/departamentos/Departamentos";
import TiposContrato from "../pages/Private/mantenimientos/tiposContrato/TiposContrato";
import CiclosPago from "../pages/Private/mantenimientos/ciclosPago/CiclosPago";
import Provincias from "../pages/Private/mantenimientos/provincias/Provincias";
import Cantones from "../pages/Private/mantenimientos/cantones/Cantones";
import Distritos from "../pages/Private/mantenimientos/distritos/Distritos";
import Deducciones from "../pages/Private/mantenimientos/deducciones/Deducciones";
import Feriados from "../pages/Private/mantenimientos/feriados/Feriados";
import TiposHoraExtra from "../pages/Private/mantenimientos/tiposHoraExtra/TiposHoraExtra";
import CausasLiquidacion from "../pages/Private/mantenimientos/causasLiquidacion/CausasLiquidacion";
import TiposIncapacidad from "../pages/Private/mantenimientos/tiposIncapacidad/TiposIncapacidad";
import TiposMarca from "../pages/Private/mantenimientos/tiposMarca/TiposMarca";
import { RolesPage } from "../pages/Private/mantenimientos/roles/Roles";
import NotFoundPage from "../pages/Public/NotFoundPage";
import { SolicitudVacaciones } from "../pages/Private/vacaciones/SolicitudVacaciones";
import { GestionVacaciones } from "../pages/Private/vacaciones/GestionVacaciones";
import { SolicitudPermisos } from "../pages/Private/permisos/SolicitudPermisos";
import { GestionPermisos } from "../pages/Private/permisos/GestionPermisos";
import { Planillas } from "../pages/Private/planillas/Planillas";
import { DetallePlanilla } from "../pages/Private/planillas/DetallePlanilla";
import { TiposJornada } from "../pages/Private/mantenimientos/tiposJornada/TiposJornada";
import { GeneracionEvaluaciones } from "../pages/Private/evaluacion/GeneracionEvaluaciones";
import { Aguinaldos } from "../pages/Private/aguinaldos/Aguinaldos";

// helpers (opcionales)
const shortId = (v?: string) => (v ? v.slice(0, 8) : "");

export const router = createBrowserRouter([
  {
    element: <GuardRoute mode="public" authenticatedRedirectTo="/" />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
        handle: { crumb: "Iniciar sesión" },
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
        handle: { crumb: "Recuperar contraseña" },
      },
    ],
  },

  {
    element: <GuardRoute mode="private" unauthenticatedRedirectTo="/login" />,
    children: [
      {
        path: "/",
        element: <Main />,
        handle: { crumb: "Inicio" },
      },
      {
        path: "/perfil",
        element: <Perfil />,
        handle: { crumb: "Perfil" },
      },

      {
        path: "/asistencia",
        handle: { crumb: "Asistencia" },
        children: [
          { index: true, element: <Navigate to="/asistencia/marca" replace /> },

          {
            path: "marca",
            element: <MarcasAsistencia />,
            handle: { crumb: "Marcar asistencia" },
          },
          {
            path: "gestion",
            element: <GestionarAsistencias />,
            handle: { crumb: "Gestionar asistencias" },
          },
          {
            path: "gestion/colaborador/:id",
            element: <MarcasAsistenciaColaborador />,
            handle: {
              crumb: ({ params }: { params: Record<string, string> }) => `Colaborador (${shortId(params.id)})`,
            },
          },
        ],
      },

      {
        path: "/horas-extra",
        handle: { crumb: "Horas extra" },
        children: [
          { index: true, element: <Navigate to="/horas-extra/solicitud" replace /> },

          {
            path: "solicitud",
            element: <SolicitudHorasExtra />,
            handle: { crumb: "Solicitud" },
          },
          {
            path: "gestion",
            element: <GestionSolicitudes />,
            handle: { crumb: "Gestión Solicitudes" },
          },
        ],
      },

      {
        path: "/vacaciones",
        handle: { crumb: "Vacaciones" },
        children: [
          { index: true, element: <Navigate to="/vacaciones/solicitud" replace /> },

          {
            path: "solicitud",
            element: <SolicitudVacaciones />,
            handle: { crumb: "Solicitud" },
          },
          {
            path: "gestion",
            element: <GestionVacaciones />,
            handle: { crumb: "Gestión Vacaciones" },
          },
        ],
      },

      {
        path: "/permisos",
        handle: { crumb: "Permisos" },
        children: [
          { index: true, element: <Navigate to="/permisos/solicitud" replace /> },

          {
            path: "solicitud",
            element: <SolicitudPermisos />,
            handle: { crumb: "Solicitud" },
          },
          {
            path: "gestion",
            element: <GestionPermisos />,
            handle: { crumb: "Gestión Permisos" },
          },
        ],
      },

      {
        path: "/incapacidades",
        element: <RegistroIncapacidades />,
        handle: { crumb: "Incapacidades" },
      },
      {
        path: "/incapacidades/:grupo",
        element: <DetalleIncapacidad />,
        handle: {
          crumb: ({ params }: { params: Record<string, string> }) =>
            `Detalle (${shortId(params.grupo)})`,
        },
      },

      {
        path: "/planillas",
        element: <Planillas />,
        handle: { crumb: "Generación y gestión de planillas" },
      },
      {
        path: "/planillas/periodo_planilla/:id",
        element: <DetallePlanilla />,
        handle: {
          crumb: ({ params }: { params: Record<string, string> }) =>
            `Periodo (${shortId(params.id)})`,
        },
      },

      {
        path: "/evaluacion",
        element: <GeneracionEvaluaciones />,
        handle: { crumb: "Evaluaciones de Desempeño" },
      },

      {
        path: "/aguinaldos",
        element: <Aguinaldos />,
        handle: { crumb: "Aguinaldos" },
      },

      {
        path: "/mantenimientos-consultas",
        element: <Mantenimientos />,
        handle: { crumb: "Mantenimientos y consultas" },
      },
      {
        path: "/mantenimientos-consultas/colaboradores",
        element: <GestionEmpleados />,
        handle: { crumb: "Colaboradores" },
      },
      {
        path: "/mantenimientos-consultas/colaboradores/:id",
        element: <ColaboradorDetalle />,
        handle: {
          crumb: ({ params }: { params: Record<string, string> }) => `Colaborador (${shortId(params.id)})`,
        },
      },
      {
        path: "/mantenimientos-consultas/estados",
        element: <Estados />,
        handle: { crumb: "Estados" },
      },
      {
        path: "/mantenimientos-consultas/puestos",
        element: <Puestos />,
        handle: { crumb: "Puestos" },
      },
      {
        path: "/mantenimientos-consultas/estados_civiles",
        element: <EstadosCiviles />,
        handle: { crumb: "Estados civiles" },
      },
      {
        path: "/mantenimientos-consultas/departamentos",
        element: <Departamentos />,
        handle: { crumb: "Departamentos" },
      },
      {
        path: "/mantenimientos-consultas/roles",
        element: <RolesPage />,
        handle: { crumb: "Roles" },
      },
      {
        path: "/mantenimientos-consultas/tipos_contrato",
        element: <TiposContrato />,
        handle: { crumb: "Tipos de contrato" },
      },
      {
        path: "/mantenimientos-consultas/ciclos_pago",
        element: <CiclosPago />,
        handle: { crumb: "Ciclos de pago" },
      },
      {
        path: "/mantenimientos-consultas/deducciones_planilla",
        element: <Deducciones />,
        handle: { crumb: "Deducciones de planilla" },
      },
      {
        path: "/mantenimientos-consultas/provincias",
        element: <Provincias />,
        handle: { crumb: "Provincias" },
      },
      {
        path: "/mantenimientos-consultas/cantones",
        element: <Cantones />,
        handle: { crumb: "Cantones" },
      },
      {
        path: "/mantenimientos-consultas/distritos",
        element: <Distritos />,
        handle: { crumb: "Distritos" },
      },
      {
        path: "/mantenimientos-consultas/feriados",
        element: <Feriados />,
        handle: { crumb: "Feriados" },
      },
      {
        path: "/mantenimientos-consultas/tipos_jornada",
        element: <TiposJornada />,
        handle: { crumb: "Tipos de Jornada" },
      },
      {
        path: "/mantenimientos-consultas/tipos_hora_extra",
        element: <TiposHoraExtra />,
        handle: { crumb: "Tipos de hora extra" },
      },
      {
        path: "/mantenimientos-consultas/tipos_incapacidad",
        element: <TiposIncapacidad />,
        handle: { crumb: "Tipos de incapacidad" },
      },
      {
        path: "/mantenimientos-consultas/tipos_marca",
        element: <TiposMarca />,
        handle: { crumb: "Tipos de marca" },
      },
      {
        path: "/mantenimientos-consultas/causas_liquidacion",
        element: <CausasLiquidacion />,
        handle: { crumb: "Causas de liquidación" },
      },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);
