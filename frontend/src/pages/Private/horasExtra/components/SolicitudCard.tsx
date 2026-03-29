/* eslint-disable no-unused-vars */
import {
  Badge,
  Card,
  Grid,
  GridItem,
  HStack,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Button } from "../../../../components/general/button/Button";

import type { SolicitudHoraExtra } from "../../../../types/Overtime";
import { LuEye } from "react-icons/lu";
import { formatDateTimeUi, formatDateUiDefault } from "../../../../utils";

interface SolicitudCardProps {
  item: SolicitudHoraExtra;
  onApprove?: (id: number) => void;
  onDecline?: (id: number) => void;
  onViewDetail?: (item: SolicitudHoraExtra) => void;
  isSubmitting?: boolean;
  canManageActions?: boolean;
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
  onApprove: _onApprove,
  onDecline: _onDecline,
  onViewDetail,
  isSubmitting = false,
  canManageActions = false,
  view = "management",
}: SolicitudCardProps) => {
  const estado = item.estado.estado;

  if (isSubmitting) {
    return (
      <Card.Root py={3} px={4}>
        <Card.Body pb={2} pt={0} px={0}>
          <Grid
            templateColumns={{ base: "1fr", md: "1fr auto" }}
            gap={{ base: 4, md: 3 }}
            alignItems="start"
          >
            <GridItem>
              <Stack gap={2} fontSize="sm">
                <HStack gap={2} wrap="wrap">
                  <Skeleton height="5" width="6rem" />
                  <Skeleton height="5" width="10rem" />
                  <Skeleton height="5" width="5.5rem" />
                </HStack>
                <HStack gap={2} wrap="wrap">
                  <Skeleton height="5" width="4rem" />
                  <Skeleton height="5" width="14rem" maxW="100%" />
                </HStack>
                <HStack gap={2} wrap="wrap">
                  <Skeleton height="5" width="7rem" />
                  <Skeleton height="5" width="12rem" maxW="100%" />
                </HStack>
                <HStack gap={2} wrap="wrap">
                  <Skeleton height="5" width="8rem" />
                  <Skeleton height="5" width="3rem" />
                </HStack>
              </Stack>
            </GridItem>

            <GridItem w={{ base: "full", md: "auto" }}>
              <Stack gap={1} align={{ base: "flex-start", md: "flex-end" }}>
                <Skeleton height="4" width="7rem" />
                <Skeleton height="4" width="9rem" />
              </Stack>
            </GridItem>
          </Grid>
        </Card.Body>

        {estado === "PENDIENTE" && canManageActions && (
          <Card.Footer pt={3} px={0}>
            <HStack w="full" justify="end" gap="2">
              <Skeleton height="9" width={{ base: "full", sm: "6.5rem" }} />
              <Skeleton height="9" width={{ base: "full", sm: "6.5rem" }} />
            </HStack>
          </Card.Footer>
        )}
      </Card.Root>
    );
  }

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
    <Card.Root py={3} px={4}>
      <Card.Body pb={2} pt={0} px={0}>
        <Grid
          templateColumns={{ base: "1fr", md: "auto 1fr auto" }}
          gap={{ base: 4, md: 3 }}
          alignItems="start"
        >

          <GridItem>
            <Stack gap={2} fontSize="sm">
              <HStack gap={2} wrap="wrap">
                <Text color="fg.muted">Solicitante:</Text>
                <Text fontWeight="semibold">{item.colaborador.nombre_completo}</Text>
                <Badge {...estadoBadgeProps(estado)}>{estado}</Badge>
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
          </GridItem>

          <GridItem textAlign={{ base: "left", md: "right" }}>
            <Stack gap={1} align={{ base: "flex-start", md: "flex-end" }}>
              <Text color="fg.muted" fontWeight="semibold" textStyle="xs">
                Solicitud #{item.id_solicitud_hx}
              </Text>
              <Text textStyle="xs" color="fg.muted">
                {formatFecha(item.fecha_solicitud)}
              </Text>
            </Stack>
          </GridItem>
        </Grid>
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
