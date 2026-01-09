import * as React from "react";
import { Button, HStack, Text } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router";
import { FiArrowLeft } from "react-icons/fi";
import {
  BreadcrumbRoot,
  BreadcrumbLink,
  BreadcrumbCurrentLink,
} from "../../../components/ui/breadcrumb";

type RouteMeta = {
  label: string;
  to?: string;
};

const ROUTE_LABELS: Record<string, RouteMeta> = {
  "/": { label: "Inicio" },
  "/perfil": { label: "Perfil" },
  "/ui-docs": { label: "UI Docs" },

  "/mantenimientos-consultas": { label: "Mantenimientos" },
  "/mantenimientos-consultas/colaboradores": { label: "Colaboradores" },
  "/mantenimientos-consultas/generos": { label: "Géneros" },
  "/mantenimientos-consultas/ajustes_salariales": { label: "Ajustes salariales" },
  "/mantenimientos-consultas/ciclos_pago": { label: "Ciclos de pago" },

  // Ruta detalle real en tu router:
  "/mantenimientos/colaboradores": { label: "Colaboradores" },
};

function isNumericLike(v: string) {
  return /^[0-9]+$/.test(v);
}

function titleFromSegment(seg: string) {
  // fallback simple (si no existe en ROUTE_LABELS)
  const clean = decodeURIComponent(seg);
  const spaced = clean.replace(/[-_]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function AppBreadcrumb() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const crumbs = React.useMemo(() => {
    // Evita breadcrumb en login / public, opcional:
    if (pathname.startsWith("/login") || pathname.startsWith("/forgot-password")) return [];

    const parts = pathname.split("/").filter(Boolean);
    // Siempre incluir "Inicio"
    const items: Array<{ label: string; to?: string; isCurrent?: boolean }> = [
      { label: ROUTE_LABELS["/"]?.label ?? "Inicio", to: "/" },
    ];

    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      acc += `/${seg}`;

      const isLast = i === parts.length - 1;

      // Manejo específico: /mantenimientos/colaboradores/:id
      // Cuando seg es "mantenimientos" o "colaboradores" normal, lo resolvemos por acc.
      // Cuando seg es el :id (numérico o uuid), hacemos "Detalle" (o el ID abreviado).
      const meta = ROUTE_LABELS[acc];

      // Caso de detalle de colaborador: si estamos en /mantenimientos/colaboradores/<id>
      const isEmployeeDetail =
        parts[0] === "mantenimientos" &&
        parts[1] === "colaboradores" &&
        i === 2;

      if (isEmployeeDetail) {
        const id = seg;
        const shortId = isNumericLike(id) ? id : id.slice(0, 8);
        items.push({
          label: `Detalle (${shortId})`,
          isCurrent: true,
        });
        continue;
      }

      const label = meta?.label ?? titleFromSegment(seg);

      const to = meta?.to ?? acc;

      items.push({
        label,
        to: isLast ? undefined : to, 
        isCurrent: isLast,
      });
    }

    if (pathname === "/") {
      return [{ label: ROUTE_LABELS["/"]?.label ?? "Inicio", isCurrent: true }];
    }

    return items;
  }, [pathname]);

  const backTo = React.useMemo((): string => {
  for (let i = crumbs.length - 1; i >= 0; i--) {
    if (crumbs[i].to) return crumbs[i].to!;
  }
  return "/";
}, [crumbs]);

  if (crumbs.length === 0) return null;

  return (
    <HStack justify="space-between" align="center" w="full" mt="2" mb="4">
      <HStack>
        <Button
          aria-label="Volver"
          size="sm"
          variant="outline"
          onClick={() => navigate(backTo)}
        >
          <FiArrowLeft /> Volver
        </Button>

        <BreadcrumbRoot separator={<Text color="gray.500">/</Text>} separatorGap="2">
          {crumbs.map((c, idx) => {
            const key = `${c.label}-${idx}`;
            if (c.isCurrent) {
              return (
                <BreadcrumbCurrentLink key={key}>
                  {c.label}
                </BreadcrumbCurrentLink>
              );
            }
            return (
              <BreadcrumbLink key={key} href={c.to}>
                {c.label}
              </BreadcrumbLink>
            );
          })}
        </BreadcrumbRoot>
      </HStack>
    </HStack>
  );
}
