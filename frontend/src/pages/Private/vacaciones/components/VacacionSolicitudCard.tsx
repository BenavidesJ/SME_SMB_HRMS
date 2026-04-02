/* eslint-disable no-unused-vars */
import { Badge, Card, Grid, GridItem, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import { Button } from "../../../../components/general/button/Button";
import { RequestActionButtons } from "../../../../components/general/requests/RequestActionButtons";
import { toTitleCase, formatDateUiCompact } from "../../../../utils";
import { LuEye } from "react-icons/lu";
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

interface VacacionSolicitudCardProps {
  item: VacacionListItem;
  showCollaborator?: boolean;
  canManageActions?: boolean;
  isSubmitting?: boolean;
  onApprove?: (...args: [number]) => void;
  onDecline?: (...args: [number]) => void;
  onViewDetail?: (item: VacacionListItem) => void;
}

export function VacacionSolicitudCard({
  item,
  showCollaborator = false,
  canManageActions = false,
  isSubmitting = false,
  onApprove,
  onDecline,
  onViewDetail,
}: VacacionSolicitudCardProps) {
  const estado = item.estadoSolicitudVacaciones?.estado ?? "DESCONOCIDO";
  const requestedDays = item.dias_solicitados ?? getDurationLabel(item.fecha_inicio, item.fecha_fin);

  if (isSubmitting) {
    return (
      <Card.Root py={3} px={4} h="full">
        <Card.Body pb={2} pt={0} px={0}>
          <Grid templateColumns={{ base: "1fr" }} gap={{ base: 4, md: 3 }} alignItems="start">
            <GridItem>
              <Stack gap={2}>
                <HStack justify="space-between" align="start" gap="3" wrap="wrap">
                  <Stack gap="1" minW="0">
                    <Skeleton height="4" width="7rem" />
                    <Skeleton height="5" width="12rem" maxW="100%" />
                    <Skeleton height="4" width="12rem" maxW="100%" />
                  </Stack>
                  <Stack align="flex-end" gap="1">
                    <Skeleton height="4" width="7rem" />
                    <Skeleton height="6" width="4rem" />
                  </Stack>
                </HStack>

                <Grid templateColumns={{ base: "1fr", sm: "repeat(3, minmax(0, 1fr))" }} gap="3">
                  <GridItem>
                    <Stack gap="1">
                      <Skeleton height="4" width="2.5rem" />
                      <Skeleton height="5" width="5rem" />
                    </Stack>
                  </GridItem>
                  <GridItem>
                    <Stack gap="1">
                      <Skeleton height="4" width="5rem" />
                      <Skeleton height="5" width="6rem" />
                    </Stack>
                  </GridItem>
                  <GridItem>
                    <Stack gap="1">
                      <Skeleton height="4" width="4rem" />
                      <Skeleton height="5" width="6rem" />
                    </Stack>
                  </GridItem>
                </Grid>
              </Stack>
            </GridItem>
          </Grid>
        </Card.Body>

        {(onViewDetail || (canManageActions && estado.toUpperCase() === "PENDIENTE")) && (
          <Card.Footer pt={3} px={0}>
            <Stack w="full" gap="2">
              {onViewDetail && (
                <HStack w="full" justify="end">
                  <Skeleton height="9" width={{ base: "full", sm: "8rem" }} />
                </HStack>
              )}

              {canManageActions && estado.toUpperCase() === "PENDIENTE" && (
                <HStack w="full" justify="end" gap="2">
                  <Skeleton height="9" width={{ base: "full", sm: "6.5rem" }} />
                  <Skeleton height="9" width={{ base: "full", sm: "6.5rem" }} />
                </HStack>
              )}
            </Stack>
          </Card.Footer>
        )}
      </Card.Root>
    );
  }

  return (
    <Card.Root py={3} px={4} h="full">
      <Card.Body pb={2} pt={0} px={0}>
        <Stack gap="4">
          <HStack justify="space-between" align="start" gap="3" wrap="wrap">
            <Stack gap="0.5" minW="0">
              <Text textStyle="xs" color="fg.muted">
                {formatDateUiCompact(item.fecha_inicio)}
              </Text>
              <Text fontWeight="bold" textStyle="md" lineClamp={1}>
                {showCollaborator ? buildCollaboratorName(item) : "Solicitud de vacaciones"}
              </Text>
              {showCollaborator && (
                <Text textStyle="xs" color="fg.muted" lineClamp={1}>
                  {item.colaborador?.correo_electronico ?? "Sin correo registrado"}
                </Text>
              )}
            </Stack>

            <Stack align="flex-end" gap="0.5" minW="fit-content">
              <Text color="fg.muted" textStyle="xs">
                Días solicitados
              </Text>
              <Text fontWeight="bold" textStyle="lg">
                {requestedDays}
              </Text>
            </Stack>
          </HStack>

          <Grid templateColumns={{ base: "1fr", sm: "repeat(3, minmax(0, 1fr))" }} gap="3">
            <GridItem>
              <Stack gap="0.5">
                <Text color="fg.muted" textStyle="xs">ID</Text>
                <Text fontWeight="semibold" textStyle="sm">{item.id_solicitud_vacaciones}</Text>
              </Stack>
            </GridItem>

            <GridItem>
              <Stack gap="0.5">
                <Text color="fg.muted" textStyle="xs">Fecha fin</Text>
                <Text fontWeight="semibold" textStyle="sm">{formatDateUiCompact(item.fecha_fin)}</Text>
              </Stack>
            </GridItem>

            <GridItem>
              <Stack gap="0.5">
                <Text color="fg.muted" textStyle="xs">Estado</Text>
                <HStack gap="2" wrap="wrap">
                  <Badge {...estadoBadgeProps(estado)}>{toTitleCase(estado)}</Badge>
                </HStack>
                <Text textStyle="xs" color="fg.muted" lineClamp={1}>
                  {getDurationLabel(item.fecha_inicio, item.fecha_fin)}
                </Text>
              </Stack>
            </GridItem>
          </Grid>

          {item.observaciones && (
            <Text textStyle="xs" color="fg.muted" lineClamp={1}>
              {item.observaciones}
            </Text>
          )}
        </Stack>
      </Card.Body>

      {(onViewDetail || (canManageActions && estado.toUpperCase() === "PENDIENTE")) && (
        <Card.Footer pt={3} px={0}>
          <Stack w="full" gap="2">
            {onViewDetail && (
              <HStack w="full" justify="end">
                <Button appearance="primary" size="sm" onClick={() => onViewDetail(item)}>
                  <LuEye />
                  Ver detalle
                </Button>
              </HStack>
            )}

            {canManageActions && estado.toUpperCase() === "PENDIENTE" && (
              <RequestActionButtons
                onApprove={() => onApprove?.(item.id_solicitud_vacaciones)}
                onDecline={() => onDecline?.(item.id_solicitud_vacaciones)}
                isSubmitting={isSubmitting}
                confirmSubject="esta solicitud"
              />
            )}
          </Stack>
        </Card.Footer>
      )}
    </Card.Root>
  );
}