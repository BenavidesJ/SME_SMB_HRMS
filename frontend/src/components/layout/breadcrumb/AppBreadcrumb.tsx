import { Button, HStack, Text } from "@chakra-ui/react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router";
import { FiArrowLeft } from "react-icons/fi";
import {
  BreadcrumbRoot,
  BreadcrumbLink,
  BreadcrumbCurrentLink,
} from "../../../components/ui/breadcrumb";
import { NAV_MAIN, NAV_SETTINGS } from "../navigation/navItems";
import { useAuth } from "../../../context/AuthContext";

import { buildNavIndex } from "./helpers/buildNavIndex";
import { resolveBreadcrumb, type Crumb } from "./helpers/breadCrumbResolve";
import { useMemo } from "react";

const PARENTS_THAT_REDIRECT: Record<string, string> = {
  "/asistencia": "/asistencia/marca",
  "/horas-extra": "/horas-extra/solicitud",
  "/vacaciones": "/vacaciones/solicitud",
  "/permisos": "/permisos/solicitud",
};

export function AppBreadcrumb() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roles = useMemo(() => {
    if (!user) return [];
    const { usuario } = user;
    return usuario?.rol ? [usuario.rol] : []
  }, [user])

  const index = useMemo(() => {

    return buildNavIndex([...NAV_MAIN, ...NAV_SETTINGS], roles);
  }, [roles]);

  const crumbs: Crumb[] = useMemo(() => {
    if (pathname.startsWith("/login") || pathname.startsWith("/forgot-password")) return [];
    return resolveBreadcrumb(pathname, index);
  }, [pathname, index]);

  const backTo = useMemo(() => {
    const current = pathname;

    for (let i = crumbs.length - 2; i >= 0; i--) {
      const candidate = crumbs[i].to;
      if (!candidate) continue;

      const redirectsTo = PARENTS_THAT_REDIRECT[candidate];
      if (redirectsTo && redirectsTo === current) continue;

      return candidate;
    }
    return "/";
  }, [crumbs, pathname]);

  if (crumbs.length === 0) return null;

  return (
    <HStack justify="space-between" align="center" w="full" mt="2" mb="4">
      <HStack>
        <Button aria-label="Volver" size="sm" variant="outline" onClick={() => navigate(backTo)}>
          <FiArrowLeft />
          <Text as="span" ml="2">
            Volver
          </Text>
        </Button>

        <BreadcrumbRoot separator={<Text color="gray.500">/</Text>} separatorGap="2">
          {crumbs.map((c, idx) => {
            const key = `${c.label}-${idx}`;
            if (c.isCurrent) {
              return <BreadcrumbCurrentLink key={key}>{c.label}</BreadcrumbCurrentLink>;
            }
            return (
              <BreadcrumbLink key={key} asChild>
                <RouterLink to={c.to!}>
                  {c.label}
                </RouterLink>
              </BreadcrumbLink>
            );
          })}
        </BreadcrumbRoot>
      </HStack>
    </HStack>
  );
}
