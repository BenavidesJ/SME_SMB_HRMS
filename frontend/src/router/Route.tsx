import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLoader } from "../components/layout/loading";

type RouteMode = "public" | "private" | "role";

interface RouteProps {
  mode: RouteMode;

  /**
   * Redirección antes o sin autenticación
   */
  unauthenticatedRedirectTo?: string;

  /**
   * Redirección despues de autenticación
   */
  authenticatedRedirectTo?: string;

  /**
   * Roles permitidos
   */
  allowedRoles?: string[];

  /**
   * Redirección si usuario está autenticado pero no tiene rol permitido
   */
  unauthorizedRedirectTo?: string;
}

export function Route({
  mode,
  unauthenticatedRedirectTo = "/login",
  authenticatedRedirectTo = "/",
  allowedRoles = [],
  unauthorizedRedirectTo = "/",
}: RouteProps) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <AppLoader />;

  if (mode === "public") {
    return isAuthenticated ? (
      <Navigate to={authenticatedRedirectTo} replace />
    ) : (
      <Outlet />
    );
  }

  if (mode === "private") {
    return isAuthenticated ? <Outlet /> : <Navigate to={unauthenticatedRedirectTo} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to={unauthenticatedRedirectTo} replace />;
  }

  const userRoles: string[] = Array.isArray(user?.usuario?.roles)
    ? user?.usuario?.roles
    : user?.usuario?.roles
      ? [user?.usuario?.roles]
      : [];

  const hasAccess =
    allowedRoles.length === 0
      ? true
      : allowedRoles.some((r) => userRoles.includes(r));

  return hasAccess ? <Outlet /> : <Navigate to={unauthorizedRedirectTo} replace />;
}
