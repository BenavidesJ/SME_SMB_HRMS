/* eslint-disable no-unused-vars */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/es";

import {
  Avatar,
  Badge,
  Button,
  Card,
  CloseButton,
  Dialog,
  Grid,
  GridItem,
  HStack,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";

import type { SolicitudHoraExtra } from "../../../../types/Overtime";
import { getNameInitials } from "./helpers/getNameInitials";
import { LuCheck, LuX } from "react-icons/lu";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale("es");

interface SolicitudCardProps {
  item: SolicitudHoraExtra;
  onApprove?: (id: number) => void;
  onDecline?: (id: number) => void;
  isSubmitting?: boolean;
  canManageActions?: boolean;
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
const estadoBorderColor = (estado: string) => {
  const key = estado.toUpperCase();
  switch (key) {
    case "PENDIENTE":
      return "rgb(253, 224, 71)";
    case "APROBADO":
      return "rgb(59, 130, 246)"
    case "CANCELADO":
      return "rgb(161, 161, 170)";
    case "RECHAZADO":
      return "rgb(239, 68, 68)";
    default:
      return "rgb(161, 161, 170)"
  }
};

const formatFecha = (iso: string) => {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = isDateOnly ? dayjs(iso) : dayjs.utc(iso).local();

  const s = isDateOnly
    ? d.format("dddd D [de] MMMM, YYYY")
    : d.format("dddd D [de] MMMM, YYYY h:mm A");

  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const SolicitudCard = ({
  item,
  onApprove,
  onDecline,
  isSubmitting = false,
  canManageActions = false,
}: SolicitudCardProps) => {
  const estado = item.estado.estado;

  return (
    <Card.Root borderLeftWidth={6} py={3} px={4} style={{ borderLeftColor: estadoBorderColor(estado) }}>
      <Card.Body pb={2} pt={0} px={0}>
        <Grid
          templateColumns={{ base: "1fr", md: "auto 1fr auto" }}
          gap={{ base: 4, md: 3 }}
          alignItems="start"
        >
          <GridItem>
            <Avatar.Root size="lg">
              <Avatar.Fallback name={getNameInitials(item.colaborador.nombre_completo)} />
            </Avatar.Root>
          </GridItem>

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

      {estado === "PENDIENTE" && canManageActions && (
        <Card.Footer pt={3} px={0}>
          <HStack w="full" justify="end">
            {/* RECHAZAR - con confirmación */}
            <Dialog.Root size="sm">
              <Dialog.Trigger asChild>
                <Button
                  variant="subtle"
                  colorPalette="red"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  <LuX />
                  Rechazar
                </Button>
              </Dialog.Trigger>

              <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                  <Dialog.Content>
                    <Dialog.Header>
                      <Dialog.Title>Confirmar rechazo</Dialog.Title>
                    </Dialog.Header>

                    <Dialog.Body>
                      <Text>
                        ¿Estás seguro de rechazar esta solicitud de horas extra?
                      </Text>
                    </Dialog.Body>

                    <Dialog.Footer>
                      <Dialog.ActionTrigger asChild>
                        <Button variant="outline" disabled={isSubmitting}>
                          Cancelar
                        </Button>
                      </Dialog.ActionTrigger>

                      <Dialog.ActionTrigger asChild>
                        <Button
                          colorPalette="red"
                          disabled={isSubmitting}
                          loading={isSubmitting}
                          onClick={() => onDecline?.(item.id_solicitud_hx)}
                        >
                          Rechazar
                        </Button>
                      </Dialog.ActionTrigger>
                    </Dialog.Footer>

                    <Dialog.CloseTrigger asChild>
                      <CloseButton size="sm" />
                    </Dialog.CloseTrigger>
                  </Dialog.Content>
                </Dialog.Positioner>
              </Portal>
            </Dialog.Root>

            <Dialog.Root size="sm">
              <Dialog.Trigger asChild>
                <Button
                  variant="subtle"
                  colorPalette="green"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  <LuCheck />
                  Aprobar
                </Button>
              </Dialog.Trigger>

              <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                  <Dialog.Content>
                    <Dialog.Header>
                      <Dialog.Title>Confirmar aprobación</Dialog.Title>
                    </Dialog.Header>

                    <Dialog.Body>
                      <Text>
                        ¿Estás seguro de aprobar esta solicitud de horas extra?
                      </Text>
                    </Dialog.Body>

                    <Dialog.Footer>
                      <Dialog.ActionTrigger asChild>
                        <Button variant="outline" disabled={isSubmitting}>
                          Cancelar
                        </Button>
                      </Dialog.ActionTrigger>

                      <Dialog.ActionTrigger asChild>
                        <Button
                          colorPalette="green"
                          disabled={isSubmitting}
                          loading={isSubmitting}
                          onClick={() => onApprove?.(item.id_solicitud_hx)}
                        >
                          Aprobar
                        </Button>
                      </Dialog.ActionTrigger>
                    </Dialog.Footer>

                    <Dialog.CloseTrigger asChild>
                      <CloseButton size="sm" />
                    </Dialog.CloseTrigger>
                  </Dialog.Content>
                </Dialog.Positioner>
              </Portal>
            </Dialog.Root>
          </HStack>
        </Card.Footer>
      )}
    </Card.Root>
  );
};
