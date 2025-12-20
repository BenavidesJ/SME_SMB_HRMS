import { createBrowserRouter } from "react-router";
import { PrivateRoute } from "./PrivateRoute";
import { PublicRoute } from "./PublicRoute";
import UIdocs from "../pages/Private/UIdocs";
import LoginPage from "../pages/Public/LoginPage";
import Main from "../pages/Private/Main";
import ForgotPasswordPage from "../pages/Public/ForgotPasswordPage";
import NotFoundPage from "../pages/Public/NotFoundPage";
import Perfil from "../pages/Private/Perfil";

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
