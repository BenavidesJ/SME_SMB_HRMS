/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Badge,
  Box,
  Button,
  Card,
  EmptyState,
  Heading,
  Separator,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { FiScissors } from "react-icons/fi";
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
import type { EmployeeRow } from "../../../types";

// ── Helpers ──

function formatDate(value: string | null | undefined) {
  if (!value) return "N/D";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-CR", { dateStyle: "medium" }).format(parsed);
}

// ── Types ──

type SimularFormValues = {
  idColaborador: string;
  causa: string;
  fechaTerminacion: string;
  realizo_preaviso: string;
};

type SimulacionData = {
  colaborador: { id: number; nombre: string; identificacion: number; fechaInicio: string };
  causa: string;
  fechaTerminacion: string;
  antiguedad: { diasTotales: number; meses: number; anios: number };
  componentes: {
    salarioDiario: { valor: number; origen: string };
    aguinaldoProporcional: { valor: number; detalles: any };
    vacacionesProporcionales: { valor: number; diasPendientes: number };
    cesantia: { valor: number; diasCalculados: number };
    preaviso: { valor: number; diasCalculados: number };
    salarioPendiente: { valor: number; diasPendientes: number };
  };
  totales: { totalBruto: number; deducciones: number; totalNeto: number };
  validaciones: { esValido: boolean; errores: string[]; advertencias: string[] };
};

type LiquidacionRegistro = {
  id_caso_termina: number;
  colaborador: string;
  causa: string;
  fechaTerminacion: string;
  montoTotal: number;
  aprobador: number;
  fechaAprobacion: string;
};

type CausaLiquidacion = {
  id: number;
  causa_liquidacion: string;
};

// ── Component ──

