/* eslint-disable no-unused-vars */
import { useState, useCallback } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { RatingGroup } from "@chakra-ui/react";
import { Modal } from "../../../../components/general/modal";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import type {
  Evaluacion,
  FinalizarEvaluacionPayload,
  CalificacionRubro,
} from "../../../../types/Evaluacion";

interface EvaluacionFormModalProps {
  evaluacion: Evaluacion;
  isOpen: boolean;
  onOpenChange: (_e: { open: boolean }) => void;
  onFinalizada: () => void;
}

export const EvaluacionFormModal = ({
  evaluacion,
  isOpen,
  onOpenChange,
  onFinalizada,
}: EvaluacionFormModalProps) => {
  const [calificaciones, setCalificaciones] = useState<Record<number, number>>(
    () => {
      const init: Record<number, number> = {};
      for (const r of evaluacion.rubros) {
        init[r.id_rubro_evaluacion] = 0;
      }
      return init;
    }
  );
  const [comentarios, setComentarios] = useState<Record<number, string>>({});
  const [planAccion, setPlanAccion] = useState("");

  const { mutate: finalizar, isLoading } = useApiMutation<
    FinalizarEvaluacionPayload,
    Evaluacion,
    number
  >({
    url: (id) => `evaluacion-desempeno/evaluaciones/${id}/finalizar`,
    method: "PATCH",
  });

  const handleCalificacionChange = useCallback(
    (idRubro: number, value: number) => {
      setCalificaciones((prev) => ({ ...prev, [idRubro]: value }));
    },
    []
  );

  const handleComentarioChange = useCallback(
    (idRubro: number, value: string) => {
      setComentarios((prev) => ({ ...prev, [idRubro]: value }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    const calArray: CalificacionRubro[] = evaluacion.rubros.map((r) => ({
      id_rubro_evaluacion: r.id_rubro_evaluacion,
      calificacion: calificaciones[r.id_rubro_evaluacion] || 0,
      comentarios: comentarios[r.id_rubro_evaluacion] || "",
    }));

    // Validar que todos los rubros tengan calificación > 0
    const sinCalificar = calArray.filter((c) => c.calificacion === 0);
    if (sinCalificar.length > 0) {
      throw new Error("Debe calificar todos los rubros antes de finalizar");
    }

    await finalizar(evaluacion.id_evaluacion, {
      calificaciones: calArray,
      plan_accion: planAccion,
    });

    onFinalizada();
  }, [evaluacion, calificaciones, comentarios, planAccion, finalizar, onFinalizada]);

  const colaboradorNombre = evaluacion.colaborador
    ? `${evaluacion.colaborador.nombre} ${evaluacion.colaborador.primer_apellido} ${evaluacion.colaborador.segundo_apellido}`
    : "";

  return (
    <Modal
      title={`Evaluar a ${colaboradorNombre}`}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      footerContent={
        <HStack gap="3">
          <Button
            variant="outline"
            onClick={() => onOpenChange({ open: false })}
          >
            Cancelar
          </Button>
          <Button
            colorPalette="teal"
            onClick={handleSubmit}
            loading={isLoading}
          >
            Finalizar Evaluación
          </Button>
        </HStack>
      }
    >
      <VStack align="stretch" gap="5">
        <Box>
          <Text fontSize="sm" color="gray.500">
            Período: {evaluacion.fecha_inicio} — {evaluacion.fecha_fin}
          </Text>
        </Box>

        {evaluacion.rubros.map((er) => {
          const rubro = er.rubro;
          const maxCal = rubro ? Number(rubro.calificacion) : 5;
          const currentVal = calificaciones[er.id_rubro_evaluacion] || 0;

          return (
            <Box
              key={er.id_rubro_evaluacion}
              p="4"
              borderWidth="1px"
              borderRadius="md"
              borderColor="gray.200"
            >
              <HStack justify="space-between" mb="2">
                <Text fontWeight="bold">{rubro?.rubro || "Rubro"}</Text>
                <Text fontSize="sm" color="gray.500">
                  {currentVal}/{maxCal}
                </Text>
              </HStack>

              {rubro?.comentarios && (
                <Text fontSize="xs" color="gray.400" mb="2">
                  {rubro.comentarios}
                </Text>
              )}

              <RatingGroup.Root
                count={maxCal}
                value={currentVal}
                onValueChange={(e) =>
                  handleCalificacionChange(er.id_rubro_evaluacion, e.value)
                }
                size="md"
              >
                <RatingGroup.HiddenInput />
                <RatingGroup.Control />
              </RatingGroup.Root>

              <Textarea
                mt="2"
                placeholder="Comentarios sobre este rubro (opcional)"
                size="sm"
                value={comentarios[er.id_rubro_evaluacion] || ""}
                onChange={(e) =>
                  handleComentarioChange(er.id_rubro_evaluacion, e.target.value)
                }
              />
            </Box>
          );
        })}

        {/* Plan de acción */}
        <Box>
          <Heading size="sm" mb="2">
            Plan de Acción
          </Heading>
          <Textarea
            placeholder="Describa el plan de acción y recomendaciones para el colaborador..."
            value={planAccion}
            onChange={(e) => setPlanAccion(e.target.value)}
            rows={4}
          />
        </Box>
      </VStack>
    </Modal>
  );
};
