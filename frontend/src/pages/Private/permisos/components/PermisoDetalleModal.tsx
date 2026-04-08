/* eslint-disable no-unused-vars */
import { Badge, HStack, Separator, Stack, Text } from "@chakra-ui/react";
import { Modal } from "../../../../components/general";
import { RequestActionButtons } from "../../../../components/general/requests/RequestActionButtons";
import { formatDateUiCompact, toTitleCase } from "../../../../utils";
import { normalizeRequestStatus } from "../../../../utils/requestStatus";
import type { PermisoDuracionTipo, PermisoListItem, PermisoTipo } from "../types";

const PERMISO_TIPOS: Array<{ code: PermisoTipo; label: string }> = [
  { code: "GOCE", label: "Permiso con goce salarial" },
  { code: "SIN_GOCE", label: "Permiso sin goce salarial" },
];

interface PermisoDetalleModalProps {
  item: PermisoListItem | null;
  isOpen: boolean;
  onClose: () => void;
  canManageActions?: boolean;
  onApprove?: (id: number) => Promise<void> | void;
  onDecline?: (id: number) => Promise<void> | void;
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

const getPermisoTipoLabel = (item: PermisoListItem) => {
  if (item.tiposSolicitud?.tipo_solicitud) {
    return item.tiposSolicitud.tipo_solicitud;
  }

  const fromCatalog = PERMISO_TIPOS.find(
    (tipo) => tipo.code === String(item.tipo_permiso ?? "").toUpperCase(),
  )?.label;

  return fromCatalog ?? "Tipo no disponible";
};

const parsePositiveNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const resolvePermisoMode = (item: PermisoListItem): PermisoDuracionTipo => {
  if (item.tipo_permiso_modo === "HORAS" || item.tipo_permiso_modo === "DIAS") {
    return item.tipo_permiso_modo;
  }

  const isSameDay = String(item.fecha_inicio ?? "") === String(item.fecha_fin ?? "");
  const totalDias = parsePositiveNumber(item.cantidad_dias);
  return isSameDay && totalDias !== null && totalDias < 1 ? "HORAS" : "DIAS";
};

export function PermisoDetalleModal({
  item,
  isOpen,
  onClose,
  canManageActions = false,
  onApprove,
  onDecline,
  isSubmitting = false,
}: PermisoDetalleModalProps) {
  const status = normalizeRequestStatus(item?.estadoSolicitudPermisos?.estado ?? item?.estado_solicitud);
  const mode = item ? resolvePermisoMode(item) : "DIAS";
  const esPendiente = status === "PENDIENTE";
  const puedeGestionar = canManageActions && esPendiente && Boolean(onApprove) && Boolean(onDecline);

  const handleConfirmApprove = async () => {
    if (!item || !onApprove) return;
    await onApprove(item.id_solicitud);
    onClose();
  };

  const handleConfirmDecline = async () => {
    if (!item || !onDecline) return;
    await onDecline(item.id_solicitud);
    onClose();
  };

  return (
    <Modal
      title={item ? `Solicitud #${item.id_solicitud}` : "Detalle de solicitud"}
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
                <Text color="fg.muted">Tipo:</Text>
                <Text>{getPermisoTipoLabel(item)}</Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Modalidad:</Text>
                <Badge colorPalette={mode === "HORAS" ? "orange" : "teal"} variant="subtle">
                  {mode === "HORAS" ? "Por horas" : "Por días"}
                </Badge>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Fecha inicio:</Text>
                <Text fontWeight="semibold">{formatDateUiCompact(item.fecha_inicio)}</Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Fecha fin:</Text>
                <Text fontWeight="semibold">{formatDateUiCompact(item.fecha_fin)}</Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Goce salarial:</Text>
                <Badge colorPalette={item.con_goce_salarial ? "green" : "gray"} variant="subtle">
                  {item.con_goce_salarial ? "Con goce" : "Sin goce"}
                </Badge>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">{mode === "HORAS" ? "Horas solicitadas:" : "Días solicitados:"}</Text>
                <Text>
                  {mode === "HORAS"
                    ? `${item.horas_solicitadas ?? item.cantidad_horas ?? "—"} h`
                    : item.dias_solicitados ?? item.cantidad_dias ?? "—"}
                </Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Días aprobados:</Text>
                <Text>{item.dias_aprobados ?? "—"}</Text>
              </HStack>
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
