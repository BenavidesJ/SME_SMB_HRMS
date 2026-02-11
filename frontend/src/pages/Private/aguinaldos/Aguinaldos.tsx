/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Flex,
  Heading,
  Separator,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FiUser, FiRefreshCw, FiDollarSign } from "react-icons/fi";
import { Layout } from "../../../components/layout";
import { Form } from "../../../components/forms/Form/Form";
import {
  InputField,
  type SelectOption,
} from "../../../components/forms/InputField/InputField";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { toTitleCase, formatCRC } from "../../../utils";
import { showToast } from "../../../services/toast/toastService";
import { useAuth } from "../../../context/AuthContext";
import type { EmployeeRow } from "../../../types";
import type {
  AguinaldoSimulacion,
  AguinaldoSimulacionResponse,
  CrearLoteResponse,
  RecalcularResponse,
  AguinaldoRegistro,
} from "../../../services/api/aguinaldos";

// ── Helpers ──

/** Devuelve el período default para el aguinaldo del año actual */
function getDefaultPeriodo() {
  const now = new Date();
  const currentYear = now.getFullYear();
  // Si estamos entre Dic-Dic, el aguinaldo es para el año actual
  // Período: 1 Dic año-1 → 30 Nov año actual
  return {
    periodo_desde: `${currentYear - 1}-12-01`,
    periodo_hasta: `${currentYear}-11-30`,
    anio: currentYear,
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "N/D";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-CR", { dateStyle: "medium" }).format(parsed);
}

// ── Types ──

type CalcularFormValues = {
  colaboradores: (string | number)[];
  periodo_desde: string;
  periodo_hasta: string;
  fecha_pago: string;
};

// ── Component ──

export const Aguinaldos = () => {
  const { user } = useAuth();
  const defaults = useMemo(() => getDefaultPeriodo(), []);
  const existentesRef = useRef<HTMLDivElement>(null);

  // ── Employees data ──
  const { data: employees = [], isLoading: employeesLoading } =
    useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const options = useMemo<SelectOption[]>(
    () =>
      employees.map((emp) => ({
        label: toTitleCase(
          `${emp.nombre} ${emp.primer_apellido} ${emp.segundo_apellido}`.trim(),
        ),
        value: String(emp.id),
      })),
    [employees],
  );

  const collaboratorNameMap = useMemo(() => {
    const map = new Map<number, string>();
    options.forEach((opt) => map.set(Number(opt.value), opt.label));
    return map;
  }, [options]);

  const defaultSelectedCollaborators = useMemo(
    () =>
      employees
        .map((emp) => String(emp.id))
        .filter((id) => Number.isInteger(Number(id)) && Number(id) > 0),
    [employees],
  );

  const hasEmployees = defaultSelectedCollaborators.length > 0;

  // ── Simulation ──
  const {
    mutate: simularCalculo,
    isLoading: isSimulating,
  } = useApiMutation<
    { colaboradores: number[]; periodo_desde: string; periodo_hasta: string },
    AguinaldoSimulacionResponse
  >({ url: "aguinaldos/calcular-lote", method: "POST" });

  const [simulacion, setSimulacion] = useState<AguinaldoSimulacion[]>([]);
  const [simulacionMeta, setSimulacionMeta] = useState<{
    periodo_desde: string;
    periodo_hasta: string;
  } | null>(null);

  // ── Create batch ──
  const {
    mutate: crearLote,
    isLoading: isCreating,
  } = useApiMutation<
    {
      colaboradores: number[];
      periodo_desde: string;
      periodo_hasta: string;
      anio: number;
      fecha_pago: string;
      registrado_por: number;
    },
    CrearLoteResponse
  >({ url: "aguinaldos/crear-lote", method: "POST" });

  // ── Recalculate ──
  const {
    mutate: recalcular,
    isLoading: isRecalculating,
  } = useApiMutation<{ ids: number[] }, RecalcularResponse>({
    url: "aguinaldos/recalcular",
    method: "PATCH",
  });

  // ── Existing records ──
  const {
    data: existingRecords = [],
    isLoading: loadingRecords,
    refetch: refetchRecords,
  } = useApiQuery<AguinaldoRegistro[]>({ url: "aguinaldos" });

  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<number>>(
    new Set(),
  );

  // ── Handlers ──

  const handleSimular = async (values: CalcularFormValues) => {
    const collaboratorIds = (values.colaboradores ?? [])
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v) && v > 0);

    if (collaboratorIds.length === 0) {
      showToast("Seleccione al menos un colaborador.", "error");
      return false;
    }

    try {
      const response = await simularCalculo({
        colaboradores: collaboratorIds,
        periodo_desde: values.periodo_desde,
        periodo_hasta: values.periodo_hasta,
      });

      const data = (response as any)?.resultados ?? (response as any)?.data?.resultados ?? [];
      setSimulacion(data);
      setSimulacionMeta({
        periodo_desde: values.periodo_desde,
        periodo_hasta: values.periodo_hasta,
      });
      return true;
    } catch {
      setSimulacion([]);
      return false;
    }
  };

  const handleCrear = async (values: CalcularFormValues) => {
    const collaboratorIds = (values.colaboradores ?? [])
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v) && v > 0);

    if (collaboratorIds.length === 0) {
      showToast("Seleccione al menos un colaborador.", "error");
      return;
    }

    if (!user?.id) {
      showToast("No se pudo identificar al usuario autenticado.", "error");
      return;
    }

    // Derive year from periodo_hasta (Nov of year = that year's aguinaldo)
    const anio = new Date(`${values.periodo_hasta}T00:00:00`).getFullYear();

    try {
      await crearLote({
        colaboradores: collaboratorIds,
        periodo_desde: values.periodo_desde,
        periodo_hasta: values.periodo_hasta,
        anio,
        fecha_pago: values.fecha_pago,
        registrado_por: Number(user.id),
      });

      setSimulacion([]);
      setSimulacionMeta(null);
      refetchRecords();
    } catch (err: any) {
      // Handle 409 conflict — redirect to existing records
      if (err?.status === 409 || err?.response?.status === 409) {
        showToast(
          "Algunos colaboradores ya tienen aguinaldo para este período. Utilice la opción de recalcular en la tabla de registros existentes.",
          "warning",
        );
        // Scroll to existing records section
        setTimeout(() => {
          existentesRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
        refetchRecords();
      }
    }
  };

  const handleRecalcular = async () => {
    if (selectedRecordIds.size === 0) {
      showToast("Seleccione al menos un registro para recalcular.", "info");
      return;
    }

    try {
      await recalcular({ ids: Array.from(selectedRecordIds) });
      setSelectedRecordIds(new Set());
      refetchRecords();
    } catch {
      // toast ya se muestra automáticamente
    }
  };

  const toggleRecordSelection = (id: number) => {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRecordIds.size === existingRecords.length) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(existingRecords.map((r) => r.id_aguinaldo)));
    }
  };

  // ── Computed ──

  const totalSimulado = useMemo(
    () => simulacion.reduce((acc, r) => acc + (r.monto_aguinaldo ?? 0), 0),
    [simulacion],
  );

  // ── Render ──

  return (
    <Layout pageTitle="Aguinaldos">
      <Stack gap="8">
        {/* ──────── SECCIÓN: CÁLCULO ──────── */}
        <Form<CalcularFormValues>
          onSubmit={handleSimular}
          defaultValues={{
            colaboradores: defaultSelectedCollaborators,
            periodo_desde: defaults.periodo_desde,
            periodo_hasta: defaults.periodo_hasta,
            fecha_pago: `${defaults.anio}-12-15`,
          }}
        >
          <Stack
            direction={{ base: "column", xl: "row" }}
            align="flex-start"
            gap="6"
          >
            {/* ── Panel izquierdo: Formulario ── */}
            <Card.Root
              as="section"
              w={{ base: "full", xl: "560px" }}
              flexShrink={0}
            >
              <Card.Header>
                <Card.Title>Calcular aguinaldos</Card.Title>
                <Card.Description>
                  Seleccione los colaboradores y el rango del período para
                  simular el cálculo de aguinaldo. El período por defecto es Dic{" "}
                  {defaults.anio - 1} – Nov {defaults.anio}.
                </Card.Description>
              </Card.Header>

              <Card.Body>
                <Stack gap="4">
                  <InputField
                    fieldType="select"
                    name="colaboradores"
                    label="Colaboradores"
                    required
                    disableSelectPortal
                    options={options}
                    placeholder={
                      employeesLoading
                        ? "Cargando colaboradores..."
                        : options.length === 0
                          ? "Sin colaboradores disponibles"
                          : "Seleccione uno o varios"
                    }
                    selectRootProps={{
                      multiple: true,
                      disabled: employeesLoading || !hasEmployees,
                    }}
                    rules={{
                      validate: (value: any) =>
                        Array.isArray(value) && value.length > 0
                          ? true
                          : "Seleccione al menos un colaborador.",
                      setValueAs: (value: any) =>
                        Array.isArray(value) ? value : value ? [value] : [],
                    }}
                  />

                  <SelectedCollaboratorsBadges
                    collaboratorNameMap={collaboratorNameMap}
                  />

                  <SimpleGrid columns={2} gap="3">
                    <InputField
                      fieldType="date"
                      name="periodo_desde"
                      label="Período desde"
                      required
                    />
                    <InputField
                      fieldType="date"
                      name="periodo_hasta"
                      label="Período hasta"
                      required
                    />
                  </SimpleGrid>

                  <InputField
                    fieldType="date"
                    name="fecha_pago"
                    label="Fecha de pago"
                    required
                  />
                </Stack>
              </Card.Body>

              <Card.Footer justifyContent="flex-end" gap="3">
                <SubmitButtons
                  isSimulating={isSimulating}
                  isCreating={isCreating}
                  hasSimulacion={simulacion.length > 0}
                  disabled={employeesLoading || !hasEmployees}
                  onCrear={handleCrear}
                />
              </Card.Footer>
            </Card.Root>

            {/* ── Panel derecho: Resultados de simulación ── */}
            <Stack flex="1" gap="4" w="full">
              {isSimulating ? (
                <Stack align="center" py="10" gap="3">
                  <Spinner size="lg" />
                  <Text color="fg.muted">Calculando aguinaldos…</Text>
                </Stack>
              ) : simulacion.length > 0 ? (
                <Stack gap="4">
                  {/* Resumen */}
                  <Card.Root>
                    <Card.Body>
                      <SimpleGrid columns={{ base: 2, md: 3 }} gap="4">
                        <Box>
                          <Text textStyle="xs" color="fg.muted">
                            Colaboradores
                          </Text>
                          <Heading size="md">{simulacion.length}</Heading>
                        </Box>
                        <Box>
                          <Text textStyle="xs" color="fg.muted">
                            Período
                          </Text>
                          <Text fontWeight="semibold">
                            {formatDate(simulacionMeta?.periodo_desde)} –{" "}
                            {formatDate(simulacionMeta?.periodo_hasta)}
                          </Text>
                        </Box>
                        <Box>
                          <Text textStyle="xs" color="fg.muted">
                            Total aguinaldos
                          </Text>
                          <Heading size="md" color="green.600">
                            {formatCRC(totalSimulado)}
                          </Heading>
                        </Box>
                      </SimpleGrid>
                    </Card.Body>
                  </Card.Root>

                  {/* Tabla de simulación */}
                  <Card.Root>
                    <Card.Header>
                      <Card.Title>Vista previa del cálculo</Card.Title>
                    </Card.Header>
                    <Card.Body p="0">
                      <Table.Root size="sm" variant="outline">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>Colaborador</Table.ColumnHeader>
                            <Table.ColumnHeader>Identificación</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">
                              Total bruto
                            </Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">
                              Aguinaldo
                            </Table.ColumnHeader>
                            <Table.ColumnHeader>Estado</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {simulacion.map((item) => (
                            <Table.Row key={item.id_colaborador}>
                              <Table.Cell>
                                {toTitleCase(item.nombre_completo)}
                              </Table.Cell>
                              <Table.Cell>
                                {item.identificacion ?? "N/D"}
                              </Table.Cell>
                              <Table.Cell textAlign="right">
                                {formatCRC(item.total_bruto)}
                              </Table.Cell>
                              <Table.Cell textAlign="right">
                                <Text fontWeight="bold" color="green.600">
                                  {formatCRC(item.monto_aguinaldo)}
                                </Text>
                              </Table.Cell>
                              <Table.Cell>
                                {item.error ? (
                                  <Badge colorPalette="red" variant="subtle">
                                    Error
                                  </Badge>
                                ) : item.monto_aguinaldo > 0 ? (
                                  <Badge colorPalette="green" variant="subtle">
                                    OK
                                  </Badge>
                                ) : (
                                  <Badge colorPalette="yellow" variant="subtle">
                                    Sin datos
                                  </Badge>
                                )}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Card.Body>
                  </Card.Root>
                </Stack>
              ) : (
                <EmptyState.Root
                  colorPalette="blue"
                  border="0.15rem dashed"
                  borderColor="blue.600"
                  py="12"
                >
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <FiDollarSign />
                    </EmptyState.Indicator>
                    <EmptyState.Title>
                      Simule el cálculo de aguinaldos
                    </EmptyState.Title>
                    <EmptyState.Description>
                      Seleccione colaboradores y el rango de período, luego
                      presione &quot;Simular cálculo&quot; para obtener una vista
                      previa de los montos.
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Stack>
          </Stack>
        </Form>

        <Separator />

        {/* ──────── SECCIÓN: REGISTROS EXISTENTES ──────── */}
        <div ref={existentesRef}>
          <Card.Root>
            <Card.Header>
              <Flex justify="space-between" align="center" wrap="wrap" gap="3">
                <Box>
                  <Card.Title>Aguinaldos registrados</Card.Title>
                  <Card.Description>
                    Registros de aguinaldo creados previamente. Seleccione uno o
                    varios para recalcular sus montos.
                  </Card.Description>
                </Box>
                <Button
                  colorPalette="orange"
                  variant="outline"
                  size="sm"
                  onClick={handleRecalcular}
                  loading={isRecalculating}
                  disabled={selectedRecordIds.size === 0 || isRecalculating}
                >
                  <FiRefreshCw />
                  Recalcular seleccionados ({selectedRecordIds.size})
                </Button>
              </Flex>
            </Card.Header>

            <Card.Body p="0">
              {loadingRecords ? (
                <Stack align="center" py="10" gap="3">
                  <Spinner size="lg" />
                  <Text color="fg.muted">Cargando registros…</Text>
                </Stack>
              ) : existingRecords.length > 0 ? (
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader w="40px">
                        <Checkbox.Root
                          checked={
                            selectedRecordIds.size === existingRecords.length &&
                            existingRecords.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>Colaborador</Table.ColumnHeader>
                      <Table.ColumnHeader>Año</Table.ColumnHeader>
                      <Table.ColumnHeader>Período</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">
                        Monto
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>Fecha pago</Table.ColumnHeader>
                      <Table.ColumnHeader>Registrado por</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {existingRecords.map((record) => (
                      <Table.Row
                        key={record.id_aguinaldo}
                        bg={
                          selectedRecordIds.has(record.id_aguinaldo)
                            ? "blue.50"
                            : undefined
                        }
                        cursor="pointer"
                        onClick={() =>
                          toggleRecordSelection(record.id_aguinaldo)
                        }
                      >
                        <Table.Cell>
                          <Checkbox.Root
                            checked={selectedRecordIds.has(
                              record.id_aguinaldo,
                            )}
                            onCheckedChange={() =>
                              toggleRecordSelection(record.id_aguinaldo)
                            }
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                        </Table.Cell>
                        <Table.Cell>
                          {toTitleCase(record.nombre_completo)}
                        </Table.Cell>
                        <Table.Cell>{record.anio}</Table.Cell>
                        <Table.Cell>
                          {formatDate(record.periodo_desde)} –{" "}
                          {formatDate(record.periodo_hasta)}
                        </Table.Cell>
                        <Table.Cell textAlign="right">
                          <Text fontWeight="semibold" color="green.600">
                            {formatCRC(record.monto_calculado)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>{formatDate(record.fecha_pago)}</Table.Cell>
                        <Table.Cell>
                          {toTitleCase(record.registrado_por_nombre)}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              ) : (
                <EmptyState.Root py="10">
                  <EmptyState.Content>
                    <EmptyState.Title>Sin registros</EmptyState.Title>
                    <EmptyState.Description>
                      No hay aguinaldos registrados. Utilice la sección superior
                      para calcular y crear registros.
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Card.Body>
          </Card.Root>
        </div>
      </Stack>
    </Layout>
  );
};

// ── Sub-components ──

const SelectedCollaboratorsBadges = ({
  collaboratorNameMap,
}: {
  collaboratorNameMap: Map<number, string>;
}) => {
  const { control } = useFormContext<CalcularFormValues>();
  const selected = useWatch({ control, name: "colaboradores" });

  if (!Array.isArray(selected) || selected.length === 0) {
    return (
      <Text textStyle="sm" color="fg.muted">
        No hay colaboradores seleccionados actualmente.
      </Text>
    );
  }

  return (
    <Stack direction="row" flexWrap="wrap" gap="2">
      {selected.map((value) => {
        const numericId = Number(value);
        const label =
          collaboratorNameMap.get(numericId) ?? `Colaborador #${numericId}`;
        return (
          <Badge
            key={String(value)}
            variant="solid"
            colorPalette="blue"
            display="inline-flex"
            alignItems="center"
            gap="2"
            px="3"
            py="1"
          >
            <FiUser />
            {label}
          </Badge>
        );
      })}
    </Stack>
  );
};

const SubmitButtons = ({
  isSimulating,
  isCreating,
  hasSimulacion,
  disabled,
  onCrear,
}: {
  isSimulating: boolean;
  isCreating: boolean;
  hasSimulacion: boolean;
  disabled: boolean;
  // eslint-disable-next-line no-unused-vars
  onCrear: (values: CalcularFormValues) => Promise<void>;
}) => {
  const { getValues } = useFormContext<CalcularFormValues>();

  return (
    <>
      <Button
        type="submit"
        colorPalette="blue"
        variant="outline"
        loading={isSimulating}
        disabled={disabled || isSimulating}
      >
        Simular cálculo
      </Button>

      {hasSimulacion && (
        <Button
          colorPalette="green"
          loading={isCreating}
          disabled={disabled || isCreating}
          onClick={() => onCrear(getValues())}
        >
          Crear aguinaldos
        </Button>
      )}
    </>
  );
};
