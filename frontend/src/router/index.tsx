import { createBrowserRouter } from "react-router";
import UIdocs from "../pages/UIdocs";
import LoginPage from "../pages/LoginPage";
import { PrivateRoute } from "./PrivateRoute";
import { PublicRoute } from "./PublicRoute";
import Main from "../pages/Main";

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
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
        path: "/ui-docs",
        element: <UIdocs />
      }
    ]
  }
]);
