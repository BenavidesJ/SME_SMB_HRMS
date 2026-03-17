import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Grid,
  HStack,
  IconButton,
  Text,
  VStack,
  Badge,
  Card,
  Wrap,
  Stack,
} from "@chakra-ui/react";
import { FiEye, FiPlus, FiTrash2 } from "react-icons/fi";
import { Form } from "../../../../components/forms/Form";
import { InputField } from "../../../../components/forms/InputField";
import { Modal } from "../../../../components/general/modal";
import { DataTable } from "../../../../components/general/table/DataTable";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import { showToast } from "../../../../services/toast/toastService";
import type { RubroEvaluacion, CrearRubroPayload } from "../../../../types/Evaluacion";
import type { Puesto } from "../../../../types";
import type { DataTableColumn } from "../../../../components/general/table/types";
import {
  deleteEvaluationTemplateForPuesto,
  getEvaluationTemplateForPuesto,
  listEvaluationTemplates,
  pruneInvalidRubrosFromEvaluationTemplates,
  removeRubroFromEvaluationTemplates,
  replaceEvaluationTemplateForPuesto,
} from "./evaluationTemplates.repository";

interface CrearRubroFormValues {
  rubro: string;
  calificacion: string;
  comentarios: string;
}

type PuestoTemplateRow = Puesto & {
  hasTemplate: boolean;
  templateCount: number;
  updatedAt?: string;
};

