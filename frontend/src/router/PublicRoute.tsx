import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export const PublicRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Cargando ...</div>;

  return isAuthenticated
    ? <Navigate to="/" replace />
    : <Outlet />;
};
