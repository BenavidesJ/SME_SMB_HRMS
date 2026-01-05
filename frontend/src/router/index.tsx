import { createBrowserRouter } from "react-router";
import { PrivateRoute } from "./PrivateRoute";
import { PublicRoute } from "./PublicRoute";
import UIdocs from "../pages/Private/UIdocs";
import LoginPage from "../pages/Public/LoginPage";
import Main from "../pages/Private/Main";
import ForgotPasswordPage from "../pages/Public/ForgotPasswordPage";
import NotFoundPage from "../pages/Public/NotFoundPage";
import Perfil from "../pages/Private/Perfil";
import Mantenimientos from "../pages/Private/mantenimientos/Mantenimientos";
import GestionEmpleados from "../pages/Private/administracion/GestionEmpleados";
import ColaboradorDetalle from "../pages/Private/administracion/ColaboradorDetalle";

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
        path: "/mantenimientos",
        element: <Mantenimientos />,
      },
      {
        path: "/mantenimientos/colaboradores",
        element: <GestionEmpleados />,
      },
      {
        path: "/mantenimientos/colaboradores/:id",
        element: <ColaboradorDetalle />,
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
