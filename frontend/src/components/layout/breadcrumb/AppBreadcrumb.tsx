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
type CrumbValue = string | { label: string; to?: string };
type CrumbHandle = {
  crumb?:
  | CrumbValue
  | CrumbValue[]
  // eslint-disable-next-line no-unused-vars
  | ((_ctx: { params: Record<string, string> }) => CrumbValue | CrumbValue[]);
};

function resolveCrumbValues({
  crumb,
  params,
  pathname,
}: {
  crumb?: CrumbHandle["crumb"];
  params: Record<string, string>;
  pathname: string;
}): Array<{ label: string; to?: string }> {
  if (!crumb) return [];

  const resolved = typeof crumb === "function" ? crumb({ params }) : crumb;
  const values = Array.isArray(resolved) ? resolved : [resolved];

  return values.reduce<Array<{ label: string; to?: string }>>((acc, value) => {
    if (typeof value === "string") {
      acc.push({ label: value, to: pathname });
      return acc;
    }

    if (!value?.label) return acc;
    acc.push({ label: value.label, to: value.to });
    return acc;
  }, []);
}

export function AppBreadcrumb() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const isRootPath = pathname === "/";

  const crumbs: Crumb[] = useMemo(() => {
    if (pathname.startsWith("/login") || pathname.startsWith("/forgot-password")) return [];

    const routeCrumbs = matches
      .flatMap((match) => {
        const handle = match.handle as CrumbHandle | undefined;
        return resolveCrumbValues({
          crumb: handle?.crumb,
          params: match.params as Record<string, string>,
          pathname: match.pathname,
        });
      })
      .filter((item) => item.label);

    const withHome = routeCrumbs.some((crumb) => crumb.to === "/")
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

  const previousCrumb = useMemo(() => {
    for (let index = crumbs.length - 2; index >= 0; index -= 1) {
      const candidate = crumbs[index];
      if (candidate.to && candidate.to !== pathname) {
        return candidate;
      }
    }
    return null;
  }, [crumbs, pathname]);

  const handleBack = () => {
    if (isRootPath) return;

    if (previousCrumb?.to) {
      navigate(previousCrumb.to);
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
            if (!c.to) {
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
