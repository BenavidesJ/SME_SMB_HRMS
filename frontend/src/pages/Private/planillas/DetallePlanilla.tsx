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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
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

// ── Helpers ──

function formatDate(value: string | null | undefined) {
  if (!value) return "N/D";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-CR", { dateStyle: "medium" }).format(
    parsed,
  );
}

// ── Types ──

type HorasMonto = {
  cantidad: number;
  monto: number;
};

type DeduccionDetalle = {
  id: number;
  nombre: string;
  porcentaje: number;
  monto: number;
};

type RentaInfo = {
  monto_quincenal: number;
  proyectado_mensual: number;
};

type SimulacionResultado = {
  id_colaborador: number;
  nombre_completo: string;
  identificacion: string | null;
  salario_mensual: number;
  salario_quincenal_base: number;
  salario_diario: number;
  tarifa_hora: number;
  descuentos_dias: {
    ausencias: { dias: number; monto: number };
    incapacidad: { dias: number; monto: number };
    total: number;
  };
  horas_extra: HorasMonto;
  horas_nocturnas: HorasMonto;
  horas_feriado: HorasMonto;
  salario_devengado: number;
  deducciones_detalle: DeduccionDetalle[];
  renta: RentaInfo;
  total_deducciones: number;
  salario_neto: number;
  error: string | null;
};

type SimulacionResponse = {
  id_periodo: number;
  fecha_inicio: string;
  fecha_fin: string;
  total_colaboradores: number;
  total_neto: number;
  resultados: SimulacionResultado[];
  errores: {
    id_colaborador: number;
    nombre_completo: string;
    motivo: string;
  }[];
};

type GenerateFormValues = {
  colaboradores: (string | number)[];
};

type PayrollPeriod = {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string | null;
  id_ciclo_pago: number | null;
  estado: string | null;
  descripcion: string | null;
};

type PayrollDetail = {
  id_detalle: number;
  id_periodo: number;
  id_colaborador: number;
  id_contrato: number;
  salario_mensual: number;
  salario_quincenal: number;
  salario_diario: number;
  tarifa_hora: number;
  horas_ordinarias: HorasMonto;
  horas_extra: HorasMonto;
  horas_nocturnas: HorasMonto;
  horas_feriado: HorasMonto;
  salario_devengado: number;
  deducciones: {
    id_deduccion: number;
    nombre: string;
    porcentaje: number;
    monto: number;
  }[];
  total_cargas_sociales: number;
  renta: RentaInfo;
  total_deducciones: number;
  salario_neto: number;
};

type PayrollDetailsPayload = {
  id_periodo: number;
  colaboradores: number[];
};

type PayrollDetailsResponse = {
  id_periodo: number;
  total: number;
  detalles: PayrollDetail[];
};

type SimularPayload = {
  id_periodo: number;
  colaboradores: number[];
};

type GenerarPayload = {
  id_periodo: number;
  colaboradores: number[];
  generado_por: number;
};

type RecalcularPayload = {
  id_periodo: number;
  colaboradores: number[];
  generado_por?: number;
};

// ── Component ──

