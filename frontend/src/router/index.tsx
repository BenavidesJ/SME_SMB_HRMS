import { createBrowserRouter } from "react-router";
import App from "../App";
import UIdocs from "../pages/UIdocs";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/ui-docs",
    element: <UIdocs />,
  },
]);