export const Liquidaciones = () => {
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

  // ── Causas de liquidación ──
  const { data: causasData = [], isLoading: causasLoading } =
    useApiQuery<CausaLiquidacion[]>({ url: "/mantenimientos/causas-liquidacion" });

  const causasOptions = useMemo<SelectOption[]>(
    () =>
      causasData.map((c) => ({
        label: c.causa_liquidacion,
        value: c.causa_liquidacion,
      })),
    [causasData],
  );

  // ── Simulation ──
  const {
    mutate: simularCalculo,
    isLoading: isSimulating,
  } = useApiMutation<
    { idColaborador: number; causa: string; fechaTerminacion: string; realizo_preaviso: boolean },
    any
  >({ url: "liquidaciones/simular", method: "POST" });

  const [simulacion, setSimulacion] = useState<SimulacionData | null>(null);

  // ── Create ──
  const {
    mutate: crearLiquidacion,
    isLoading: isCreating,
  } = useApiMutation<{ datosLiquidacion: any }, any>({
    url: "liquidaciones",
    method: "POST",
  });

  // ── Existing records ──
  const {
    data: existingRecords = [],
    isLoading: loadingRecords,
    refetch: refetchRecords,
  } = useApiQuery<LiquidacionRegistro[]>({ url: "liquidaciones" });

  // ── Handlers ──

  const handleSimular = async (values: SimularFormValues) => {
    const idColaborador = Number(values.idColaborador);

    if (!idColaborador || idColaborador <= 0) {
      showToast("Seleccione un colaborador.", "error");
      return false;
    }

    try {
      const response = await simularCalculo({
        idColaborador,
        causa: values.causa,
        fechaTerminacion: values.fechaTerminacion,
        realizo_preaviso: values.realizo_preaviso === "true",
      });

      const data = (response as any)?.data ?? (response as any) ?? null;
      setSimulacion(data);
      return true;
    } catch {
      setSimulacion(null);
      return false;
    }
  };

  const handleCrear = async () => {
    if (!simulacion) return;

    try {
      await crearLiquidacion({ datosLiquidacion: simulacion });
      setSimulacion(null);
      refetchRecords();
      showToast("Liquidación creada exitosamente.", "success");
    } catch {
      // toast automático
    }
  };

  // ── Render ──

  return (
    <Layout pageTitle="Liquidaciones">
      <Stack gap="8">
        {/* ──────── SECCIÓN: CÁLCULO ──────── */}
        <Form<SimularFormValues>
          onSubmit={handleSimular}
          defaultValues={{
            idColaborador: "",
            causa: "",
            fechaTerminacion: "",
            realizo_preaviso: "false",
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
                <Card.Title>Calcular liquidación</Card.Title>
                <Card.Description>
                  Seleccione el colaborador, la causa de terminación y la fecha
                  para simular el cálculo de liquidación laboral.
                </Card.Description>
              </Card.Header>

              <Card.Body>
                <Stack gap="4">
                  <InputField
                    fieldType="select"
                    name="idColaborador"
                    label="Colaborador"
                    required
                    disableSelectPortal
                    options={options}
                    placeholder={
                      employeesLoading
                        ? "Cargando colaboradores..."
                        : options.length === 0
                          ? "Sin colaboradores disponibles"
                          : "Seleccione un colaborador"
                    }
                    selectRootProps={{
                      disabled: employeesLoading || options.length === 0,
                    }}
                    rules={{
                      validate: (value: any) =>
                        value && Number(value) > 0
                          ? true
                          : "Seleccione un colaborador.",
                    }}
                  />

                  <InputField
                    fieldType="select"
                    name="causa"
                    label="Causa de liquidación"
                    required
                    disableSelectPortal
                    options={causasOptions}
                    placeholder={
                      causasLoading
                        ? "Cargando causas..."
                        : causasOptions.length === 0
                          ? "Sin causas disponibles"
                          : "Seleccione la causa"
                    }
                    selectRootProps={{
                      disabled: causasLoading || causasOptions.length === 0,
                    }}
                  />

                  <SimpleGrid columns={2} gap="3">
                    <InputField
                      fieldType="date"
                      name="fechaTerminacion"
                      label="Fecha de terminación"
                      required
                    />
                    <InputField
                      fieldType="select"
                      name="realizo_preaviso"
                      label="¿Realizó preaviso?"
                      disableSelectPortal
                      required
                      options={[
                        { label: "No", value: "false" },
                        { label: "Sí", value: "true" },
                      ]}
                    />
                  </SimpleGrid>
                </Stack>
              </Card.Body>

              <Card.Footer justifyContent="flex-end" gap="3">
                <Button
                  type="submit"
                  colorPalette="blue"
                  variant="outline"
                  loading={isSimulating}
                  disabled={employeesLoading || causasLoading || options.length === 0 || causasOptions.length === 0 || isSimulating}
                >
                  Simular cálculo
                </Button>

                {simulacion && (
                  <Button
                    colorPalette="green"
                    loading={isCreating}
                    disabled={isCreating}
                    onClick={handleCrear}
                  >
                    Crear liquidación
                  </Button>
                )}
              </Card.Footer>
            </Card.Root>

            {/* ── Panel derecho: Resultados de simulación ── */}
            <Stack flex="1" gap="4" w="full">
              {isSimulating ? (
                <Stack align="center" py="10" gap="3">
                  <Spinner size="lg" />
                  <Text color="fg.muted">Calculando liquidación…</Text>
                </Stack>
              ) : simulacion ? (
                <Stack gap="4">
                  {/* Info colaborador */}
                  <Card.Root>
                    <Card.Body>
                      <SimpleGrid columns={{ base: 2, md: 4 }} gap="4">
                        <Box>
                          <Text textStyle="xs" color="fg.muted">Colaborador</Text>
                          <Text fontWeight="semibold">{simulacion.colaborador.nombre}</Text>
                        </Box>
                        <Box>
                          <Text textStyle="xs" color="fg.muted">Causa</Text>
                          <Badge
                            colorPalette={
                              simulacion.causa === "Renuncia"
                                ? "yellow"
                                : simulacion.causa === "Despido con responsabilidad"
                                  ? "red"
                                  : "gray"
                            }
                            variant="subtle"
                          >
                            {simulacion.causa}
                          </Badge>
                        </Box>
                        <Box>
                          <Text textStyle="xs" color="fg.muted">Antigüedad</Text>
                          <Text fontWeight="semibold">
                            {simulacion.antiguedad.anios}a {simulacion.antiguedad.meses}m
                          </Text>
                        </Box>
                        <Box>
                          <Text textStyle="xs" color="fg.muted">Total liquidación</Text>
                          <Heading size="md" color="green.600">
                            {formatCRC(simulacion.totales.totalBruto)}
                          </Heading>
                        </Box>
                      </SimpleGrid>
                    </Card.Body>
                  </Card.Root>

                  {/* Tabla desglose */}
                  <Card.Root>
                    <Card.Header>
                      <Card.Title>Desglose de componentes</Card.Title>
                    </Card.Header>
                    <Card.Body p="0">
                      <Table.Root size="sm" variant="outline">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>Componente</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">Monto</Table.ColumnHeader>
                            <Table.ColumnHeader>Detalle</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          <Table.Row>
                            <Table.Cell>Salario diario</Table.Cell>
                            <Table.Cell textAlign="right">
                              <Text fontWeight="semibold">
                                {formatCRC(simulacion.componentes.salarioDiario.valor)}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text textStyle="xs" color="fg.muted">
                                {simulacion.componentes.salarioDiario.origen}
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                          <Table.Row>
                            <Table.Cell>Aguinaldo proporcional</Table.Cell>
                            <Table.Cell textAlign="right">
                              <Text fontWeight="bold" color="green.600">
                                {formatCRC(simulacion.componentes.aguinaldoProporcional.valor)}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text textStyle="xs" color="fg.muted">
                                {simulacion.componentes.aguinaldoProporcional.detalles?.mesesIncluidos ?? 0} meses
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                          <Table.Row>
                            <Table.Cell>Vacaciones proporcionales</Table.Cell>
                            <Table.Cell textAlign="right">
                              <Text fontWeight="bold" color="green.600">
                                {formatCRC(simulacion.componentes.vacacionesProporcionales.valor)}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text textStyle="xs" color="fg.muted">
                                {simulacion.componentes.vacacionesProporcionales.diasPendientes} días pendientes
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                          <Table.Row>
                            <Table.Cell>Cesantía</Table.Cell>
                            <Table.Cell textAlign="right">
                              <Text fontWeight="bold" color="green.600">
                                {formatCRC(simulacion.componentes.cesantia.valor)}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text textStyle="xs" color="fg.muted">
                                {simulacion.componentes.cesantia.diasCalculados} días
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                          <Table.Row>
                            <Table.Cell>Preaviso</Table.Cell>
                            <Table.Cell textAlign="right">
                              <Text fontWeight="bold" color="green.600">
                                {formatCRC(simulacion.componentes.preaviso.valor)}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text textStyle="xs" color="fg.muted">
                                {simulacion.componentes.preaviso.diasCalculados} días
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                          <Table.Row bg="gray.50">
                            <Table.Cell>
                              <Text fontWeight="bold">TOTAL</Text>
                            </Table.Cell>
                            <Table.Cell textAlign="right">
                              <Heading size="md" color="green.600">
                                {formatCRC(simulacion.totales.totalBruto)}
                              </Heading>
                            </Table.Cell>
                            <Table.Cell />
                          </Table.Row>
                        </Table.Body>
                      </Table.Root>
                    </Card.Body>
                  </Card.Root>

                  {/* Advertencias */}
                  {simulacion.validaciones.advertencias.length > 0 && (
                    <Card.Root borderColor="yellow.300" borderWidth="1px">
                      <Card.Body>
                        <Stack gap="1">
                          {simulacion.validaciones.advertencias.map((adv: string, i: number) => (
                            <Text key={i} textStyle="sm" color="yellow.700">
                              ⚠ {adv}
                            </Text>
                          ))}
                        </Stack>
                      </Card.Body>
                    </Card.Root>
                  )}
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
                      <FiScissors />
                    </EmptyState.Indicator>
                    <EmptyState.Title>
                      Simule el cálculo de liquidación
                    </EmptyState.Title>
                    <EmptyState.Description>
                      Seleccione un colaborador, la causa de terminación y la
                      fecha, luego presione &quot;Simular cálculo&quot; para
                      obtener una vista previa de los montos.
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Stack>
          </Stack>
        </Form>

        <Separator />

        {/* ──────── SECCIÓN: REGISTROS EXISTENTES ──────── */}
        <Card.Root>
          <Card.Header>
            <Box>
              <Card.Title>Liquidaciones registradas</Card.Title>
              <Card.Description>
                Registros de liquidaciones creadas previamente.
              </Card.Description>
            </Box>
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
                    <Table.ColumnHeader>Colaborador</Table.ColumnHeader>
                    <Table.ColumnHeader>Causa</Table.ColumnHeader>
                    <Table.ColumnHeader>Fecha término</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">Monto total</Table.ColumnHeader>
                    <Table.ColumnHeader>Fecha aprobación</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {existingRecords.map((record) => (
                    <Table.Row key={record.id_caso_termina}>
                      <Table.Cell>{record.colaborador}</Table.Cell>
                      <Table.Cell>
                        <Badge
                          colorPalette={
                            record.causa === "Renuncia"
                              ? "yellow"
                              : record.causa?.includes("con")
                                ? "red"
                                : "gray"
                          }
                          variant="subtle"
                        >
                          {record.causa}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>{formatDate(record.fechaTerminacion)}</Table.Cell>
                      <Table.Cell textAlign="right">
                        <Text fontWeight="semibold" color="green.600">
                          {formatCRC(record.montoTotal)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>{formatDate(record.fechaAprobacion)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            ) : (
              <EmptyState.Root py="10">
                <EmptyState.Content>
                  <EmptyState.Title>Sin registros</EmptyState.Title>
                  <EmptyState.Description>
                    No hay liquidaciones registradas. Utilice la sección superior
                    para calcular y crear registros.
                  </EmptyState.Description>
                </EmptyState.Content>
              </EmptyState.Root>
            )}
          </Card.Body>
        </Card.Root>
      </Stack>
    </Layout>
  );
};
