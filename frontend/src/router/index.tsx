import { createBrowserRouter } from "react-router";
import { Route } from "./Route";

import UIdocs from "../pages/Private/UIdocs";
import LoginPage from "../pages/Public/LoginPage";
import Main from "../pages/Private/Main";
import ForgotPasswordPage from "../pages/Public/ForgotPasswordPage";
import NotFoundPage from "../pages/Public/NotFoundPage";
import Perfil from "../pages/Private/administracion/Perfil";
import Mantenimientos from "../pages/Private/mantenimientos/Mantenimientos";
import GestionEmpleados from "../pages/Private/mantenimientos/colaboradores/GestionEmpleados";
import ColaboradorDetalle from "../pages/Private/mantenimientos/colaboradores/ColaboradorDetalle";
import Generos from "../pages/Private/mantenimientos/generos/Generos";
import CiclosPago from "../pages/Private/mantenimientos/ciclosPago/CiclosPago";
import TiposContrato from "../pages/Private/mantenimientos/tiposContrato/TiposContrato";
import { MarcasAsistencia } from "../pages/Private/asistencias/MarcasAsistencia";
import { GestionarAsistencias } from "../pages/Private/asistencias/GestionarAsistencias";
import { MarcasAsistenciaColaborador } from "../pages/Private/asistencias/MarcasAsistenciaColaborador";
import { Estados } from "../pages/Private/mantenimientos/estados/Estados";
import { EstadosCiviles } from "../pages/Private/mantenimientos/estadosCiviles/EstadosCiviles";
import { RolesPage } from "../pages/Private/mantenimientos/roles/Roles";
import { Departamentos } from "../pages/Private/mantenimientos/departamentos/Departamentos";
import { GestionSolicitudes } from "../pages/Private/horasExtra/GestionSolicitudes";
import { SolicitudHorasExtra } from "../pages/Private/horasExtra/SolicitudHorasExtra";
import Puestos from "../pages/Private/mantenimientos/puestos/Puestos";
import { RegistroIncapacidades } from "../pages/Private/incapacidades/RegistroIncapacidades";

export const router = createBrowserRouter([
  {
    element: (
      <Route
        mode="public"
        authenticatedRedirectTo="/"
      />
    ),
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: (
      <Route
        mode="private"
        unauthenticatedRedirectTo="/login"
      />
    ),
    children: [
      { path: "/", element: <Main /> },
      { path: "/perfil", element: <Perfil /> },

      { path: "/asistencia/marca", element: <MarcasAsistencia /> },
      { path: "/asistencia/gestion", element: <GestionarAsistencias /> },
      { path: "/asistencia/gestion/colaborador/:id", element: <MarcasAsistenciaColaborador /> },

      { path: "/horas-extra/solicitud", element: <SolicitudHorasExtra /> },
      { path: "/horas-extra/gestion", element: <GestionSolicitudes /> },

      { path: "/incapacidades", element: <RegistroIncapacidades /> },

      { path: "/mantenimientos-consultas", element: <Mantenimientos /> },
      { path: "/mantenimientos-consultas/colaboradores", element: <GestionEmpleados /> },
      { path: "/mantenimientos-consultas/colaboradores/:id", element: <ColaboradorDetalle /> },
      { path: "/mantenimientos-consultas/generos", element: <Generos /> },
      { path: "/mantenimientos-consultas/estados", element: <Estados /> },
      { path: "/mantenimientos-consultas/puestos", element: <Puestos /> },
      { path: "/mantenimientos-consultas/estados_civiles", element: <EstadosCiviles /> },
      { path: "/mantenimientos-consultas/departamentos", element: <Departamentos /> },
      { path: "/mantenimientos-consultas/roles", element: <RolesPage /> },
      { path: "/mantenimientos-consultas/tipos_contrato", element: <TiposContrato /> },
      { path: "/mantenimientos-consultas/ciclos_pago", element: <CiclosPago /> },

      { path: "/ui-docs", element: <UIdocs /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
