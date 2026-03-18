import dayjs from "dayjs";
import "dayjs/locale/es";
/* eslint-disable no-unused-vars */
import { Badge, Card, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import { Button } from "../../../../components/general/button/Button";
import { toTitleCase } from "../../../../utils";
import type { PermisoListItem, PermisoTipo } from "../types";

dayjs.locale("es");

const PERMISO_TIPOS: Array<{ code: PermisoTipo; label: string }> = [
  { code: "GOCE", label: "Permiso con goce salarial" },
  { code: "SIN_GOCE", label: "Permiso sin goce salarial" },
];

const estadoBadgeProps = (estado?: string) => {
  switch (estado?.toUpperCase()) {
    case "PENDIENTE":
      return { colorPalette: "yellow", variant: "subtle" as const };
    case "APROBADO":
      return { colorPalette: "blue", variant: "subtle" as const };
    case "CANCELADO":
      return { colorPalette: "gray", variant: "subtle" as const };
    case "RECHAZADO":
      return { colorPalette: "red", variant: "subtle" as const };
    default:
      return { colorPalette: "gray", variant: "subtle" as const };
  }
};

const buildCollaboratorName = (item: PermisoListItem) => {
  const baseName = [item.colaborador?.nombre, item.colaborador?.primer_apellido, item.colaborador?.segundo_apellido]
    .filter(Boolean)
    .join(" ")
    .trim();

  return baseName ? toTitleCase(baseName) : `Colaborador ${item.id_colaborador}`;
};

const formatDisplayDate = (date: string) => {
  const parsed = dayjs(date);
  if (!parsed.isValid()) return date;

  const formatted = parsed.locale("es").format("dddd D [de] MMMM, YYYY");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

interface PermisoSolicitudCardProps {
  item: PermisoListItem;
  showCollaborator?: boolean;
  canManageActions?: boolean;
  isSubmitting?: boolean;
  onApprove?: (id: number) => void;
  onDecline?: (id: number) => void;
}

export function PermisoSolicitudCard({
  item,
  showCollaborator = false,
  canManageActions = false,
  isSubmitting = false,
  onApprove,
  onDecline,
}: PermisoSolicitudCardProps) {
  const estado = item.estadoSolicitudPermisos?.estado ?? item.estado_solicitud ?? "DESCONOCIDO";
  const tipoFromCatalog = PERMISO_TIPOS.find(
    (tipo) => tipo.code === String(item.tipo_permiso ?? "").toUpperCase(),
  )?.label;
  const rawTipoLabel = item.tiposSolicitud?.tipo_solicitud ?? tipoFromCatalog ?? (item.tipo_permiso ?? "Tipo de permiso");
  const normalizedTipoLabel = toTitleCase(rawTipoLabel);
  const tipoLabel = normalizedTipoLabel.toLowerCase().startsWith("permiso")
    ? normalizedTipoLabel
    : `Permiso ${normalizedTipoLabel.charAt(0).toLowerCase()}${normalizedTipoLabel.slice(1)}`;

  if (isSubmitting) {
    return (
      <Card.Root>
        <Card.Body>
          <Stack gap="2">
            <Skeleton height="6" width="12rem" maxW="100%" />
            <Skeleton height="5" width="14rem" maxW="100%" />
            <Skeleton height="5" width="13rem" maxW="100%" />
            <Skeleton height="5" width="13rem" maxW="100%" />
            <HStack gap="2" wrap="wrap">
              <Skeleton height="5" width="4rem" />
              <Skeleton height="5" width="6rem" />
            </HStack>
            {item.observaciones && <Skeleton height="5" width="15rem" maxW="100%" />}
          </Stack>
        </Card.Body>

        {canManageActions && estado.toUpperCase() === "PENDIENTE" && (
          <Card.Footer pt="0">
            <Stack direction={{ base: "column", sm: "row" }} gap="2" w="full">
              <Skeleton height="9" flex="1" />
              <Skeleton height="9" flex="1" />
            </Stack>
          </Card.Footer>
        )}
      </Card.Root>
    );
  }

  return (
    <Card.Root>
      <Card.Body>
        <Stack gap="2">
          <Text fontWeight="semibold">{tipoLabel}</Text>
          <Text color="fg.muted">Solicitante: {buildCollaboratorName(item)}</Text>
          <Text color="fg.muted">Fecha Inicio: {formatDisplayDate(item.fecha_inicio)}</Text>
          <Text color="fg.muted">Fecha Fin: {formatDisplayDate(item.fecha_fin)}</Text>
          {showCollaborator && (
            <Text>
              Estado: <Badge {...estadoBadgeProps(estado)}>{toTitleCase(estado)}</Badge>
            </Text>
          )}
          {item.observaciones && <Text color="fg.muted">Observaciones: {item.observaciones}</Text>}
        </Stack>
      </Card.Body>

      {canManageActions && estado.toUpperCase() === "PENDIENTE" && (
        <Card.Footer pt="0">
          <Stack direction={{ base: "column", sm: "row" }} gap="2" w="full">
            <Button
              type="button"
              appearance="primary"
              size="sm"
              loading={isSubmitting}
              loadingText="Actualizando"
              disabled={isSubmitting}
              onClick={() => onApprove?.(item.id_solicitud)}
            >
              Aprobar
            </Button>
            <Button
              type="button"
              appearance="danger"
              size="sm"
              loading={isSubmitting}
              loadingText="Actualizando"
              disabled={isSubmitting}
              onClick={() => onDecline?.(item.id_solicitud)}
            >
              Rechazar
            </Button>
          </Stack>
        </Card.Footer>
      )}
    </Card.Root>
  );
}