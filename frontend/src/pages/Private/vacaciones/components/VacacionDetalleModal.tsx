/* eslint-disable no-unused-vars */
import { Badge, HStack, Separator, Stack, Text } from "@chakra-ui/react";
import { Modal } from "../../../../components/general";
import { RequestActionButtons } from "../../../../components/general/requests/RequestActionButtons";
import { formatDateUiCompact, parseUiDateSafe, toTitleCase } from "../../../../utils";
import { normalizeRequestStatus } from "../../../../utils/requestStatus";
import type { VacacionListItem } from "../types";

interface VacacionDetalleModalProps {
  item: VacacionListItem | null;
  isOpen: boolean;
  onClose: () => void;
  canManageActions?: boolean;
  onApprove?: (...args: [number]) => Promise<void> | void;
  onDecline?: (...args: [number]) => Promise<void> | void;
  isSubmitting?: boolean;
}

const estadoBadgeProps = (estado?: string) => {
  switch (normalizeRequestStatus(estado)) {
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
  const startDate = parseUiDateSafe(inicio);
  const endDate = parseUiDateSafe(fin);

  if (!startDate || !endDate) {
    return "Duracion desconocida";
  }

  const diffDays = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / MS_IN_DAY));
  const totalDays = diffDays + 1;

  return `${totalDays} ${totalDays === 1 ? "dia" : "dias"}`;
};

const buildPersonName = (
  person:
    | {
      nombre: string | null;
      primer_apellido: string | null;
      segundo_apellido: string | null;
    }
    | null
    | undefined,
  fallback: string,
) => {
  const fullName = [person?.nombre, person?.primer_apellido, person?.segundo_apellido]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName ? toTitleCase(fullName) : fallback;
};

const getSkippedDatesDescription = (item: VacacionListItem) => {
  if (!item.dias_skipped_detalle?.length) return "Ninguno";

  return item.dias_skipped_detalle
    .map((skip) => `${formatDateUiCompact(skip.date)} (${toTitleCase(skip.reason)})`)
    .join(", ");
};

export function VacacionDetalleModal({
  item,
  isOpen,
  onClose,
  canManageActions = false,
  onApprove,
  onDecline,
  isSubmitting = false,
}: VacacionDetalleModalProps) {
  const status = normalizeRequestStatus(item?.estadoSolicitudVacaciones?.estado);
  const esPendiente = status === "PENDIENTE";
  const puedeGestionar = canManageActions && esPendiente && Boolean(onApprove) && Boolean(onDecline);

  const handleConfirmApprove = async () => {
    if (!item || !onApprove) return;
    await onApprove(item.id_solicitud_vacaciones);
    onClose();
  };

  const handleConfirmDecline = async () => {
    if (!item || !onDecline) return;
    await onDecline(item.id_solicitud_vacaciones);
    onClose();
  };

  return (
    <Modal
      title={item ? `Solicitud #${item.id_solicitud_vacaciones}` : "Detalle de solicitud"}
      isOpen={isOpen}
      onOpenChange={(event) => {
        if (!event.open) onClose();
      }}
      size="lg"
      content={
        item ? (
          <Stack gap="4" fontSize="sm">
            <HStack gap="2" wrap="wrap">
              <Text color="fg.muted">Estado:</Text>
              <Badge {...estadoBadgeProps(status)}>
                {toTitleCase(status || "DESCONOCIDO")}
              </Badge>
            </HStack>

            <Separator />

            <Stack gap="2">
              <Text fontWeight="semibold" color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                Solicitante
              </Text>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Nombre:</Text>
                <Text fontWeight="semibold">
                  {buildPersonName(item.colaborador, `Colaborador ${item.id_colaborador}`)}
                </Text>
              </HStack>
              {item.colaborador?.correo_electronico && (
                <HStack gap="2" wrap="wrap">
                  <Text color="fg.muted">Correo:</Text>
                  <Text>{item.colaborador.correo_electronico}</Text>
                </HStack>
              )}
            </Stack>

            <Separator />

            <Stack gap="2">
              <Text fontWeight="semibold" color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                Detalles
              </Text>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Fecha inicio:</Text>
                <Text fontWeight="semibold">{formatDateUiCompact(item.fecha_inicio)}</Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Fecha fin:</Text>
                <Text fontWeight="semibold">{formatDateUiCompact(item.fecha_fin)}</Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Duracion:</Text>
                <Text>{getDurationLabel(item.fecha_inicio, item.fecha_fin)}</Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Dias solicitados:</Text>
                <Text>{item.dias_solicitados ?? "0"}</Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Dias aprobados:</Text>
                <Text>{item.dias_aprobados ?? "0"}</Text>
              </HStack>
              <Stack gap="1">
                <Text color="fg.muted">Dias omitidos:</Text>
                <Text>{getSkippedDatesDescription(item)}</Text>
              </Stack>
              {item.saldo_vacaciones && (
                <HStack gap="2" wrap="wrap">
                  <Text color="fg.muted">Saldo al registrar:</Text>
                  <Text>{item.saldo_vacaciones.dias_ganados - item.saldo_vacaciones.dias_tomados} dias</Text>
                </HStack>
              )}
              <Stack gap="1">
                <Text color="fg.muted">Observaciones:</Text>
                <Text>{item.observaciones?.trim() || "Sin observaciones"}</Text>
              </Stack>
            </Stack>

            {puedeGestionar && (
              <>
                <Separator />
                <Stack gap="3">
                  <Text fontWeight="semibold" color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                    Acciones del aprobador
                  </Text>
                  <RequestActionButtons
                    onApprove={handleConfirmApprove}
                    onDecline={handleConfirmDecline}
                    isSubmitting={isSubmitting}
                    confirmSubject="esta solicitud"
                  />
                </Stack>
              </>
            )}
          </Stack>
        ) : null
      }
    />
  );
}
