/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  Badge,
  Box,
  Field,
  HStack,
  NativeSelect,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Modal } from "../../../../components/general";
import { Button } from "../../../../components/general/button/Button";
import type { SolicitudHoraExtra, TipoDia } from "../../../../types/Overtime";
import { LuCheck, LuX } from "react-icons/lu";
import { formatDateTimeUi, formatDateUiDefault } from "../../../../utils";

export interface TipoHxCatalog {
  id: number;
  nombre: string;
  multiplicador: string;
}

interface SolicitudDetalleModalProps {
  item: SolicitudHoraExtra | null;
  isOpen: boolean;
  onClose: () => void;
  canManageActions: boolean;
  tiposHoraExtra: TipoHxCatalog[];
  onApprove: (id: number) => Promise<void> | void;
  onDecline: (id: number) => Promise<void> | void;
  onChangeTipoHx: (id: number, idTipoHx: number) => Promise<void> | void;
  isSubmitting?: boolean;
}

const tipoDiaBadgeProps = (tipo: TipoDia | undefined) => {
  switch (tipo) {
    case "FERIADO":
      return { colorPalette: "orange", variant: "subtle" as const };
    case "DESCANSO":
      return { colorPalette: "purple", variant: "subtle" as const };
    case "LABORAL":
    default:
      return { colorPalette: "green", variant: "subtle" as const };
  }
};

