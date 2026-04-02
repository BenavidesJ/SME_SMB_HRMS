import { Badge, HStack, Separator, Stack, Text } from "@chakra-ui/react";
import { Modal } from "../../../../components/general";
import { formatDateUiCompact, toTitleCase } from "../../../../utils";
import { normalizeRequestStatus } from "../../../../utils/requestStatus";
import type { PermisoListItem, PermisoTipo } from "../types";

const PERMISO_TIPOS: Array<{ code: PermisoTipo; label: string }> = [
  { code: "GOCE", label: "Permiso con goce salarial" },
  { code: "SIN_GOCE", label: "Permiso sin goce salarial" },
];

interface PermisoDetalleModalProps {
  item: PermisoListItem | null;
  isOpen: boolean;
  onClose: () => void;
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

export function PermisoDetalleModal({ item, isOpen, onClose }: PermisoDetalleModalProps) {
  const status = normalizeRequestStatus(item?.estadoSolicitudPermisos?.estado ?? item?.estado_solicitud);

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
                <Text color="fg.muted">Días solicitados:</Text>
                <Text>{item.dias_solicitados ?? item.cantidad_dias ?? "—"}</Text>
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
          </Stack>
        ) : null
      }
    />
  );
}
