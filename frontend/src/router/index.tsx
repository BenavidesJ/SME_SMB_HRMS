import { createBrowserRouter } from "react-router";
import { PrivateRoute } from "./PrivateRoute";
import { PublicRoute } from "./PublicRoute";
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
import AjustesSalariales from "../pages/Private/mantenimientos/ajustesSalariales/AjustesSalariales";
import CiclosPago from "../pages/Private/mantenimientos/ciclosPago/CiclosPago";

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
    ]
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: "/",
        element: <Main />
      },
      {
        path: "/perfil",
        element: <Perfil />
      },
      {
        path: "/mantenimientos-consultas",
        element: <Mantenimientos />,
      },
      {
        path: "/mantenimientos-consultas/colaboradores",
        element: <GestionEmpleados />,
      },
      {
        path: "/mantenimientos/colaboradores/:id",
        element: <ColaboradorDetalle />,
      },
      {
        path: "/mantenimientos-consultas/generos",
        element: <Generos />,
      },
      {
        path: "/mantenimientos-consultas/ajustes_salariales",
        element: <AjustesSalariales />,
      },
      {
        path: "/mantenimientos-consultas/ciclos_pago",
        element: <CiclosPago />,
      },
      {
        path: "/ui-docs",
        element: <UIdocs />
      }
    ]
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);
