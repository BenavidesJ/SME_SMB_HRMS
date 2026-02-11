import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLoader } from "../components/layout/loading";
import { getAllowedRolesForPath } from "../auth/accessControl";

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
   * Redirección si usuario está autenticado pero no tiene rol permitido
   */
  unauthorizedRedirectTo?: string;
}

export function Route({
  mode,
  unauthenticatedRedirectTo = "/login",
  authenticatedRedirectTo = "/",
  unauthorizedRedirectTo = "/",
}: RouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <AppLoader />;

  if (mode === "public") {
    return isAuthenticated ? (
      <Navigate to={authenticatedRedirectTo} replace />
    ) : (
      <Outlet />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={unauthenticatedRedirectTo} replace />;
  }

  const autoRoles = getAllowedRolesForPath(location.pathname) ?? [];
  if (autoRoles.length === 0) return <Outlet />;

  const roleName =
    user?.usuario?.rol ??
    (typeof user?.usuario?.rol === "string" ? user?.usuario?.rol : undefined);

  const userRoles: string[] = roleName ? [roleName] : [];
  const hasAccess = autoRoles.some((r) => userRoles.includes(r));

  return hasAccess ? <Outlet /> : <Navigate to={unauthorizedRedirectTo} replace />;
}
