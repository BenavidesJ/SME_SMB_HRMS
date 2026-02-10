/* eslint-disable no-unused-vars */
import {
  Box,
  Badge,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RatingGroup } from "@chakra-ui/react";
import { Modal } from "../../../../components/general/modal";
import { RadarChartEvaluacion } from "./RadarChartEvaluacion";
import type { Evaluacion } from "../../../../types/Evaluacion";

interface EvaluacionDetalleModalProps {
  evaluacion: Evaluacion;
  isOpen: boolean;
  onOpenChange: (_e: { open: boolean }) => void;
}

export const EvaluacionDetalleModal = ({
  evaluacion,
  isOpen,
  onOpenChange,
}: EvaluacionDetalleModalProps) => {
  const colaboradorNombre = evaluacion.colaborador
    ? `${evaluacion.colaborador.nombre} ${evaluacion.colaborador.primer_apellido} ${evaluacion.colaborador.segundo_apellido}`
    : "";

  const evaluadorNombre = evaluacion.evaluador
    ? `${evaluacion.evaluador.nombre} ${evaluacion.evaluador.primer_apellido}`
    : "";

  return (
    <Modal
      title={`Resultados de ${colaboradorNombre}`}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="xl"
    >
      <VStack align="stretch" gap="5">
        {/* ─── Info general ───────────────────────────────────────── */}
        <HStack justify="space-between" flexWrap="wrap" gap="2">
          <VStack align="start" gap="1">
            <Text fontSize="sm" color="gray.500">
              Evaluador: {evaluadorNombre}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Período: {evaluacion.fecha_inicio} — {evaluacion.fecha_fin}
            </Text>
          </VStack>
          <Badge colorPalette="teal" variant="solid" fontSize="lg" px="3" py="1">
            Puntaje: {Number(evaluacion.puntaje_general).toFixed(2)}
          </Badge>
        </HStack>

        {/* ─── Radar Chart ────────────────────────────────────────── */}
        <RadarChartEvaluacion evaluacion={evaluacion} />

        {/* ─── Detalle de rubros ──────────────────────────────────── */}
        <Heading size="sm">Detalle por rubro</Heading>
        {evaluacion.rubros.map((er) => {
          const rubro = er.rubro;
          const maxCal = rubro ? Number(rubro.calificacion) : 5;

          return (
            <Box
              key={er.id_rubro_evaluacion}
              p="3"
              borderWidth="1px"
              borderRadius="md"
              borderColor="gray.200"
            >
              <HStack justify="space-between" mb="1">
                <Text fontWeight="bold">{rubro?.rubro || "Rubro"}</Text>
                <Badge colorPalette="blue" size="sm">
                  {Number(rubro?.calificacion || 0).toFixed(1)} / {maxCal}
                </Badge>
              </HStack>

              <RatingGroup.Root
                count={maxCal}
                value={Number(rubro?.calificacion || 0)}
                readOnly
                size="sm"
              >
                <RatingGroup.HiddenInput />
                <RatingGroup.Control />
              </RatingGroup.Root>

              {rubro?.comentarios && (
                <Text fontSize="xs" color="gray.500" mt="1">
                  {rubro.comentarios}
                </Text>
              )}
            </Box>
          );
        })}

        {/* ─── Plan de acción ─────────────────────────────────────── */}
        {evaluacion.plan_accion && (
          <Box>
            <Heading size="sm" mb="2">
              Plan de Acción
            </Heading>
            <Box
              p="3"
              bg="gray.50"
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <Text fontSize="sm" whiteSpace="pre-wrap">
                {evaluacion.plan_accion}
              </Text>
            </Box>
          </Box>
        )}
      </VStack>
    </Modal>
  );
};
