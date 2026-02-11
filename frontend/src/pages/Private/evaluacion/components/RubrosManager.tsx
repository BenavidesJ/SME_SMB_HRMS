import { useCallback } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  IconButton,
  Text,
  VStack,
  Badge,
  Card,
  Wrap,
} from "@chakra-ui/react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { Form } from "../../../../components/forms/Form";
import { InputField } from "../../../../components/forms/InputField";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import type { RubroEvaluacion, CrearRubroPayload } from "../../../../types/Evaluacion";

interface CrearRubroFormValues {
  rubro: string;
  calificacion: string;
  comentarios: string;
}

export const RubrosManager = () => {
  const {
    data: rubros,
    isLoading,
    refetch,
  } = useApiQuery<RubroEvaluacion[]>({
    url: "evaluacion-desempeno/rubros",
  });

  const { mutate: crearRubro, isLoading: creando } = useApiMutation<
    CrearRubroPayload,
    RubroEvaluacion
  >({
    url: "evaluacion-desempeno/rubros",
    method: "POST",
  });

  const { mutate: eliminarRubroMut, isLoading: eliminando } = useApiMutation<
    undefined,
    { eliminado: boolean },
    number
  >({
    url: (id) => `evaluacion-desempeno/rubros/${id}`,
    method: "DELETE",
  });

  const handleCrear = useCallback(
    async (data: CrearRubroFormValues) => {
      await crearRubro({
        rubro: data.rubro,
        calificacion: Number(data.calificacion),
        comentarios: data.comentarios || "",
      });
      refetch();
      return true;
    },
    [crearRubro, refetch]
  );

  const handleEliminar = useCallback(
    async (id: number) => {
      await eliminarRubroMut(id);
      refetch();
    },
    [eliminarRubroMut, refetch]
  );

  return (
    <VStack align="stretch" gap="6" mt="4">
      {/* ─── Formulario para crear rubro ─────────────────────────────── */}
      <Box maxW="500px">
        <Heading size="md" mb="4">
          Crear nuevo rubro
        </Heading>
        <Form<CrearRubroFormValues> onSubmit={handleCrear} resetOnSuccess>
          <VStack align="stretch" gap="3">
            <InputField
              fieldType="text"
              name="rubro"
              label="Nombre del rubro"
              placeholder="Ej: Trabajo en equipo"
              required
              rules={{ required: "El nombre del rubro es obligatorio" }}
            />
            <InputField
              fieldType="number"
              name="calificacion"
              label="Calificación máxima"
              placeholder="5"
              required
              rules={{
                required: "La calificación máxima es obligatoria",
                min: { value: 1, message: "Mínimo 1" },
                max: { value: 10, message: "Máximo 10" },
              }}
            />
            <InputField
              fieldType="text"
              name="comentarios"
              label="Descripción"
              placeholder="Descripción del rubro (opcional)"
            />
            <Button
              type="submit"
              colorPalette="teal"
              size="sm"
              loading={creando}
            >
              <FiPlus />
              Agregar rubro
            </Button>
          </VStack>
        </Form>
      </Box>

      {/* ─── Lista de rubros existentes ──────────────────────────────── */}
      <Box>
        <Heading size="md" mb="4">
          Rubros disponibles
        </Heading>
        {isLoading ? (
          <Text>Cargando rubros...</Text>
        ) : !rubros || rubros.length === 0 ? (
          <Text color="gray.500">No hay rubros creados aún.</Text>
        ) : (
          <Wrap gap="3">
            {rubros.map((r) => (
              <Card.Root key={r.id_rubro_evaluacion} size="sm" maxW="280px">
                <Card.Body>
                  <HStack justify="space-between">
                    <VStack align="start" gap="1">
                      <Text fontWeight="bold">{r.rubro}</Text>
                      <Badge colorPalette="teal" size="sm">
                        Máx: {Number(r.calificacion).toFixed(0)}
                      </Badge>
                      {r.comentarios && (
                        <Text fontSize="xs" color="gray.500">
                          {r.comentarios}
                        </Text>
                      )}
                    </VStack>
                    <IconButton
                      aria-label="Eliminar rubro"
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      loading={eliminando}
                      onClick={() => handleEliminar(r.id_rubro_evaluacion)}
                    >
                      <FiTrash2 />
                    </IconButton>
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}
          </Wrap>
        )}
      </Box>
    </VStack>
  );
};
