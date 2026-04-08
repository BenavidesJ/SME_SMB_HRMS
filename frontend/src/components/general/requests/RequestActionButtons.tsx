import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuCheck, LuX } from "react-icons/lu";

interface RequestActionButtonsProps {
  onApprove: () => Promise<void> | void;
  onDecline: () => Promise<void> | void;
  isSubmitting?: boolean;
  showIcons?: boolean;
  confirmSubject?: string;
}

export function RequestActionButtons({
  onApprove,
  onDecline,
  isSubmitting = false,
  showIcons = true,
  confirmSubject = "esta solicitud",
}: RequestActionButtonsProps) {
  const [confirmAction, setConfirmAction] = useState<"aprobar" | "rechazar" | null>(null);

  const handleConfirmApprove = async () => {
    await onApprove();
    setConfirmAction(null);
  };

  const handleConfirmDecline = async () => {
    await onDecline();
    setConfirmAction(null);
  };

  if (confirmAction === null) {
    return (
      <HStack gap="2" justify="flex-end" wrap="wrap">
        <Button
          size="sm"
          variant="subtle"
          colorPalette="red"
          onClick={() => setConfirmAction("rechazar")}
          disabled={isSubmitting}
        >
          {showIcons && <LuX />}
          Rechazar
        </Button>
        <Button
          size="sm"
          variant="subtle"
          colorPalette="blue"
          onClick={() => setConfirmAction("aprobar")}
          disabled={isSubmitting}
        >
          {showIcons && <LuCheck />}
          Aprobar
        </Button>
      </HStack>
    );
  }

  return (
    <Stack gap="2">
      <Text fontWeight="semibold" color={confirmAction === "rechazar" ? "red.600" : "green.600"}>
        {confirmAction === "rechazar"
          ? `¿Confirmar rechazo de ${confirmSubject}?`
          : `¿Confirmar aprobación de ${confirmSubject}?`}
      </Text>
      <HStack gap="2" justify="flex-end" wrap="wrap">
        <Button
          size="sm"
          variant="subtle"
          colorPalette="red"
          onClick={() => setConfirmAction(null)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          variant="subtle"
          colorPalette={confirmAction === "rechazar" ? "red" : "green"}
          onClick={confirmAction === "rechazar" ? handleConfirmDecline : handleConfirmApprove}
          disabled={isSubmitting}
          loading={isSubmitting}
          loadingText={confirmAction === "rechazar" ? "Rechazando" : "Aprobando"}
        >
          {confirmAction === "rechazar" ? "Sí, rechazar" : "Sí, aprobar"}
        </Button>
      </HStack>
    </Stack>
  );
}
