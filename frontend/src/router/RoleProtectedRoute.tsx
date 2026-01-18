import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

interface RoleProtectedRouteProps {
  allowedRoles: string[];
}

export const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  const userRoles = user?.usuario.roles || [];
  const hasAccess = allowedRoles.some(role => userRoles.includes(role));

  return hasAccess ? <Outlet /> : <Navigate to="/" replace />;
};