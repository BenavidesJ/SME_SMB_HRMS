import { Button, HStack, Text } from "@chakra-ui/react";
import { useLocation, useNavigate, useMatches, Link as RouterLink } from "react-router";
import { FiArrowLeft } from "react-icons/fi";
import {
  BreadcrumbRoot,
  BreadcrumbLink,
  BreadcrumbCurrentLink,
} from "../../../components/ui/breadcrumb";
import { useMemo } from "react";

type Crumb = { label: string; to?: string; isCurrent?: boolean };
type CrumbHandle = {
  crumb?: string | ((ctx: { params: Record<string, string> }) => string);
};

export function AppBreadcrumb() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const isRootPath = pathname === "/";

  const crumbs: Crumb[] = useMemo(() => {
    if (pathname.startsWith("/login") || pathname.startsWith("/forgot-password")) return [];

    const routeCrumbs = matches
      .map((match) => {
        const handle = match.handle as CrumbHandle | undefined;
        const crumb = handle?.crumb;
        if (!crumb) return null;

        const label =
          typeof crumb === "function"
            ? crumb({ params: match.params as Record<string, string> })
            : crumb;

        if (!label) return null;
        return { label, to: match.pathname };
      })
      .filter((item): item is { label: string; to: string } => !!item);

    const withHome = routeCrumbs.some((c) => c.to === "/")
      ? routeCrumbs
      : [{ label: "Inicio", to: "/" }, ...routeCrumbs];

    const normalized = withHome.filter((crumb, index, arr) => {
      if (index === 0) return true;
      const prev = arr[index - 1];
      return !(prev.label === crumb.label && prev.to === crumb.to);
    });

    return normalized.map((crumb, index) => {
      const isCurrent = index === normalized.length - 1;
      return {
        label: crumb.label,
        to: isCurrent ? undefined : crumb.to,
        isCurrent,
      };
    });
  }, [pathname, matches]);

  const isDetailRoute = useMemo(() => {
    const currentMatch = matches[matches.length - 1];
    if (!currentMatch) return false;
    return Object.keys(currentMatch.params ?? {}).length > 0;
  }, [matches]);

  const logicalParent = useMemo(() => {
    for (let i = crumbs.length - 2; i >= 0; i--) {
      const candidate = crumbs[i].to;
      if (candidate) return candidate;
    }
    return "/";
  }, [crumbs]);

  const handleBack = () => {
    if (isRootPath) return;

    if (isDetailRoute) {
      navigate(logicalParent);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  if (crumbs.length === 0) return null;

  return (
    <HStack justify="space-between" align="center" w="full" mt="2" mb="4">
      <HStack>
        <Button aria-label="Volver" size="sm" variant="outline" onClick={handleBack} disabled={isRootPath}>
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