const estadoBadgeProps = (estado: string) => {
  switch (estado.toUpperCase()) {
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

export const SolicitudDetalleModal = ({
  item,
  isOpen,
  onClose,
  canManageActions,
  tiposHoraExtra,
  onApprove,
  onDecline,
  onChangeTipoHx,
  isSubmitting = false,
}: SolicitudDetalleModalProps) => {
  const esPendiente = item?.estado.estado?.toUpperCase() === "PENDIENTE";
  const puedeEditar = canManageActions && esPendiente;

  const [selectedTipoHxId, setSelectedTipoHxId] = useState<string>("");
  const [isSavingTipo, setIsSavingTipo] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"aprobar" | "rechazar" | null>(null);

  useEffect(() => {
    if (item) {
      setSelectedTipoHxId(String(item.tipo_hx?.id ?? ""));
      setConfirmAction(null);
    }
  }, [item]);

  const handleSaveTipo = async () => {
    if (!item || !selectedTipoHxId) return;
    const idTipo = Number(selectedTipoHxId);
    if (!Number.isFinite(idTipo) || idTipo <= 0) return;
    setIsSavingTipo(true);
    try {
      await onChangeTipoHx(item.id_solicitud_hx, idTipo);
    } finally {
      setIsSavingTipo(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!item) return;
    await onApprove(item.id_solicitud_hx);
    onClose();
  };

  const handleConfirmDecline = async () => {
    if (!item) return;
    await onDecline(item.id_solicitud_hx);
    onClose();
  };

  const tipoDiaLabel: Record<NonNullable<TipoDia>, string> = {
    FERIADO: "Feriado",
    LABORAL: "Día laboral",
    DESCANSO: "Día de descanso",
  };

  const currentTipoHxNombre =
    tiposHoraExtra.find((t) => String(t.id) === selectedTipoHxId)?.nombre ??
    item?.tipo_hx?.nombre ??
    "—";

  const tipoDia = item?.tipo_dia;

  return (
    <Modal
      title={
        item
          ? `Solicitud #${item.id_solicitud_hx}`
          : "Detalle de solicitud"
      }
      size="lg"
      isOpen={isOpen}
      onOpenChange={(event) => {
        if (!event.open) onClose();
      }}
      content={
        item ? (
          <Stack gap="4" fontSize="sm">
            {/* Estado */}
            <HStack gap="2" wrap="wrap">
              <Text color="fg.muted">Estado:</Text>
              <Badge {...estadoBadgeProps(item.estado.estado)}>
                {item.estado.estado}
              </Badge>
            </HStack>

            <Separator />

            {/* Datos del solicitante */}
            <Stack gap="2">
              <Text fontWeight="semibold" color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                Solicitante
              </Text>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Nombre:</Text>
                <Text fontWeight="semibold">{item.colaborador.nombre_completo}</Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Correo:</Text>
                <Text>{item.colaborador.correo}</Text>
              </HStack>
            </Stack>

            <Separator />

            {/* Detalles de la solicitud */}
            <Stack gap="2">
              <Text fontWeight="semibold" color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                Detalles
              </Text>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Fecha de solicitud:</Text>
                <Text>{formatDateTimeUi(item.fecha_solicitud)}</Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Fecha de trabajo:</Text>
                <Text fontWeight="semibold">{formatDateUiDefault(item.fecha_trabajo)}</Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Horas solicitadas:</Text>
                <Text fontWeight="semibold">{item.horas_solicitadas}</Text>
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Tipo de día:</Text>
                <Badge {...tipoDiaBadgeProps(tipoDia)}>
                  {tipoDia ? tipoDiaLabel[tipoDia] : "—"}
                </Badge>
                {tipoDia === "FERIADO" && item.nombre_feriado && (
                  <Text color="fg.muted">({item.nombre_feriado})</Text>
                )}
              </HStack>
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Tipo de hora extra:</Text>
                <Text fontWeight="semibold">{item.tipo_hx?.nombre ?? "—"}</Text>
              </HStack>
            </Stack>

            {/* Acciones del aprobador */}
            {puedeEditar && (
              <>
                <Separator />
                <Stack gap="3">
                  <Text fontWeight="semibold" color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                    Acciones del aprobador
                  </Text>

                  {/* Cambio de tipo hora extra */}
                  <Stack gap="2">
                    <Text color="fg.muted">Cambiar tipo de hora extra:</Text>
                    <HStack gap="2" wrap="wrap">
                      <Box flex="1" minW="180px">
                        <Field.Root>
                          <NativeSelect.Root size="sm">
                            <NativeSelect.Field
                              value={selectedTipoHxId}
                              onChange={(e) => setSelectedTipoHxId(e.target.value)}
                              _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                              aria-disabled={isSavingTipo || isSubmitting}
                            >
                              {tiposHoraExtra.map((t) => (
                                <option key={t.id} value={String(t.id)}>
                                  {t.nombre}
                                </option>
                              ))}
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                        </Field.Root>
                      </Box>
                      <Button
                        size="sm"
                        appearance="login"
                        onClick={handleSaveTipo}
                        disabled={
                          isSavingTipo ||
                          isSubmitting ||
                          selectedTipoHxId === String(item.tipo_hx?.id ?? "")
                        }
                        loading={isSavingTipo}
                        loadingText="Guardando"
                      >
                        Guardar tipo
                      </Button>
                    </HStack>
                    {selectedTipoHxId !== String(item.tipo_hx?.id ?? "") && (
                      <Text fontSize="xs" color="fg.muted">
                        Se cambiará a: <strong>{currentTipoHxNombre}</strong>
                      </Text>
                    )}
                  </Stack>

                  <Separator />

                  {/* Aprobar / Rechazar */}
                  {confirmAction === null ? (
                    <HStack gap="2" justify="flex-end" wrap="wrap">
                      <Button
                        size="sm"
                        appearance="danger"
                        onClick={() => setConfirmAction("rechazar")}
                        disabled={isSubmitting}
                      >
                        <LuX />
                        Rechazar
                      </Button>
                      <Button
                        size="sm"
                        appearance="login"
                        onClick={() => setConfirmAction("aprobar")}
                        disabled={isSubmitting}
                      >
                        <LuCheck />
                        Aprobar
                      </Button>
                    </HStack>
                  ) : (
                    <Stack gap="2">
                      <Text fontWeight="semibold" color={confirmAction === "rechazar" ? "red.600" : "green.600"}>
                        {confirmAction === "rechazar"
                          ? "¿Confirmar rechazo de esta solicitud?"
                          : "¿Confirmar aprobación de esta solicitud?"}
                      </Text>
                      <HStack gap="2" justify="flex-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmAction(null)}
                          disabled={isSubmitting}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          appearance={confirmAction === "rechazar" ? "danger" : "login"}
                          onClick={
                            confirmAction === "rechazar"
                              ? handleConfirmDecline
                              : handleConfirmApprove
                          }
                          disabled={isSubmitting}
                          loading={isSubmitting}
                          loadingText={confirmAction === "rechazar" ? "Rechazando" : "Aprobando"}
                        >
                          {confirmAction === "rechazar" ? "Sí, rechazar" : "Sí, aprobar"}
                        </Button>
                      </HStack>
                    </Stack>
                  )}
                </Stack>
              </>
            )}
          </Stack>
        ) : null
      }
    />
  );
};
