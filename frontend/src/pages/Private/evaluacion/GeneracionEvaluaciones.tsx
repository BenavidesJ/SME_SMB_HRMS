import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Text,
  VStack,
  Badge,
  Tabs,
  Wrap,
  NativeSelect,
  Field,
} from "@chakra-ui/react";
import { FiPlus, FiEye, FiCheckCircle } from "react-icons/fi";
import { Layout } from "../../../components/layout";
import { Form } from "../../../components/forms/Form";
import { InputField } from "../../../components/forms/InputField";
import { DataTable } from "../../../components/general/table/DataTable";
import { EmptyStateIndicator } from "../../../components/general/feedback/EmptyState";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { RubrosManager } from "./components/RubrosManager";
import { EvaluacionFormModal } from "./components/EvaluacionFormModal";
import { EvaluacionDetalleModal } from "./components/EvaluacionDetalleModal";
import type { Evaluacion, CrearEvaluacionPayload, RubroEvaluacion } from "../../../types/Evaluacion";
import type { EmployeeRow } from "../../../types";
import type { DataTableColumn } from "../../../components/general/table/types";

interface CrearEvalFormValues {
  id_colaborador: string;
  id_evaluador: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export const GeneracionEvaluaciones = () => {
  // ─── State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>("evaluaciones");
  const [selectedRubros, setSelectedRubros] = useState<number[]>([]);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState<Evaluacion | null>(null);
  const [filtroDepto, setFiltroDepto] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");

  // ─── API Queries ────────────────────────────────────────────────────────
  const queryParams = useMemo(() => {
    const parts: string[] = [];
    if (filtroDepto) parts.push(`departamento=${filtroDepto}`);
    if (filtroEstado) parts.push(`finalizada=${filtroEstado}`);
    return parts.length > 0 ? `?${parts.join("&")}` : "";
  }, [filtroDepto, filtroEstado]);

  const {
    data: evaluaciones,
    isLoading: loadingEvals,
    refetch: refetchEvals,
  } = useApiQuery<Evaluacion[]>({
    url: `evaluacion-desempeno/evaluaciones${queryParams}`,
  });

  const { data: empleados } = useApiQuery<EmployeeRow[]>({
    url: "empleados",
  });

  // ─── API Mutations ──────────────────────────────────────────────────────
  const { mutate: crearEval, isLoading: creandoEval } = useApiMutation<
    CrearEvaluacionPayload,
    Evaluacion
  >({
    url: "evaluacion-desempeno/evaluaciones",
    method: "POST",
  });

  // ─── Helpers ────────────────────────────────────────────────────────────
  const empleadoOptions = useMemo(
    () =>
      (empleados ?? []).map((e) => ({
        label: `${e.nombre} ${e.primer_apellido} ${e.segundo_apellido}`,
        value: String(e.id),
      })),
    [empleados]
  );

  const departamentos = useMemo(() => {
    if (!evaluaciones) return [];
    const depMap = new Map<number, string>();
    for (const ev of evaluaciones) {
      const dep = ev.colaborador?.contratos?.[0]?.puesto?.departamento;
      if (dep) depMap.set(dep.id_departamento, dep.nombre);
    }
    return Array.from(depMap, ([id, nombre]) => ({ label: nombre, value: String(id) }));
  }, [evaluaciones]);

  const handleCrearEvaluacion = useCallback(
    async (data: CrearEvalFormValues) => {
      if (selectedRubros.length === 0) {
        throw new Error("Seleccione al menos un rubro");
      }
      await crearEval({
        id_colaborador: Number(data.id_colaborador),
        id_evaluador: Number(data.id_evaluador),
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        rubros_ids: selectedRubros,
      });
      setSelectedRubros([]);
      refetchEvals();
      return true;
    },
    [selectedRubros, crearEval, refetchEvals]
  );

  const handleVerEvaluacion = useCallback((ev: Evaluacion) => {
    setSelectedEval(ev);
    if (ev.finalizada) {
      setDetalleModalOpen(true);
    } else {
      setEvalModalOpen(true);
    }
  }, []);

  const handleEvalFinalizada = useCallback(() => {
    setEvalModalOpen(false);
    setSelectedEval(null);
    refetchEvals();
  }, [refetchEvals]);

  // ─── Tabla columnas ─────────────────────────────────────────────────────
  const columns: DataTableColumn<Evaluacion>[] = useMemo(
    () => [
      {
        id: "colaborador",
        header: "Colaborador",
        cell: (row) => {
          const c = row.colaborador;
          return c ? `${c.nombre} ${c.primer_apellido} ${c.segundo_apellido}` : "—";
        },
      },
      {
        id: "departamento",
        header: "Departamento",
        cell: (row) => {
          const dep = row.colaborador?.contratos?.[0]?.puesto?.departamento;
          return dep ? dep.nombre : "—";
        },
      },
      {
        id: "puesto",
        header: "Puesto",
        cell: (row) => {
          const puesto = row.colaborador?.contratos?.[0]?.puesto;
          return puesto ? puesto.nombre : "—";
        },
      },
      {
        id: "evaluador",
        header: "Evaluador",
        cell: (row) => {
          const e = row.evaluador;
          return e ? `${e.nombre} ${e.primer_apellido}` : "—";
        },
      },
      {
        id: "puntaje",
        header: "Puntaje",
        cell: (row) =>
          row.finalizada ? (
            <Badge colorPalette="teal" variant="solid">
              {Number(row.puntaje_general).toFixed(2)}
            </Badge>
          ) : (
            <Badge colorPalette="gray" variant="outline">
              Pendiente
            </Badge>
          ),
      },
      {
        id: "periodo",
        header: "Período",
        cell: (row) => `${row.fecha_inicio} → ${row.fecha_fin}`,
      },
      {
        id: "estado",
        header: "Estado",
        cell: (row) =>
          row.finalizada ? (
            <Badge colorPalette="green">Finalizada</Badge>
          ) : (
            <Badge colorPalette="orange">Pendiente</Badge>
          ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: (row) => (
          <HStack>
            <IconButton
              aria-label={row.finalizada ? "Ver detalle" : "Evaluar"}
              size="xs"
              variant="ghost"
              onClick={() => handleVerEvaluacion(row)}
            >
              {row.finalizada ? <FiEye /> : <FiCheckCircle />}
            </IconButton>
          </HStack>
        ),
        sticky: "end",
      },
    ],
    [handleVerEvaluacion]
  );

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <Layout pageTitle="Evaluaciones de Desempeño">
      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value)}
        mt="4"
      >
        <Tabs.List>
          <Tabs.Trigger value="evaluaciones">Evaluaciones</Tabs.Trigger>
          <Tabs.Trigger value="rubros">Gestión de Rubros</Tabs.Trigger>
          <Tabs.Trigger value="crear">Crear Evaluación</Tabs.Trigger>
        </Tabs.List>