export const DetallePlanilla = () => {
  const { id } = useParams<{ id: string }>();
  const periodoId = Number(id);
  const periodoIdIsValid = Number.isInteger(periodoId) && periodoId > 0;
  const { user } = useAuth();
  const existentesRef = useRef<HTMLDivElement>(null);

  // ── Period data ──
  const { data: periodoData, isLoading: isPeriodoLoading } =
    useApiQuery<PayrollPeriod | null>({
      url: periodoIdIsValid ? `planillas/periodo_planilla/${periodoId}` : "",
      enabled: periodoIdIsValid,
    });

  const periodo = periodoData ?? null;

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

  const allCollaboratorIds = useMemo(
    () =>
      employees
        .map((emp) => Number(emp.id))
        .filter((val) => Number.isInteger(val) && val > 0),
    [employees],
  );

  const defaultSelectedCollaborators = useMemo(
    () => allCollaboratorIds.map((id) => String(id)),
    [allCollaboratorIds],
  );

  const hasEmployees = allCollaboratorIds.length > 0;

  // ── Simulation ──
  const { mutate: simularCalculo, isLoading: isSimulating } = useApiMutation<
    SimularPayload,
    SimulacionResponse
  >({ url: "planillas/simular", method: "POST" });

  const [simulacion, setSimulacion] = useState<SimulacionResultado[]>([]);
  const [simulacionMeta, setSimulacionMeta] = useState<{
    fecha_inicio: string;
    fecha_fin: string;
    total_neto: number;
  } | null>(null);

  // ── Create ──
  const { mutate: generarPlanilla, isLoading: isGenerating } = useApiMutation<
    GenerarPayload,
    any
  >({ url: "planillas", method: "POST" });

  // ── Recalculate ──
  const { mutate: recalcularPlanilla, isLoading: isRecalculating } =
    useApiMutation<RecalcularPayload, any>({
      url: "planillas/recalcular",
      method: "PATCH",
    });

  // ── Existing records ──
  const { mutate: fetchPayrollDetails, isLoading: fetchingDetails } =
    useApiMutation<PayrollDetailsPayload, PayrollDetailsResponse>({
      url: "planillas/detalle",
      method: "POST",
    });

  const [existingDetails, setExistingDetails] =
    useState<PayrollDetailsResponse | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<number>>(
    new Set(),
  );

  const periodoRangeLabel = useMemo(() => {
    if (!periodo) return "No disponible";
    return `${formatDate(periodo.fecha_inicio)} al ${formatDate(periodo.fecha_fin)}`;
  }, [periodo]);

  // ── Load existing details ──
  const loadExistingDetails = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!periodoIdIsValid || allCollaboratorIds.length === 0) {
        setExistingDetails(null);
        return;
      }

      try {
        const response = await fetchPayrollDetails({
          id_periodo: periodoId,
          colaboradores: allCollaboratorIds,
        });

        const data =
          (response as any)?.data ?? (response as any) ?? null;
        if (data && "detalles" in data) {
          setExistingDetails(data as PayrollDetailsResponse);
        } else {
          setExistingDetails(null);
        }
      } catch {
        if (!opts.silent) {
          showToast(
            "No se logró consultar los detalles de planilla.",
            "error",
          );
        }
        setExistingDetails(null);
      }
    },
    [fetchPayrollDetails, periodoId, periodoIdIsValid, allCollaboratorIds],
  );

  useEffect(() => {
    if (!periodoIdIsValid || !hasEmployees || initialFetchDone) return;
    setInitialFetchDone(true);
    loadExistingDetails({ silent: true });
  }, [periodoIdIsValid, hasEmployees, initialFetchDone, loadExistingDetails]);

  // ── Handlers ──

  const handleSimular = async (values: GenerateFormValues) => {
    if (!periodoIdIsValid) {
      showToast("El identificador del periodo es inválido.", "error");
      return false;
    }

    const collaboratorIds = (values.colaboradores ?? [])
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v) && v > 0);

    if (collaboratorIds.length === 0) {
      showToast("Seleccione al menos un colaborador.", "error");
      return false;
    }

    try {
      const response = await simularCalculo({
        id_periodo: periodoId,
        colaboradores: collaboratorIds,
      });

      const data =
        (response as any)?.resultados ??
        (response as any)?.data?.resultados ??
        [];
      const meta = {
        fecha_inicio:
          (response as any)?.fecha_inicio ??
          (response as any)?.data?.fecha_inicio ??
          periodo?.fecha_inicio ??
          "",
        fecha_fin:
          (response as any)?.fecha_fin ??
          (response as any)?.data?.fecha_fin ??
          periodo?.fecha_fin ??
          "",
        total_neto:
          (response as any)?.total_neto ??
          (response as any)?.data?.total_neto ??
          0,
      };

      setSimulacion(data);
      setSimulacionMeta(meta);
      return true;
    } catch {
      setSimulacion([]);
      setSimulacionMeta(null);
      return false;
    }
  };

  const handleCrear = async (values: GenerateFormValues) => {
    if (!periodoIdIsValid) {
      showToast("El identificador del periodo es inválido.", "error");
      return;
    }

    if (!user?.id) {
      showToast(
        "No se pudo identificar al usuario autenticado. Inicie sesión nuevamente.",
        "error",
      );
      return;
    }

    const collaboratorIds = (values.colaboradores ?? [])
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v) && v > 0);

    if (collaboratorIds.length === 0) {
      showToast("Seleccione al menos un colaborador.", "error");
      return;
    }

    try {
      await generarPlanilla({
        id_periodo: periodoId,
        colaboradores: collaboratorIds,
        generado_por: Number(user.id),
      });

      showToast("Planilla generada exitosamente.", "success");
      setSimulacion([]);
      setSimulacionMeta(null);
      loadExistingDetails();
    } catch (err: any) {
      if (err?.status === 409 || err?.response?.status === 409) {
        showToast(
          "Algunos colaboradores ya tienen planilla para este periodo. Utilice la opción de recalcular.",
          "warning",
        );
        setTimeout(() => {
          existentesRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
        loadExistingDetails();
      }
    }
  };

  const existingDetailsList = existingDetails?.detalles ?? [];
  const hasExistingDetails = existingDetailsList.length > 0;

  const handleRecalcular = async () => {
    if (selectedRecordIds.size === 0) {
      showToast("Seleccione al menos un registro para recalcular.", "info");
      return;
    }

    if (!periodoIdIsValid) return;

    const colaboradorIds = existingDetailsList
      .filter((d) => selectedRecordIds.has(d.id_detalle))
      .map((d) => d.id_colaborador);

    try {
      await recalcularPlanilla({
        id_periodo: periodoId,
        colaboradores: colaboradorIds,
        generado_por: user?.id ? Number(user.id) : undefined,
      });

      setSelectedRecordIds(new Set());
      loadExistingDetails();
    } catch {
      // toast automático vía interceptor
    }
  };

  const toggleRecordSelection = (detId: number) => {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (next.has(detId)) next.delete(detId);
      else next.add(detId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRecordIds.size === existingDetailsList.length) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(
        new Set(existingDetailsList.map((d) => d.id_detalle)),
      );
    }
  };

  // ── Computed ──
  const totalSimulado = useMemo(
    () => simulacion.reduce((acc, r) => acc + (r.salario_neto ?? 0), 0),
    [simulacion],
  );

  // ── Render ──

  return (
    <Layout
      pageTitle={
        periodoIdIsValid
          ? `Detalle del periodo de planilla #${periodoId}`
          : "Detalle de periodo de planilla"
      }
    >
      <Stack gap="8">
        {/* ──────── SECCIÓN: SIMULACIÓN ──────── */}
        <Form<GenerateFormValues>
          onSubmit={handleSimular}
          defaultValues={{
            colaboradores: defaultSelectedCollaborators,
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
                <Card.Title>Calcular planilla quincenal</Card.Title>
                <Card.Description>
                  Seleccione los colaboradores para simular el cálculo de
                  planilla del periodo seleccionado. Puede revisar los montos
                  antes de confirmar la generación.
                </Card.Description>
              </Card.Header>

              <Card.Body>
                <Stack gap="4">
                  <SimpleGrid columns={2} gap="3">
                    <Stack gap="0">
                      <Text textStyle="sm" color="fg.muted">
                        Periodo
                      </Text>
                      <Heading size="sm">
                        {periodoIdIsValid ? `#${periodoId}` : "No disponible"}
                      </Heading>
                    </Stack>

                    <Stack gap="0">
                      <Text textStyle="sm" color="fg.muted">
                        Rango
                      </Text>
                      <Text fontWeight="semibold">
                        {isPeriodoLoading ? "Cargando…" : periodoRangeLabel}
                      </Text>
                    </Stack>
                  </SimpleGrid>

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
                      disabled:
                        employeesLoading ||
                        !hasEmployees ||
                        !periodoIdIsValid,
                    }}
                    rules={{
                      validate: (value: any) =>
                        Array.isArray(value) && value.length > 0
                          ? true
                          : "Seleccione al menos un colaborador.",
                      setValueAs: (value: any) =>
                        Array.isArray(value)
                          ? value
                          : value
                            ? [value]
                            : [],
                    }}
                  />

                  <SelectedCollaboratorsBadges
                    collaboratorNameMap={collaboratorNameMap}
                  />
                </Stack>
              </Card.Body>

              <Card.Footer justifyContent="flex-end" gap="3">
                <SubmitButtons
                  isSimulating={isSimulating}
                  isCreating={isGenerating}
                  hasSimulacion={simulacion.length > 0}
                  disabled={
                    !periodoIdIsValid ||
                    employeesLoading ||
                    !hasEmployees
                  }
                  onCrear={handleCrear}
                />
              </Card.Footer>
            </Card.Root>

            {/* ── Panel derecho: Resultados de simulación ── */}
            <Stack flex="1" gap="4" w="full">
              {isSimulating ? (
                <Stack align="center" py="10" gap="3">
                  <Spinner size="lg" />
                  <Text color="fg.muted">Calculando planilla…</Text>
                </Stack>
              ) : simulacion.length > 0 ? (
                <Stack gap="4">
                  {/* Resumen */}
                  <Card.Root>
                    <Card.Body>
                      <SimpleGrid columns={{ base: 2, md: 4 }} gap="4">
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
                            {formatDate(simulacionMeta?.fecha_inicio)} –{" "}
                            {formatDate(simulacionMeta?.fecha_fin)}
                          </Text>
                        </Box>
                        <Box>
                          <Text textStyle="xs" color="fg.muted">
                            Total bruto
                          </Text>
                          <Heading size="md">
                            {formatCRC(
                              simulacion.reduce(
                                (acc, r) => acc + (r.salario_devengado ?? 0),
                                0,
                              ),
                            )}
                          </Heading>
                        </Box>
                        <Box>
                          <Text textStyle="xs" color="fg.muted">
                            Total neto
                          </Text>
                          <Heading size="md" color="green.600">
                            {formatCRC(totalSimulado)}
                          </Heading>
                        </Box>
                      </SimpleGrid>
                    </Card.Body>
                  </Card.Root>

                  {/* Tabla resumen de simulación */}
                  <Card.Root>
                    <Card.Header>
                      <Card.Title>Vista previa del cálculo</Card.Title>
                    </Card.Header>
                    <Card.Body p="0">
                      <Table.Root size="sm" variant="outline">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>Colaborador</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">
                              Salario quincenal
                            </Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">
                              Bruto
                            </Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">
                              Deducciones
                            </Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">
                              Neto
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
                              <Table.Cell textAlign="right">
                                {formatCRC(item.salario_quincenal_base)}
                              </Table.Cell>
                              <Table.Cell textAlign="right">
                                {formatCRC(item.salario_devengado)}
                              </Table.Cell>
                              <Table.Cell textAlign="right" color="red.600">
                                -{formatCRC(item.total_deducciones)}
                              </Table.Cell>
                              <Table.Cell textAlign="right">
                                <Text fontWeight="bold" color="green.600">
                                  {formatCRC(item.salario_neto)}
                                </Text>
                              </Table.Cell>
                              <Table.Cell>
                                {item.error ? (
                                  <Badge colorPalette="red" variant="subtle">
                                    Error
                                  </Badge>
                                ) : (
                                  <Badge colorPalette="green" variant="subtle">
                                    OK
                                  </Badge>
                                )}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Card.Body>
                  </Card.Root>

                  {/* Desglose individual por colaborador */}
                  {simulacion.map((item) => (
                    <SimulacionColaboradorCard
                      key={item.id_colaborador}
                      item={item}
                    />
                  ))}
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
                      Simule el cálculo de planilla
                    </EmptyState.Title>
                    <EmptyState.Description>
                      Seleccione colaboradores y presione &quot;Simular
                      cálculo&quot; para obtener una vista previa de los montos
                      antes de generar la planilla.
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
              <Flex
                justify="space-between"
                align="center"
                wrap="wrap"
                gap="3"
              >
                <Box>
                  <Card.Title>Planillas generadas</Card.Title>
                  <Card.Description>
                    Registros de planilla generados previamente para este
                    periodo. Seleccione uno o varios para recalcular.
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
              {fetchingDetails ? (
                <Stack align="center" py="10" gap="3">
                  <Spinner size="lg" />
                  <Text color="fg.muted">Cargando registros…</Text>
                </Stack>
              ) : hasExistingDetails ? (
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader w="40px">
                        <Checkbox.Root
                          checked={
                            selectedRecordIds.size ===
                            existingDetailsList.length &&
                            existingDetailsList.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>Colaborador</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">
                        Salario mensual
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">
                        Bruto
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">
                        Deducciones
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">
                        Neto
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {existingDetailsList.map((detail) => {
                      const fullName =
                        collaboratorNameMap.get(detail.id_colaborador) ??
                        `Colaborador #${detail.id_colaborador}`;
                      return (
                        <Table.Row
                          key={detail.id_detalle}
                          bg={
                            selectedRecordIds.has(detail.id_detalle)
                              ? "blue.50"
                              : undefined
                          }
                          cursor="pointer"
                          onClick={() =>
                            toggleRecordSelection(detail.id_detalle)
                          }
                        >
                          <Table.Cell>
                            <Checkbox.Root
                              checked={selectedRecordIds.has(
                                detail.id_detalle,
                              )}
                              onCheckedChange={() =>
                                toggleRecordSelection(detail.id_detalle)
                              }
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                            </Checkbox.Root>
                          </Table.Cell>
                          <Table.Cell>{toTitleCase(fullName)}</Table.Cell>
                          <Table.Cell textAlign="right">
                            {formatCRC(detail.salario_mensual)}
                          </Table.Cell>
                          <Table.Cell textAlign="right">
                            {formatCRC(detail.salario_devengado)}
                          </Table.Cell>
                          <Table.Cell textAlign="right" color="red.600">
                            -{formatCRC(detail.total_deducciones)}
                          </Table.Cell>
                          <Table.Cell textAlign="right">
                            <Text fontWeight="semibold" color="green.600">
                              {formatCRC(detail.salario_neto)}
                            </Text>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                    {/* Total row */}
                    <Table.Row bg="gray.50">
                      <Table.Cell colSpan={5}>
                        <Text fontWeight="bold">TOTAL NETO</Text>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <Heading size="md" color="green.600">
                          {formatCRC(existingDetails?.total ?? 0)}
                        </Heading>
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              ) : (
                <EmptyState.Root py="10">
                  <EmptyState.Content>
                    <EmptyState.Title>Sin registros</EmptyState.Title>
                    <EmptyState.Description>
                      No hay planillas generadas para este periodo. Utilice la
                      sección superior para simular y crear registros.
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

const SimulacionColaboradorCard = ({
  item,
}: {
  item: SimulacionResultado;
}) => {
  const deduccionesList = Array.isArray(item.deducciones_detalle)
    ? item.deducciones_detalle
    : [];
  const renta = item.renta ?? { monto_quincenal: 0, proyectado_mensual: 0 };

  return (
    <Card.Root
      borderLeftWidth={6}
      style={{ borderLeftColor: "var(--chakra-colors-blue-500)" }}
    >
      <Card.Header>
        <Card.Title>{toTitleCase(item.nombre_completo)}</Card.Title>
        <Card.Description>
          {item.identificacion ?? "Sin identificación"}
        </Card.Description>
      </Card.Header>

      <Card.Body>
        <Stack gap="5">
          {/* Tarifas de referencia */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap="3">
            <Box>
              <Text textStyle="xs" color="fg.muted">
                Salario mensual
              </Text>
              <Text fontWeight="semibold">
                {formatCRC(item.salario_mensual)}
              </Text>
            </Box>
            <Box>
              <Text textStyle="xs" color="fg.muted">
                Salario quincenal
              </Text>
              <Text fontWeight="semibold">
                {formatCRC(item.salario_quincenal_base)}
              </Text>
            </Box>
            <Box>
              <Text textStyle="xs" color="fg.muted">
                Salario diario
              </Text>
              <Text fontWeight="semibold">
                {formatCRC(item.salario_diario)}
              </Text>
            </Box>
            <Box>
              <Text textStyle="xs" color="fg.muted">
                Tarifa por hora
              </Text>
              <Text fontWeight="semibold">
                {formatCRC(item.tarifa_hora)}
              </Text>
            </Box>
          </SimpleGrid>

          <Separator />

          {/* Horas + montos */}
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Concepto</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">
                  Horas/Días
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Monto</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {item.descuentos_dias.ausencias.dias > 0 && (
                <Table.Row>
                  <Table.Cell>Ausencias injustificadas</Table.Cell>
                  <Table.Cell textAlign="right">
                    {item.descuentos_dias.ausencias.dias} días
                  </Table.Cell>
                  <Table.Cell textAlign="right" color="red.600">
                    -{formatCRC(item.descuentos_dias.ausencias.monto)}
                  </Table.Cell>
                </Table.Row>
              )}
              {item.descuentos_dias.incapacidad.dias > 0 && (
                <Table.Row>
                  <Table.Cell>Incapacidad (no cubierta)</Table.Cell>
                  <Table.Cell textAlign="right">
                    {item.descuentos_dias.incapacidad.dias} días
                  </Table.Cell>
                  <Table.Cell textAlign="right" color="red.600">
                    -{formatCRC(item.descuentos_dias.incapacidad.monto)}
                  </Table.Cell>
                </Table.Row>
              )}
              {item.horas_extra.cantidad > 0 && (
                <Table.Row>
                  <Table.Cell>Horas extra (×1.5)</Table.Cell>
                  <Table.Cell textAlign="right">
                    {item.horas_extra.cantidad}
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    {formatCRC(item.horas_extra.monto)}
                  </Table.Cell>
                </Table.Row>
              )}
              {item.horas_nocturnas.cantidad > 0 && (
                <Table.Row>
                  <Table.Cell>Horas nocturnas (×0.25)</Table.Cell>
                  <Table.Cell textAlign="right">
                    {item.horas_nocturnas.cantidad}
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    {formatCRC(item.horas_nocturnas.monto)}
                  </Table.Cell>
                </Table.Row>
              )}
              {item.horas_feriado.cantidad > 0 && (
                <Table.Row>
                  <Table.Cell>Horas feriado trabajado</Table.Cell>
                  <Table.Cell textAlign="right">
                    {item.horas_feriado.cantidad}
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    {formatCRC(item.horas_feriado.monto)}
                  </Table.Cell>
                </Table.Row>
              )}
              <Table.Row bg="blue.50">
                <Table.Cell colSpan={2}>
                  <Text fontWeight="bold">Salario devengado (bruto)</Text>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  <Text fontWeight="bold">
                    {formatCRC(item.salario_devengado)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>

          {/* Deducciones */}
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Deducción</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">
                  Porcentaje
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Monto</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {deduccionesList.map((ded, idx) => (
                <Table.Row key={ded.id ?? idx}>
                  <Table.Cell>{ded.nombre}</Table.Cell>
                  <Table.Cell textAlign="right">{ded.porcentaje}%</Table.Cell>
                  <Table.Cell textAlign="right" color="red.600">
                    -{formatCRC(ded.monto)}
                  </Table.Cell>
                </Table.Row>
              ))}
              {renta.monto_quincenal > 0 && (
                <Table.Row>
                  <Table.Cell>Impuesto sobre la renta</Table.Cell>
                  <Table.Cell textAlign="right">
                    <Text textStyle="xs" color="fg.muted">
                      Proy: {formatCRC(renta.proyectado_mensual)}/mes
                    </Text>
                  </Table.Cell>
                  <Table.Cell textAlign="right" color="red.600">
                    -{formatCRC(renta.monto_quincenal)}
                  </Table.Cell>
                </Table.Row>
              )}
              <Table.Row bg="red.50">
                <Table.Cell colSpan={2}>
                  <Text fontWeight="bold">Total deducciones</Text>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  <Text fontWeight="bold" color="red.600">
                    -{formatCRC(item.total_deducciones)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>

          {/* Neto */}
          <Flex
            justify="space-between"
            align="center"
            bg="green.50"
            p="4"
            borderRadius="lg"
          >
            <Heading size="md">Salario neto a pagar</Heading>
            <Heading size="md" color="green.700">
              {formatCRC(item.salario_neto)}
            </Heading>
          </Flex>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
};

const SelectedCollaboratorsBadges = ({
  collaboratorNameMap,
}: {
  collaboratorNameMap: Map<number, string>;
}) => {
  const { control } = useFormContext<GenerateFormValues>();
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
  onCrear: (values: GenerateFormValues) => Promise<void>;
}) => {
  const { getValues } = useFormContext<GenerateFormValues>();

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
          Generar planilla
        </Button>
      )}
    </>
  );
};