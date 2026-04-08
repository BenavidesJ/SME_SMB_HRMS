/* eslint-disable no-unused-vars */
import { Badge, Card, Grid, GridItem, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import { Button } from "../../../../components/general/button/Button";
import { toTitleCase, formatDateUiCompact } from "../../../../utils";
import type { PermisoDuracionTipo, PermisoListItem, PermisoTipo } from "../types";
import { LuEye } from "react-icons/lu";

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

interface PermisoSolicitudCardProps {
  item: PermisoListItem;
  showCollaborator?: boolean;
  isSubmitting?: boolean;
  onViewDetail?: (item: PermisoListItem) => void;
}

export function PermisoSolicitudCard({
  item,
  showCollaborator = false,
  isSubmitting = false,
  onViewDetail,
}: PermisoSolicitudCardProps) {
  const estado = item.estadoSolicitudPermisos?.estado ?? item.estado_solicitud ?? "DESCONOCIDO";
  const mode = resolvePermisoMode(item);
  const quantityLabel =
    mode === "HORAS"
      ? `${item.horas_solicitadas ?? item.cantidad_horas ?? "—"} h`
      : item.dias_solicitados ?? item.cantidad_dias ?? "—";
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
      <Card.Root py={3} px={4} h="full">
        <Card.Body py="10" px={0}>
          <Stack align="center" gap="3">
            <Spinner size="lg" color="blue.500" />
            <Text color="fg.muted" textStyle="sm">Procesando solicitud...</Text>
          </Stack>
        </Card.Body>
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
                {buildCollaboratorName(item)}
              </Text>
              <Text textStyle="xs" color="fg.muted" lineClamp={1}>
                {item.colaborador?.correo_electronico ?? "Sin correo registrado"}
              </Text>
            </Stack>

            <Stack align="flex-end" gap="0.5" minW="fit-content">
              <Text color="fg.muted" textStyle="xs">
                {mode === "HORAS" ? "Horas solicitadas" : "Días solicitados"}
              </Text>
              <Text fontWeight="bold" textStyle="lg">
                {quantityLabel}
              </Text>
            </Stack>
          </HStack>

          <Grid templateColumns={{ base: "1fr", sm: "repeat(3, minmax(0, 1fr))" }} gap="3">
            <GridItem>
              <Stack gap="0.5">
                <Text color="fg.muted" textStyle="xs">ID</Text>
                <Text fontWeight="semibold" textStyle="sm">{item.id_solicitud}</Text>
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
                  {showCollaborator ? `${tipoLabel} • ${mode === "HORAS" ? "Por horas" : "Por días"}` : ""}
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

      {onViewDetail && (
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
          </Stack>
        </Card.Footer>
      )}
    </Card.Root>
  );
}