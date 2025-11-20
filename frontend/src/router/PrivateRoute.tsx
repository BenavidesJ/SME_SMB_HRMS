import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Cargando ...</div>

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
