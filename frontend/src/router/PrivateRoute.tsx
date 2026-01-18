import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLoader } from "../layouts/components";

export function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AppLoader />

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
