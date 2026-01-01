import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLoader } from "../layouts/components";

export const PublicRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AppLoader />;

  return isAuthenticated
    ? <Navigate to="/" replace />
    : <Outlet />;
};