        {/* ─── Tab: Evaluaciones ──────────────────────────────────────── */}
        <Tabs.Content value="evaluaciones">
          <VStack align="stretch" gap="4" mt="4">
            <Flex gap="4" flexWrap="wrap">
              <Field.Root minW="200px" maxW="300px">
                <Field.Label>Departamento</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={filtroDepto}
                    onChange={(e) => {
                      setFiltroDepto(e.target.value);
                      setTimeout(refetchEvals, 100);
                    }}
                  >
                    <option value="">Todos</option>
                    {departamentos.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root minW="200px" maxW="300px">
                <Field.Label>Estado</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={filtroEstado}
                    onChange={(e) => {
                      setFiltroEstado(e.target.value);
                      setTimeout(refetchEvals, 100);
                    }}
                  >
                    <option value="">Todos</option>
                    <option value="true">Finalizada</option>
                    <option value="false">Pendiente</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
            </Flex>

            {evaluaciones && evaluaciones.length > 0 ? (
              <DataTable
                columns={columns}
                data={evaluaciones}
                isDataLoading={loadingEvals}
                size="sm"
                striped
                scrollAreaHeight="500px"
                stickyHeader
              />
            ) : (
              <EmptyStateIndicator
                title="No hay evaluaciones"
                subtitle="Crea una nueva evaluación desde la pestaña 'Crear Evaluación'"
                icon={<FiEye />}
              />
            )}
          </VStack>
        </Tabs.Content>

        {/* ─── Tab: Rubros ────────────────────────────────────────────── */}
        <Tabs.Content value="rubros">
          <RubrosManager />
        </Tabs.Content>

        {/* ─── Tab: Crear Evaluación ──────────────────────────────────── */}
        <Tabs.Content value="crear">
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap="6" mt="4">
            <Box>
              <Heading size="md" mb="4">
                Nueva evaluación
              </Heading>
              <Form<CrearEvalFormValues>
                onSubmit={handleCrearEvaluacion}
                resetOnSuccess
              >
                <VStack align="stretch" gap="3">
                  <InputField
                    fieldType="select"
                    name="id_colaborador"
                    label="Colaborador a evaluar"
                    placeholder="Seleccione un colaborador"
                    options={empleadoOptions}
                    required
                    rules={{ required: "Seleccione un colaborador" }}
                  />
                  <InputField
                    fieldType="select"
                    name="id_evaluador"
                    label="Evaluador"
                    placeholder="Seleccione el evaluador"
                    options={empleadoOptions}
                    required
                    rules={{ required: "Seleccione un evaluador" }}
                  />
                  <InputField
                    fieldType="date"
                    name="fecha_inicio"
                    label="Fecha inicio del período"
                    required
                    rules={{ required: "La fecha de inicio es obligatoria" }}
                  />
                  <InputField
                    fieldType="date"
                    name="fecha_fin"
                    label="Fecha fin del período"
                    required
                    rules={{ required: "La fecha de fin es obligatoria" }}
                  />

                  <Box>
                    <Text fontWeight="medium" mb="2">
                      Rubros seleccionados: {selectedRubros.length}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Seleccione los rubros que aplicarán a esta evaluación.
                    </Text>
                  </Box>

                  <RubroSelector
                    selectedRubros={selectedRubros}
                    onSelectedChange={setSelectedRubros}
                  />

                  <Button
                    type="submit"
                    colorPalette="teal"
                    loading={creandoEval}
                    disabled={selectedRubros.length === 0}
                  >
                    <FiPlus />
                    Crear Evaluación
                  </Button>
                </VStack>
              </Form>
            </Box>
          </Grid>
        </Tabs.Content>
      </Tabs.Root>

      {/* ─── Modales ─────────────────────────────────────────────────── */}
      {selectedEval && !selectedEval.finalizada && (
        <EvaluacionFormModal
          evaluacion={selectedEval}
          isOpen={evalModalOpen}
          onOpenChange={(e) => {
            setEvalModalOpen(e.open);
            if (!e.open) setSelectedEval(null);
          }}
          onFinalizada={handleEvalFinalizada}
        />
      )}

      {selectedEval && selectedEval.finalizada && (
        <EvaluacionDetalleModal
          evaluacion={selectedEval}
          isOpen={detalleModalOpen}
          onOpenChange={(e) => {
            setDetalleModalOpen(e.open);
            if (!e.open) setSelectedEval(null);
          }}
        />
      )}
    </Layout>
  );
};

