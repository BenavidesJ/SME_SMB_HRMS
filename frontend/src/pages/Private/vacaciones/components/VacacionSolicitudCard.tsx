/* eslint-disable no-unused-vars */
import { Badge, Card, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import { Button } from "../../../../components/general/button/Button";
import { toTitleCase, formatDateUiDefault } from "../../../../utils";
import type { VacacionListItem } from "../types";

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

const getDurationLabel = (inicio: string, fin: string) => {
  const MS_IN_DAY = 86_400_000;
  const startDate = new Date(inicio);
  const endDate = new Date(fin);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Duración desconocida";
  }

  const diffDays = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / MS_IN_DAY));
  const totalDays = diffDays + 1;
  return `${totalDays} ${totalDays === 1 ? "día" : "días"}`;
};

const buildCollaboratorName = (item: VacacionListItem) => {
  const baseName = [item.colaborador?.nombre, item.colaborador?.primer_apellido, item.colaborador?.segundo_apellido]
    .filter(Boolean)
    .join(" ")
    .trim();

  return baseName ? toTitleCase(baseName) : `Colaborador ${item.id_colaborador}`;
};

const formatDisplayDate = (date: string) => {
  return formatDateUiDefault(date);
};

interface VacacionSolicitudCardProps {
  item: VacacionListItem;
  showCollaborator?: boolean;
  canManageActions?: boolean;
  isSubmitting?: boolean;
  onApprove?: (...args: [number]) => void;
  onDecline?: (...args: [number]) => void;
}

export function VacacionSolicitudCard({
  item,
  showCollaborator = false,
  canManageActions = false,
  isSubmitting = false,
  onApprove,
  onDecline,
}: VacacionSolicitudCardProps) {
  const estado = item.estadoSolicitudVacaciones?.estado ?? "DESCONOCIDO";

  if (isSubmitting) {
    return (
      <Card.Root>
        <Card.Body>
          <Stack gap="2">
            <Skeleton height="6" width="8rem" />
            {showCollaborator && <Skeleton height="5" width="14rem" maxW="100%" />}
            <Skeleton height="5" width="13rem" maxW="100%" />
            <Skeleton height="5" width="13rem" maxW="100%" />
            <HStack gap="2" wrap="wrap">
              <Skeleton height="5" width="4rem" />
              <Skeleton height="5" width="6rem" />
            </HStack>
            <Skeleton height="5" width="9rem" />
            {item.dias_solicitados && <Skeleton height="5" width="8rem" />}
            {item.dias_aprobados && <Skeleton height="5" width="8rem" />}
            {!!item.dias_skipped_detalle?.length && <Skeleton height="5" width="12rem" maxW="100%" />}
            {item.saldo_vacaciones && <Skeleton height="5" width="15rem" maxW="100%" />}
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
          <Text fontWeight="semibold">Vacaciones</Text>
          {showCollaborator && <Text color="fg.muted">Solicitante: {buildCollaboratorName(item)}</Text>}
          <Text color="fg.muted">Fecha Inicio: {formatDisplayDate(item.fecha_inicio)}</Text>
          <Text color="fg.muted">Fecha Fin: {formatDisplayDate(item.fecha_fin)}</Text>
          {showCollaborator && (
            <Text>
              Estado: <Badge {...estadoBadgeProps(estado)}>{toTitleCase(estado)}</Badge>
            </Text>
          )}
          <Text color="fg.muted">Duración: {getDurationLabel(item.fecha_inicio, item.fecha_fin)}</Text>
          {item.dias_solicitados && <Text color="fg.muted">Días solicitados: {item.dias_solicitados}</Text>}
          {item.dias_aprobados && <Text color="fg.muted">Días aprobados: {item.dias_aprobados}</Text>}
          {!!item.dias_skipped_detalle?.length && <Text color="fg.muted">Días omitidos: {item.dias_skipped_detalle.map((skip) => skip.date).join(", ")}</Text>}
          {item.saldo_vacaciones && (
            <Text color="fg.muted">
              Saldo al registrar: {item.saldo_vacaciones.dias_ganados - item.saldo_vacaciones.dias_tomados} días disponibles
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
              onClick={() => onApprove?.(item.id_solicitud_vacaciones)}
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
              onClick={() => onDecline?.(item.id_solicitud_vacaciones)}
            >
              Rechazar
            </Button>
          </Stack>
        </Card.Footer>
      )}
    </Card.Root>
  );
}