export const RubrosManager = () => {
  const [selectedPuestoId, setSelectedPuestoId] = useState<string>("");
  const [templateDraftRubros, setTemplateDraftRubros] = useState<number[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [templateRefreshKey, setTemplateRefreshKey] = useState(0);
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [openRubroModal, setOpenRubroModal] = useState(false);

  const {
    data: rubrosData,
    isLoading,
    error: rubrosError,
    refetch,
  } = useApiQuery<RubroEvaluacion[]>({
    url: "evaluacion-desempeno/rubros",
  });

  const rubros = useMemo(() => rubrosData ?? [], [rubrosData]);

  const { data: puestos = [] } = useApiQuery<Puesto[]>({
    url: "mantenimientos/puestos",
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

  const selectedPuesto = useMemo(
    () => puestos.find((puesto) => String(puesto.id) === selectedPuestoId) ?? null,
    [puestos, selectedPuestoId],
  );

  const templateRows = useMemo<PuestoTemplateRow[]>(() => {
    listEvaluationTemplates();

    return puestos.map((puesto) => {
      const template = getEvaluationTemplateForPuesto({
        puestoId: puesto.id,
        puestoNombre: puesto.puesto,
      });

      return {
        ...puesto,
        hasTemplate: Boolean(template),
        templateCount: template?.rubros_ids.length ?? 0,
        updatedAt: template?.fecha_actualizacion,
      };
    });
  }, [puestos, templateRefreshKey]);

  const templateRubros = useMemo(
    () =>
      templateDraftRubros
        .map((id) => rubros.find((rubro) => rubro.id_rubro_evaluacion === id))
        .filter((rubro): rubro is RubroEvaluacion => Boolean(rubro)),
    [templateDraftRubros, rubros],
  );

  const loadTemplateForSelectedPuesto = useCallback(() => {
    if (!selectedPuesto) {
      setTemplateDraftRubros([]);
      setCurrentTemplateId(null);
      return;
    }

    const template = getEvaluationTemplateForPuesto({
      puestoId: selectedPuesto.id,
      puestoNombre: selectedPuesto.puesto,
    });

    setCurrentTemplateId(template?.id ?? null);
    setTemplateDraftRubros(template?.rubros_ids ?? []);
  }, [selectedPuesto]);

  const refreshTemplatesView = useCallback(() => {
    setTemplateRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!puestos.length || selectedPuestoId) return;
    setSelectedPuestoId(String(puestos[0].id));
  }, [puestos, selectedPuestoId]);

  useEffect(() => {
    if (isLoading || rubrosError || !rubrosData) return;

    const validRubrosIds = rubros.map((rubro) => rubro.id_rubro_evaluacion);
    const validIds = new Set(validRubrosIds);

    pruneInvalidRubrosFromEvaluationTemplates(validRubrosIds);
    setTemplateDraftRubros((prev) => prev.filter((rubroId) => validIds.has(rubroId)));
    refreshTemplatesView();
  }, [isLoading, refreshTemplatesView, rubros, rubrosData, rubrosError]);

  useEffect(() => {
    loadTemplateForSelectedPuesto();
  }, [loadTemplateForSelectedPuesto]);

  const handleCrear = useCallback(
    async (data: CrearRubroFormValues) => {
      await crearRubro({
        rubro: data.rubro,
        calificacion: Number(data.calificacion),
        comentarios: data.comentarios || "",
      });

      await refetch();
      setOpenRubroModal(false);
      return true;
    },
    [crearRubro, refetch]
  );

  const handleEliminar = useCallback(
    async (id: number) => {
      await eliminarRubroMut(id);

      removeRubroFromEvaluationTemplates(id);
      setTemplateDraftRubros((prev) => prev.filter((rubroId) => rubroId !== id));
      await refetch();
      loadTemplateForSelectedPuesto();
      refreshTemplatesView();
    },
    [eliminarRubroMut, loadTemplateForSelectedPuesto, refetch, refreshTemplatesView]
  );

  const toggleTemplateRubro = useCallback((rubroId: number) => {
    setTemplateDraftRubros((prev) => {
      if (prev.includes(rubroId)) {
        return prev.filter((id) => id !== rubroId);
      }

      return [...prev, rubroId];
    });
  }, []);

  const handleGuardarPlantilla = useCallback(() => {
    if (!selectedPuesto) {
      showToast("Seleccione un puesto para guardar la plantilla.", "error", "Plantillas de evaluación");
      return;
    }

    if (!templateDraftRubros.length) {
      showToast("Seleccione al menos un rubro para la plantilla.", "error", "Plantillas de evaluación");
      return;
    }

    const savedTemplate = replaceEvaluationTemplateForPuesto({
      puestoId: selectedPuesto.id,
      puestoNombre: selectedPuesto.puesto,
      template: {
        ...(currentTemplateId ? { id: currentTemplateId } : {}),
        nombre: `Plantilla ${selectedPuesto.puesto}`,
        rubros_ids: templateDraftRubros,
      },
    });

    setCurrentTemplateId(savedTemplate.id);
    setTemplateDraftRubros(savedTemplate.rubros_ids);
    loadTemplateForSelectedPuesto();
    refreshTemplatesView();
    setOpenTemplateModal(false);
    showToast("Plantilla guardada correctamente.", "success", "Plantillas de evaluación");
  }, [currentTemplateId, loadTemplateForSelectedPuesto, refreshTemplatesView, selectedPuesto, templateDraftRubros]);

  const handleEliminarPlantilla = useCallback(() => {
    if (!selectedPuesto) {
      showToast("Seleccione un puesto para eliminar su plantilla.", "error", "Plantillas de evaluación");
      return;
    }

    deleteEvaluationTemplateForPuesto({
      puestoId: selectedPuesto.id,
      puestoNombre: selectedPuesto.puesto,
    });

    setCurrentTemplateId(null);
    setTemplateDraftRubros([]);
    loadTemplateForSelectedPuesto();
    refreshTemplatesView();
    setOpenTemplateModal(false);
    showToast("Plantilla eliminada correctamente.", "success", "Plantillas de evaluación");
  }, [loadTemplateForSelectedPuesto, refreshTemplatesView, selectedPuesto]);

  const openTemplateBuilder = useCallback((row?: PuestoTemplateRow | null) => {
    const nextPuesto = row ?? selectedPuesto;

    if (!nextPuesto) {
      showToast("Seleccione un puesto para configurar su rúbrica.", "warning", "Plantillas de evaluación");
      return;
    }

    setSelectedPuestoId(String(nextPuesto.id));

    const template = getEvaluationTemplateForPuesto({
      puestoId: nextPuesto.id,
      puestoNombre: nextPuesto.puesto,
    });

    setCurrentTemplateId(template?.id ?? null);
    setTemplateDraftRubros(template?.rubros_ids ?? []);
    setOpenTemplateModal(true);
  }, [selectedPuesto]);

  const columns = useMemo<DataTableColumn<PuestoTemplateRow>[]>(() => [
    {
      id: "puesto",
      header: "Puesto",
      minW: "220px",
      cell: (row) => row.puesto,
    },
    {
      id: "departamento",
      header: "Departamento",
      minW: "180px",
      cell: (row) => row.departamento,
    },
    {
      id: "estado_plantilla",
      header: "Plantilla",
      minW: "150px",
      cell: (row) => (
        <Badge colorPalette={row.hasTemplate ? "green" : "gray"}>
          {row.hasTemplate ? "Configurada" : "Sin plantilla"}
        </Badge>
      ),
    },
    {
      id: "rubros",
      header: "Rubros",
      textAlign: "center",
      cell: (row) => row.templateCount,
    },
    {
      id: "actualizada",
      header: "Actualizada",
      minW: "180px",
      cell: (row) =>
        row.updatedAt
          ? new Date(row.updatedAt).toLocaleString("es-CR", {
            dateStyle: "short",
            timeStyle: "short",
          })
          : "—",
    },
  ], []);

  return (
    <VStack align="stretch" gap="6" mt="4" maxH={{ base: "none", lg: "calc(100vh - 220px)" }} overflowY="auto" pb="10" pr={{ base: 0, lg: 2 }}>
      <Box position="sticky" top="0" bg="white" zIndex={1} pt="1" pb="4">
        <Heading size="lg">Construye una plantilla de rúbricas para cada puesto.</Heading>
        <Text color="gray.500" mt="2">
          Seleccione un puesto de la tabla para ver su plantilla actual o crear una nueva cuando todavía no exista.
        </Text>
        <HStack mt="4" flexWrap="wrap">
          <Button colorPalette="teal" onClick={() => setOpenRubroModal(true)}>
            <FiPlus />
            Generar rubro
          </Button>
          <Button variant="outline" onClick={() => openTemplateBuilder()} disabled={!selectedPuesto}>
            <FiEye />
            {currentTemplateId ? "Ver plantilla" : "Crear Rúbrica"}
          </Button>
        </HStack>
      </Box>

      <Box>
        <Heading size="md" mb="4">
          Puestos
        </Heading>
        <Card.Root>
          <Card.Body>
            <DataTable
              columns={columns}
              data={templateRows}
              isDataLoading={false}
              size="sm"
              striped
              scrollAreaHeight="340px"
              stickyHeader
              actionColumn={{
                header: "Acción",
                w: "120px",
                sticky: false,
                cell: (row) => (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => openTemplateBuilder(row)}
                  >
                    <FiEye />
                    {row.hasTemplate ? "Ver plantilla" : "Crear Rúbrica"}
                  </Button>
                ),
              }}
              getRowProps={(row) => ({
                onClick: () => setSelectedPuestoId(String(row.id)),
                style: {
                  backgroundColor: String(row.id) === selectedPuestoId ? "var(--chakra-colors-brand-blue-50)" : undefined,
                },
              })}
            />
          </Card.Body>
        </Card.Root>
      </Box>

      <Grid templateColumns={{ base: "1fr", xl: "420px 1fr" }} gap="6" alignItems="start">
        <Box>
          <Heading size="md" mb="4">
            {selectedPuesto ? `Plantilla de ${selectedPuesto.puesto}` : "Seleccione un puesto"}
          </Heading>
          <Card.Root>
            <Card.Body>
              {!selectedPuesto ? (
                <Text color="gray.500">Seleccione un puesto en la tabla para ver o crear su plantilla.</Text>
              ) : (
                <Stack gap="4">
                  <Box>
                    <Text fontWeight="medium">
                      {currentTemplateId ? "Este puesto ya tiene una plantilla guardada." : "Este puesto aún no tiene plantilla. Configure una nueva."}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt="1">
                      Rubros en el borrador: {templateDraftRubros.length}
                    </Text>
                  </Box>

                  {!!templateRubros.length && (
                    <Wrap gap="2">
                      {templateRubros.map((rubro) => (
                        <Badge key={rubro.id_rubro_evaluacion} colorPalette="teal" px="2" py="1">
                          {rubro.rubro}
                        </Badge>
                      ))}
                    </Wrap>
                  )}

                  <HStack flexWrap="wrap">
                    <Button
                      colorPalette="teal"
                      onClick={() => openTemplateBuilder()}
                      disabled={!selectedPuesto}
                    >
                      {currentTemplateId ? "Ver plantilla" : "Crear Rúbrica"}
                    </Button>
                  </HStack>
                </Stack>
              )}
            </Card.Body>
          </Card.Root>
        </Box>

        <Box gridColumn={{ base: "1", xl: "1 / -1" }}>
          <Heading size="md" mb="4">
            Rubros disponibles
          </Heading>
          {isLoading ? (
            <Text>Cargando rubros...</Text>
          ) : rubros.length === 0 ? (
            <Text color="gray.500">No hay rubros creados aún.</Text>
          ) : (
            <Wrap gap="3" align="stretch">
              {rubros.map((r) => (
                <Card.Root key={r.id_rubro_evaluacion} size="sm" w={{ base: "100%", md: "280px" }}>
                  <Card.Body>
                    <HStack justify="space-between" align="start">
                      <VStack align="start" gap="1" flex="1">
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
                      <VStack align="stretch" gap="2">
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
                      </VStack>
                    </HStack>
                  </Card.Body>
                </Card.Root>
              ))}
            </Wrap>
          )}
        </Box>
      </Grid>

      <Modal
        title={selectedPuesto ? (currentTemplateId ? `Plantilla de ${selectedPuesto.puesto}` : `Crear Rúbrica para ${selectedPuesto.puesto}`) : "Crear Rúbrica"}
        isOpen={openTemplateModal}
        size="xl"
        onOpenChange={(event) => {
          setOpenTemplateModal(event.open);
          if (!event.open) {
            loadTemplateForSelectedPuesto();
          }
        }}
        content={
          !selectedPuesto ? (
            <Text color="gray.500">Seleccione un puesto antes de configurar una rúbrica.</Text>
          ) : (
            <Stack gap="5">
              <Box>
                <Text fontWeight="medium">
                  {currentTemplateId ? "Edite la plantilla actual o ajuste sus rubros." : "Asigne los rubros que formarán la nueva plantilla del puesto."}
                </Text>
                <Text fontSize="sm" color="gray.500" mt="1">
                  Rubros seleccionados: {templateDraftRubros.length}
                </Text>
              </Box>

              {!!templateRubros.length && (
                <Wrap gap="2">
                  {templateRubros.map((rubro) => (
                    <Badge key={rubro.id_rubro_evaluacion} colorPalette="teal" px="2" py="1">
                      {rubro.rubro}
                    </Badge>
                  ))}
                </Wrap>
              )}

              <HStack flexWrap="wrap">
                <Button
                  colorPalette="teal"
                  onClick={handleGuardarPlantilla}
                  disabled={!selectedPuesto || templateDraftRubros.length === 0}
                >
                  {currentTemplateId ? "Guardar plantilla" : "Crear Rúbrica"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTemplateDraftRubros([])}
                  disabled={!selectedPuesto || templateDraftRubros.length === 0}
                >
                  Limpiar borrador
                </Button>
                <Button
                  colorPalette="red"
                  variant="outline"
                  onClick={handleEliminarPlantilla}
                  disabled={!selectedPuesto || !currentTemplateId}
                >
                  Eliminar plantilla
                </Button>
              </HStack>

              <Box>
                <Heading size="sm" mb="3">
                  Rubros disponibles para asignar
                </Heading>
                {isLoading ? (
                  <Text>Cargando rubros...</Text>
                ) : rubros.length === 0 ? (
                  <Text color="gray.500">No hay rubros creados aún.</Text>
                ) : (
                  <Wrap gap="3" align="stretch">
                    {rubros.map((r) => (
                      <Card.Root key={r.id_rubro_evaluacion} size="sm" w={{ base: "100%", md: "280px" }}>
                        <Card.Body>
                          <HStack justify="space-between" align="start">
                            <VStack align="start" gap="1" flex="1">
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
                            <Button
                              size="xs"
                              variant={templateDraftRubros.includes(r.id_rubro_evaluacion) ? "solid" : "outline"}
                              colorPalette={templateDraftRubros.includes(r.id_rubro_evaluacion) ? "teal" : "gray"}
                              onClick={() => toggleTemplateRubro(r.id_rubro_evaluacion)}
                            >
                              {templateDraftRubros.includes(r.id_rubro_evaluacion) ? "Quitar" : "Agregar"}
                            </Button>
                          </HStack>
                        </Card.Body>
                      </Card.Root>
                    ))}
                  </Wrap>
                )}
              </Box>
            </Stack>
          )
        }
      />

      <Modal
        title="Generar rubro"
        isOpen={openRubroModal}
        size="lg"
        onOpenChange={(event) => setOpenRubroModal(event.open)}
        content={
          <Form<CrearRubroFormValues>
            onSubmit={handleCrear}
            resetOnSuccess
            defaultValues={{
              rubro: "",
              calificacion: "0",
              comentarios: "",
            }}
          >
            <VStack align="stretch" gap="3">
              <InputField
                fieldType="text"
                name="rubro"
                label="Nombre del rubro"
                placeholder="Ej: Trabajo en equipo"
                required
                textOnly
                rules={{ required: "El nombre del rubro es obligatorio" }}
              />
              <InputField
                fieldType="number"
                name="calificacion"
                label="Calificación máxima"
                placeholder="0"
                required
                numberProps={{ min: 0, max: 10 }}
                rules={{
                  required: "La calificación máxima es obligatoria",
                  min: { value: 0, message: "Mínimo 0" },
                  max: { value: 10, message: "Máximo 10" },
                }}
              />
              <InputField
                fieldType="text"
                name="comentarios"
                label="Descripción"
                placeholder="Descripción del rubro (opcional)"
              />
              <Text fontSize="sm" color="gray.500">
                Este rubro se crea libre y podrá asignarse después a cualquier plantilla.
              </Text>
              <Button
                type="submit"
                colorPalette="teal"
                size="sm"
                loading={creando}
              >
                <FiPlus />
                Generar rubro
              </Button>
            </VStack>
          </Form>
        }
      />
    </VStack>
  );
};
