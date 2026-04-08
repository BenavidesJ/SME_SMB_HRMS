/* eslint-disable no-unused-vars */
import {
  Badge,
  Card,
  Grid,
  GridItem,
  HStack,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Button } from "../../../../components/general/button/Button";

import type { SolicitudHoraExtra } from "../../../../types/Overtime";
import { LuEye } from "react-icons/lu";
import { formatDateTimeUi, formatDateUiDefault } from "../../../../utils";

interface SolicitudCardProps {
  item: SolicitudHoraExtra;
  onViewDetail?: (item: SolicitudHoraExtra) => void;
  isSubmitting?: boolean;
  view?: "personal" | "management";
}

const estadoBadgeProps = (estado: string) => {
  const key = estado.toUpperCase();
  switch (key) {
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
const formatFecha = (iso: string) => {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  return isDateOnly ? formatDateUiDefault(iso) : formatDateTimeUi(iso);
};

export const SolicitudCard = ({
  item,
  onViewDetail,
  isSubmitting = false,
  view = "management",
}: SolicitudCardProps) => {
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

  const estado = item.estado.estado;

  if (view === "personal") {
    return (
      <Card.Root py={3} px={4}>
        <Card.Body pb={0} pt={0} px={0}>
          <Stack gap={2} fontSize="sm">
            <HStack gap={2} wrap="wrap">
              <Text color="fg.muted">Solicitante:</Text>
              <Text fontWeight="semibold">{item.colaborador.nombre_completo}</Text>
            </HStack>

            <HStack gap={2} wrap="wrap">
              <Text color="fg.muted">Correo:</Text>
              <Text>{item.colaborador.correo}</Text>
            </HStack>

            <HStack gap={2} wrap="wrap">
              <Text color="fg.muted">Fecha de trabajo:</Text>
              <Text fontWeight="semibold">{formatFecha(item.fecha_trabajo)}</Text>
            </HStack>

            <HStack gap={2} wrap="wrap">
              <Text color="fg.muted">Horas solicitadas:</Text>
              <Text fontWeight="semibold">{item.horas_solicitadas}</Text>
            </HStack>
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
                {formatFecha(item.fecha_solicitud)}
              </Text>
              <Text fontWeight="bold" textStyle="md" lineClamp={1}>
                {item.colaborador.nombre_completo}
              </Text>
              <Text textStyle="xs" color="fg.muted" lineClamp={1}>
                {item.colaborador.correo}
              </Text>
            </Stack>

            <Stack align="flex-end" gap="0.5" minW="fit-content">
              <Text color="fg.muted" textStyle="xs">
                Horas solicitadas
              </Text>
              <Text fontWeight="bold" textStyle="lg">
                {item.horas_solicitadas}
              </Text>
            </Stack>
          </HStack>

          <Grid templateColumns={{ base: "1fr", sm: "repeat(3, minmax(0, 1fr))" }} gap="3">
            <GridItem>
              <Stack gap="0.5">
                <Text color="fg.muted" textStyle="xs">ID</Text>
                <Text fontWeight="semibold" textStyle="sm">{item.id_solicitud_hx}</Text>
              </Stack>
            </GridItem>

            <GridItem>
              <Stack gap="0.5">
                <Text color="fg.muted" textStyle="xs">Fecha de trabajo</Text>
                <Text fontWeight="semibold" textStyle="sm">{formatFecha(item.fecha_trabajo)}</Text>
              </Stack>
            </GridItem>

            <GridItem>
              <Stack gap="0.5">
                <Text color="fg.muted" textStyle="xs">Estado</Text>
                <HStack gap="2" wrap="wrap">
                  <Badge {...estadoBadgeProps(estado)}>{estado}</Badge>
                </HStack>
                <Text textStyle="xs" color="fg.muted" lineClamp={1}>{item.tipo_hx.nombre}</Text>
              </Stack>
            </GridItem>
          </Grid>
        </Stack>
      </Card.Body>

      {onViewDetail && (
        <Card.Footer pt={3} px={0}>
          <HStack w="full" justify="end">
            <Button
              appearance="primary"
              size="sm"
              onClick={() => onViewDetail(item)}
            >
              <LuEye />
              Ver detalle
            </Button>
          </HStack>
        </Card.Footer>
      )}
    </Card.Root>
  );
};
