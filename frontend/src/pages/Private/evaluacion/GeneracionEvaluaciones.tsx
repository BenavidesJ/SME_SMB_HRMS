import { useState, useMemo, useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
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
import { Modal } from "../../../components/general";
import { useAuth } from "../../../context/AuthContext";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { RubrosManager } from "./components/RubrosManager";
import { EvaluacionFormModal } from "./components/EvaluacionFormModal";
import { EvaluacionDetalleModal } from "./components/EvaluacionDetalleModal";
import type { Evaluacion, CrearEvaluacionPayload, RubroEvaluacion } from "../../../types/Evaluacion";
import type { Contrato, EmployeeRow } from "../../../types";
import type { DataTableColumn } from "../../../components/general/table/types";
import { useFormContext } from "react-hook-form";
import { getEvaluationTemplateForPuesto } from "./components/evaluationTemplates.repository";
import { formatDateRangeUi } from "../../../utils";

interface CrearEvalFormValues {
  id_colaborador: string;
  id_evaluador: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface AppliedTemplateState {
  puestoNombre: string;
  hasTemplate: boolean;
  missingRubros: number;
  hasActiveContract: boolean;
  templateRubroIds: number[];
  templateKey: string;
}

interface ImmediateBossState {
  id: string;
  label: string;
  hasImmediateBoss: boolean;
}

const getLatestActiveContract = (contracts: Contrato[]) => {
  const activeContracts = contracts.filter((contract) => String(contract.estado ?? "").toUpperCase() === "ACTIVO");
  const source = activeContracts.length ? activeContracts : contracts;

  return source
    .slice()
    .sort((a, b) => String(b.fecha_inicio ?? "").localeCompare(String(a.fecha_inicio ?? "")))[0];
};

export const GeneracionEvaluaciones = () => {
  const { user } = useAuth();
  const loggedUserId = user?.id;


  const [activeTab, setActiveTab] = useState<string>("evaluaciones");
  const [selectedRubros, setSelectedRubros] = useState<number[]>([]);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState<Evaluacion | null>(null);
  const [filtroDepto, setFiltroDepto] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [appliedTemplateState, setAppliedTemplateState] = useState<AppliedTemplateState | null>(null);
  const [immediateBossState, setImmediateBossState] = useState<ImmediateBossState | null>(null);
  const [templateRubrosModalOpen, setTemplateRubrosModalOpen] = useState(false);
  const templateSyncKeyRef = useRef("");

  // ─── API Queries ────────────────────────────────────────────────────────
  const queryParams = useMemo(() => {
    const parts: string[] = [];
    if (loggedUserId) parts.push(`id_evaluador=${loggedUserId}`);
    if (filtroDepto) parts.push(`departamento=${filtroDepto}`);
    if (filtroEstado) parts.push(`finalizada=${filtroEstado}`);
    return parts.length > 0 ? `?${parts.join("&")}` : "";
  }, [filtroDepto, filtroEstado, loggedUserId]);

  const {
    data: evaluaciones,
    isLoading: loadingEvals,
    refetch: refetchEvals,
  } = useApiQuery<Evaluacion[]>({
    url: `evaluacion-desempeno/evaluaciones${queryParams}`,
    enabled: Boolean(loggedUserId),
  });

  const { data: empleados } = useApiQuery<EmployeeRow[]>({
    url: "empleados",
  });

  const { data: rubrosCatalog = [], isLoading: loadingRubros } = useApiQuery<RubroEvaluacion[]>({
    url: "evaluacion-desempeno/rubros",
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

  const empleadosList = useMemo(() => empleados ?? [], [empleados]);

  const immediateBossOptions = useMemo(
    () => (immediateBossState?.id ? [{ label: immediateBossState.label, value: immediateBossState.id }] : []),
    [immediateBossState],
  );

  const effectiveSelectedRubroIds = useMemo(
    () => (selectedRubros.length ? selectedRubros : (appliedTemplateState?.templateRubroIds ?? [])),
    [appliedTemplateState?.templateRubroIds, selectedRubros],
  );

  const selectedRubroDetails = useMemo(
    () =>
      effectiveSelectedRubroIds
        .map((rubroId) => rubrosCatalog.find((rubro) => rubro.id_rubro_evaluacion === rubroId))
        .filter((rubro): rubro is RubroEvaluacion => Boolean(rubro)),
    [effectiveSelectedRubroIds, rubrosCatalog],
  );

  const templateRubroDetails = useMemo(
    () =>
      (appliedTemplateState?.templateRubroIds ?? [])
        .map((rubroId) => rubrosCatalog.find((rubro) => rubro.id_rubro_evaluacion === rubroId))
        .filter((rubro): rubro is RubroEvaluacion => Boolean(rubro)),
    [appliedTemplateState?.templateRubroIds, rubrosCatalog],
  );

  const displayedSelectedRubrosCount = useMemo(
    () => effectiveSelectedRubroIds.length,
    [effectiveSelectedRubroIds],
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
      if (!Number(data.id_evaluador)) {
        throw new Error("No se pudo determinar el jefe inmediato del colaborador seleccionado");
      }

      if (effectiveSelectedRubroIds.length === 0) {
        throw new Error("Seleccione al menos un rubro");
      }
      await crearEval({
        id_colaborador: Number(data.id_colaborador),
        id_evaluador: Number(data.id_evaluador),
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        rubros_ids: effectiveSelectedRubroIds,
      });
      setSelectedRubros([]);
      refetchEvals();
      return true;
    },
    [crearEval, effectiveSelectedRubroIds, refetchEvals]
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

  useEffect(() => {
    if (!appliedTemplateState?.hasTemplate || !appliedTemplateState.templateRubroIds.length) {
      templateSyncKeyRef.current = "";
      return;
    }

    if (selectedRubros.length > 0) {
      return;
    }

    if (templateSyncKeyRef.current === appliedTemplateState.templateKey) {
      return;
    }

    setSelectedRubros(appliedTemplateState.templateRubroIds);
    templateSyncKeyRef.current = appliedTemplateState.templateKey;
  }, [appliedTemplateState, selectedRubros.length]);

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
        cell: (row) => formatDateRangeUi(row.fecha_inicio, row.fecha_fin),
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
            {row.finalizada ? (
              <Button
                aria-label="Ver detalle"
                size="xs"
                variant="ghost"
                onClick={() => handleVerEvaluacion(row)}
              >
                <FiEye />
                Ver
              </Button>
            ) : (
              <IconButton
                aria-label="Evaluar"
                size="xs"
                variant="ghost"
                onClick={() => handleVerEvaluacion(row)}
              >
                <FiCheckCircle />
              </IconButton>
            )}
          </HStack>
        ),
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
                  <EvaluationTemplateAutofill
                    empleados={empleadosList}
                    rubrosCatalog={rubrosCatalog}
                    rubrosCatalogReady={!loadingRubros}
                    onSelectedRubrosChange={setSelectedRubros}
                    onTemplateStateChange={setAppliedTemplateState}
                    onImmediateBossChange={setImmediateBossState}
                  />
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
                    label="Jefe inmediato"
                    placeholder={immediateBossOptions.length ? "Jefe inmediato asignado" : "Sin jefe inmediato asignado"}
                    options={immediateBossOptions}
                    required
                    disableSelectPortal
                    rules={{ required: "No se pudo determinar el jefe inmediato" }}
                    selectRootProps={{ disabled: true }}
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

                  <Box p="4" bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                    <Text fontWeight="medium">
                      Puesto detectado: {appliedTemplateState?.puestoNombre || "Pendiente de seleccionar colaborador"}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt="1">
                      {!appliedTemplateState
                        ? "Seleccione un colaborador para intentar cargar su plantilla por puesto."
                        : !appliedTemplateState.hasActiveContract
                          ? "El colaborador no tiene un contrato activo detectable. Debe seleccionar los rubros manualmente."
                          : appliedTemplateState.hasTemplate
                            ? `Se cargó automáticamente la plantilla del puesto. Puede ajustar los rubros antes de crear la evaluación.`
                            : "No existe una plantilla guardada para este puesto. Seleccione los rubros manualmente."}
                    </Text>
                    {appliedTemplateState && appliedTemplateState.hasActiveContract && !appliedTemplateState.hasTemplate && (
                      <Button mt="3" size="sm" variant="outline" onClick={() => setActiveTab("rubros")}>
                        Ir a Gestión de Rubros
                      </Button>
                    )}
                    {appliedTemplateState?.hasTemplate && (
                      <Button mt="3" size="sm" variant="outline" onClick={() => setTemplateRubrosModalOpen(true)}>
                        Ver rubros de la plantilla
                      </Button>
                    )}
                    {appliedTemplateState?.missingRubros ? (
                      <Text fontSize="sm" color="orange.600" mt="2">
                        {appliedTemplateState.missingRubros} rubro(s) de la plantilla ya no están disponibles y fueron omitidos.
                      </Text>
                    ) : null}
                  </Box>

                  {!appliedTemplateState?.hasTemplate && (
                    <Box>
                      <Text fontWeight="medium" mb="2">
                        Rubros seleccionados: {displayedSelectedRubrosCount}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Seleccione los rubros que aplicarán a esta evaluación.
                      </Text>
                      {!!selectedRubroDetails.length && (
                        <Wrap gap="2" mt="3">
                          {selectedRubroDetails.map((rubro) => (
                            <Badge key={rubro.id_rubro_evaluacion} colorPalette="teal" variant="subtle">
                              {rubro.rubro}
                            </Badge>
                          ))}
                        </Wrap>
                      )}
                    </Box>
                  )}

                  <RubroSelector
                    rubros={rubrosCatalog}
                    isLoading={loadingRubros}
                    selectedRubros={effectiveSelectedRubroIds}
                    onSelectedChange={setSelectedRubros}
                  />

                  <Button
                    type="submit"
                    colorPalette="teal"
                    loading={creandoEval}
                    disabled={effectiveSelectedRubroIds.length === 0}
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

      <Modal
        title="Rubros de la plantilla"
        isOpen={templateRubrosModalOpen}
        size="lg"
        onOpenChange={(e) => setTemplateRubrosModalOpen(e.open)}
        content={
          <VStack align="stretch" gap="4">
            <Text fontSize="sm" color="gray.500">
              {appliedTemplateState?.puestoNombre
                ? `Plantilla asociada al puesto ${appliedTemplateState.puestoNombre}.`
                : "No hay plantilla seleccionada."}
            </Text>

            {templateRubroDetails.length > 0 ? (
              <Wrap gap="2">
                {templateRubroDetails.map((rubro) => (
                  <Badge key={rubro.id_rubro_evaluacion} colorPalette="teal" variant="subtle" px="3" py="1.5">
                    {rubro.rubro}
                  </Badge>
                ))}
              </Wrap>
            ) : (
              <Text color="gray.500">No hay rubros disponibles para esta plantilla.</Text>
            )}
          </VStack>
        }
      />
    </Layout>
  );
};

// ─── Sub-componente: Selector de Rubros ──────────────────────────────────────

interface RubroSelectorProps {
  rubros: RubroEvaluacion[];
  isLoading: boolean;
  selectedRubros: number[];
  onSelectedChange: Dispatch<SetStateAction<number[]>>;
}

function RubroSelector({ rubros, isLoading, selectedRubros, onSelectedChange }: RubroSelectorProps) {
  const toggle = (id: number) => {
    if (selectedRubros.includes(id)) {
      onSelectedChange(selectedRubros.filter((r) => r !== id));
    } else {
      onSelectedChange([...selectedRubros, id]);
    }
  };

  if (isLoading) {
    return (
      <Text fontSize="sm" color="gray.500">
        Cargando rubros...
      </Text>
    );
  }

  if (rubros.length === 0) {
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

interface EvaluationTemplateAutofillProps {
  empleados: EmployeeRow[];
  rubrosCatalog: RubroEvaluacion[];
  rubrosCatalogReady: boolean;
  onSelectedRubrosChange: Dispatch<SetStateAction<number[]>>;
  onTemplateStateChange: Dispatch<SetStateAction<AppliedTemplateState | null>>;
  onImmediateBossChange: Dispatch<SetStateAction<ImmediateBossState | null>>;
}

function EvaluationTemplateAutofill({
  empleados,
  rubrosCatalog,
  rubrosCatalogReady,
  onSelectedRubrosChange,
  onTemplateStateChange,
  onImmediateBossChange,
}: EvaluationTemplateAutofillProps) {
  const { setValue, watch } = useFormContext<CrearEvalFormValues>();
  const selectedCollaboratorId = watch("id_colaborador");
  const collaboratorId = Number(selectedCollaboratorId);
  const lastAppliedKeyRef = useRef<string>("");
  const lastBossKeyRef = useRef<string>("");

  const { data: contracts } = useApiQuery<Contrato[]>({
    url: collaboratorId > 0 ? `empleados/${collaboratorId}/contratos` : "",
    enabled: collaboratorId > 0,
  });

  const contractsList = useMemo(() => contracts ?? [], [contracts]);

  useEffect(() => {
    if (!collaboratorId) {
      lastAppliedKeyRef.current = "";
      lastBossKeyRef.current = "";
      onSelectedRubrosChange([]);
      onTemplateStateChange(null);
      onImmediateBossChange(null);
      setValue("id_evaluador", "", { shouldDirty: false, shouldValidate: false });
      return;
    }

    const latestContract = getLatestActiveContract(contractsList);
    const puestoNombre = String(latestContract?.puesto ?? "").trim();
    const bossId = latestContract?.id_jefe_directo ? String(latestContract.id_jefe_directo) : "";
    const bossEmployee = empleados.find((employee) => Number(employee.id) === Number(bossId));
    const bossLabel = latestContract?.jefe_directo
      ? `${latestContract.jefe_directo.nombre} ${latestContract.jefe_directo.primer_apellido} ${latestContract.jefe_directo.segundo_apellido}`.trim()
      : bossEmployee
        ? `${bossEmployee.nombre} ${bossEmployee.primer_apellido} ${bossEmployee.segundo_apellido}`.trim()
        : bossId
          ? `Colaborador #${bossId}`
          : "";
    const nextBossKey = `${collaboratorId}:${bossId}:${bossLabel}`;

    if (lastBossKeyRef.current !== nextBossKey) {
      setValue("id_evaluador", bossId, { shouldDirty: false, shouldValidate: false });
      onImmediateBossChange(
        bossId
          ? {
            id: bossId,
            label: bossLabel,
            hasImmediateBoss: true,
          }
          : {
            id: "",
            label: "",
            hasImmediateBoss: false,
          },
      );
      lastBossKeyRef.current = nextBossKey;
    }

    if (!puestoNombre) {
      const nextKey = `no-contract:${collaboratorId}`;
      if (lastAppliedKeyRef.current !== nextKey) {
        onSelectedRubrosChange([]);
        lastAppliedKeyRef.current = nextKey;
      }

      onTemplateStateChange({
        puestoNombre: "",
        hasTemplate: false,
        missingRubros: 0,
        hasActiveContract: false,
        templateRubroIds: [],
        templateKey: nextKey,
      });
      return;
    }

    const template = getEvaluationTemplateForPuesto({ puestoNombre });
    const validRubros = new Set(rubrosCatalog.map((rubro) => rubro.id_rubro_evaluacion));
    const templateRubros = template?.rubros_ids ?? [];
    const nextRubros = rubrosCatalogReady
      ? templateRubros.filter((id) => validRubros.has(id))
      : templateRubros;
    const nextKey = `${collaboratorId}:${puestoNombre}:${template?.id ?? "no-template"}:${nextRubros.join(",")}`;

    if (lastAppliedKeyRef.current !== nextKey) {
      onSelectedRubrosChange(nextRubros);
      lastAppliedKeyRef.current = nextKey;
    }

    onTemplateStateChange({
      puestoNombre,
      hasTemplate: Boolean(template),
      missingRubros: rubrosCatalogReady
        ? Math.max(0, templateRubros.length - nextRubros.length)
        : 0,
      hasActiveContract: true,
      templateRubroIds: nextRubros,
      templateKey: nextKey,
    });
  }, [collaboratorId, contractsList, empleados, onImmediateBossChange, onSelectedRubrosChange, onTemplateStateChange, rubrosCatalog, rubrosCatalogReady, setValue]);

  return null;
}