// ─── Sub-componente: Selector de Rubros ──────────────────────────────────────

interface RubroSelectorProps {
  selectedRubros: number[];
  onSelectedChange: (ids: number[]) => void;
}

function RubroSelector({ selectedRubros, onSelectedChange }: RubroSelectorProps) {
  const { data: rubros } = useApiQuery<RubroEvaluacion[]>({
    url: "evaluacion-desempeno/rubros",
  });

  const toggle = (id: number) => {
    if (selectedRubros.includes(id)) {
      onSelectedChange(selectedRubros.filter((r) => r !== id));
    } else {
      onSelectedChange([...selectedRubros, id]);
    }
  };

  if (!rubros || rubros.length === 0) {
    return (
      <Text fontSize="sm" color="orange.500">
        No hay rubros disponibles. Créelos primero en "Gestión de Rubros".
      </Text>
    );
  }

  return (
    <Wrap gap="2">
      {rubros.map((r) => (
        <Button
          key={r.id_rubro_evaluacion}
          size="sm"
          variant={selectedRubros.includes(r.id_rubro_evaluacion) ? "solid" : "outline"}
          colorPalette={selectedRubros.includes(r.id_rubro_evaluacion) ? "teal" : "gray"}
          onClick={() => toggle(r.id_rubro_evaluacion)}
        >
          {r.rubro}
        </Button>
      ))}
    </Wrap>
  );
}
