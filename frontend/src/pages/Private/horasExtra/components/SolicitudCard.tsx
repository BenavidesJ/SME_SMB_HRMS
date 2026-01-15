/* eslint-disable no-unused-vars */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/es";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CloseButton,
  Dialog,
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
}

const estadoBadgeProps = (estado: string) => {
  const key = estado.toUpperCase();
  switch (key) {
    case "PENDIENTE":
      return { colorPalette: "yellow", variant: "subtle" as const };
    case "APROBADO":
      return { colorPalette: "green", variant: "subtle" as const };
    case "CANCELADO":
      return { colorPalette: "red", variant: "subtle" as const };
    default:
      return { colorPalette: "gray", variant: "subtle" as const };
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
}: SolicitudCardProps) => {
  const estado = item.estado.estado;

  return (
    <Card.Root minW="300px" maxH="400px" overflow="hidden">
      <Card.Body overflowY="auto">
        <HStack justify="space-between" align="start" gap="4">
          <HStack gap="3" align="start">
            <Avatar.Root size="md">
              <Avatar.Fallback name={getNameInitials(item.colaborador.nombre_completo)} />
            </Avatar.Root>

            <Stack gap="2">
              <HStack gap="2" wrap="wrap">
                <Text textStyle="sm" color="fg.muted">
                  Solicitante:
                </Text>
                <Text fontWeight="semibold" textStyle="md">
                  {item.colaborador.nombre_completo}
                </Text>
                <Badge {...estadoBadgeProps(estado)}>{estado}</Badge>
              </HStack>

              <HStack gap="2" wrap="wrap">
                <Text textStyle="sm" color="fg.muted">
                  Correo electrónico:
                </Text>
                <Text textStyle="md">{item.colaborador.correo}</Text>
              </HStack>

              <Stack gap="1" mt="1">
                <HStack gap="2" wrap="wrap">
                  <Text textStyle="sm" color="fg.muted">
                    Fecha de trabajo:
                  </Text>
                  <Text fontWeight="semibold" textStyle="md">
                    {formatFecha(item.fecha_trabajo)}
                  </Text>
                </HStack>
              </Stack>

              <HStack gap="2" wrap="wrap" mt="1">
                <Text textStyle="sm" color="fg.muted">
                  Cantidad de horas solicitadas:
                </Text>
                <Text fontWeight="bold" textStyle="lg">
                  {item.horas_solicitadas}
                </Text>
              </HStack>
            </Stack>
          </HStack>

          <Stack gap="1" align="end" minW="fit-content">
            <Text color="fg.muted" fontWeight="semibold" textStyle="xs">
              Solicitud #{item.id_solicitud_hx}
            </Text>
            <Text textStyle="sm" fontWeight="semibold" color="fg.muted">
              Fecha de solicitud: {formatFecha(item.fecha_solicitud)}
            </Text>
          </Stack>
        </HStack>

        <Box mt="4">
          <Text textStyle="sm" color="fg.muted" mb="1">
            Justificación:
          </Text>
          <Text textStyle="md" color="fg">
            {item.justificacion}
          </Text>
        </Box>
      </Card.Body>

      {estado === "PENDIENTE" && (
        <Card.Footer>
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
