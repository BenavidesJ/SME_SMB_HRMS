/* eslint-disable no-unused-vars */
import { Badge, Card, Grid, GridItem, HStack, Stack, Text } from "@chakra-ui/react";
import { FiEye } from "react-icons/fi";
import { Button } from "../../../../components/general/button/Button";
import type { IncapacidadGrupo } from "../../../../types";
import { formatDateUiCompact, toTitleCase } from "../../../../utils";

interface IncapacidadCardProps {
  item: IncapacidadGrupo;
  onViewDetail?: (_item: IncapacidadGrupo) => void;
}

const getTipoLabel = (tipo: string | null | undefined) => {
  const raw = String(tipo ?? "").replace(/_/g, " ").trim();
  if (!raw) return "Tipo no definido";
  return raw.toUpperCase() === raw ? raw : toTitleCase(raw);
};

export function IncapacidadCard({ item, onViewDetail }: IncapacidadCardProps) {
  const totalDias = item.dias.length;
  const tipoLabel = getTipoLabel(item.tipo_incapacidad);

  return (
    <Card.Root py={3} px={4} h="full">
      <Card.Body pb={2} pt={0} px={0}>
        <Stack gap="4">
          <HStack justify="space-between" align="start" gap="3" wrap="wrap">
            <Stack gap="0.5" minW="0">
              <Text textStyle="xs" color="fg.muted">
                Boleta
              </Text>
              <Text fontWeight="bold" textStyle="md" lineClamp={1}>
                {item.numero_boleta ?? "No definida"}
              </Text>
              <Text textStyle="xs" color="fg.muted" lineClamp={1}>
                {tipoLabel}
              </Text>
            </Stack>

            <Stack align="flex-end" gap="0.5" minW="fit-content">
              <Text color="fg.muted" textStyle="xs">
                Días
              </Text>
              <Text fontWeight="bold" textStyle="lg">
                {totalDias}
              </Text>
            </Stack>
          </HStack>

          <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="3">
            <GridItem>
              <Stack gap="0.5">
                <Text color="fg.muted" textStyle="xs">Fecha inicio</Text>
                <Text fontWeight="semibold" textStyle="sm">{formatDateUiCompact(item.fecha_inicio)}</Text>
              </Stack>
            </GridItem>

            <GridItem>
              <Stack gap="0.5">
                <Text color="fg.muted" textStyle="xs">Fecha fin</Text>
                <Text fontWeight="semibold" textStyle="sm">{formatDateUiCompact(item.fecha_fin)}</Text>
              </Stack>
            </GridItem>
          </Grid>

          <HStack gap="2" wrap="wrap">
            <Badge colorPalette="blue" variant="subtle">{tipoLabel}</Badge>
            <Badge variant="surface">{totalDias} {totalDias === 1 ? "día" : "días"}</Badge>
          </HStack>
        </Stack>
      </Card.Body>

      {onViewDetail && (
        <Card.Footer pt={3} px={0}>
          <HStack w="full" justify="end">
            <Button
              type="button"
              appearance="primary"
              size="sm"
              disabled={!item.numero_boleta}
              onClick={() => onViewDetail(item)}
            >
              <FiEye />
              Ver detalle
            </Button>
          </HStack>
        </Card.Footer>
      )}
    </Card.Root>
  );
}
