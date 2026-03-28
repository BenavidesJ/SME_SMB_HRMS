/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Badge,
  Box,
  Button,
  Card,
  EmptyState,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { FiFilePlus, FiScissors } from "react-icons/fi";
import { Layout } from "../../../components/layout";
import { Form } from "../../../components/forms/Form/Form";
import {
  InputField,
  type SelectOption,
} from "../../../components/forms/InputField/InputField";
import { Modal } from "../../../components/general";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { toTitleCase, formatCRC, formatDateUiCompact } from "../../../utils";
import { showToast } from "../../../services/toast/toastService";
import type { EmployeeRow } from "../../../types";

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

function getCausaBadgeColor(causa: string | null | undefined) {
  const normalized = String(causa ?? "").trim().toLowerCase();
  if (normalized === "renuncia") return "yellow";
  if (normalized.includes("con responsabilidad")) return "red";
  return "gray";
}

export const Liquidaciones = () => {
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

  const {
    mutate: simularCalculo,
    isLoading: isSimulating,
  } = useApiMutation<
    { idColaborador: number; causa: string; fechaTerminacion: string; realizo_preaviso: boolean },
    any
  >({ url: "liquidaciones/simular", method: "POST" });

  const [simulacion, setSimulacion] = useState<SimulacionData | null>(null);

  const {
    mutate: crearLiquidacion,
    isLoading: isCreating,
  } = useApiMutation<{ datosLiquidacion: any }, any>({
    url: "liquidaciones",
    method: "POST",
  });

  const {
    data: existingRecords = [],
    isLoading: loadingRecords,
    refetch: refetchRecords,
  } = useApiQuery<LiquidacionRegistro[]>({ url: "liquidaciones" });

  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
      await refetchRecords();
      showToast("Liquidación creada exitosamente.", "success");
    } catch {
      // toast automático
    }
  };

  const handleStartCreate = () => {
    setShowForm((prev) => {
      const next = !prev;
      if (!next) {
        setSimulacion(null);
      }
      return next;
    });
  };

  return (
    <Layout pageTitle="Liquidaciones">
      <Stack gap="6">
        <Button
          colorPalette="blue"
          alignSelf="flex-start"
          onClick={handleStartCreate}
        >
          <FiFilePlus />
          {showForm ? " Cerrar formulario" : " Crear liquidación"}
        </Button>

        <Modal
          title="Nueva liquidación"
          isOpen={showForm}
          size="full"
          onOpenChange={(e) => {
            setShowForm(e.open);
            if (!e.open) {
              setSimulacion(null);
            }
          }}
          content={
            showForm ? (
              <Form<SimularFormValues>
                key={simulacion ? `liquidacion-${simulacion.colaborador.id}` : "liquidacion-create"}
                onSubmit={handleSimular}
                defaultValues={{
                  idColaborador: "",
                  causa: "",
                  fechaTerminacion: "",
                  realizo_preaviso: "false",
                }}
              >
                <Stack gap="6">
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

                  <Stack direction="row" justifyContent="flex-end" gap="3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setSimulacion(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      colorPalette="blue"
                      variant="outline"
                      loading={isSimulating}
                      disabled={
                        employeesLoading
                        || causasLoading
                        || options.length === 0
                        || causasOptions.length === 0
                        || isSimulating
                      }
                    >
                      Pre cálculo
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
                  </Stack>

                  {isSimulating ? (
                    <Stack align="center" py="10" gap="3">
                      <Spinner size="lg" />
                      <Text color="fg.muted">Ejecutando pre cálculo…</Text>
                    </Stack>
                  ) : simulacion ? (
                    <Stack gap="4">
                      <Card.Root>
                        <Card.Body>
                          <SimpleGrid columns={{ base: 2, md: 4 }} gap="4">
                            <Box>
                              <Text textStyle="xs" color="fg.muted">Colaborador</Text>
                              <Text fontWeight="semibold">{simulacion.colaborador.nombre}</Text>
                            </Box>
                            <Box>
                              <Text textStyle="xs" color="fg.muted">Causa</Text>
                              <Badge colorPalette={getCausaBadgeColor(simulacion.causa)} variant="subtle">
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
                              <Table.Row>
                                <Table.Cell>Salario pendiente</Table.Cell>
                                <Table.Cell textAlign="right">
                                  <Text fontWeight="bold" color="green.600">
                                    {formatCRC(simulacion.componentes.salarioPendiente.valor)}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>
                                  <Text textStyle="xs" color="fg.muted">
                                    {simulacion.componentes.salarioPendiente.diasPendientes} días
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
                  ) : null}
                </Stack>
              </Form>
            ) : null
          }
        />

        {loadingRecords ? (
          <Spinner alignSelf="center" size="lg" />
        ) : existingRecords.length === 0 ? (
          <EmptyState.Root
            colorPalette="blue"
            h="400px"
            border="0.15rem dashed"
            borderColor="blue.600"
            alignContent="center"
            mt="1rem"
          >
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiScissors />
              </EmptyState.Indicator>
              <Stack textAlign="center" gap="2">
                <EmptyState.Title>
                  Aún no existen liquidaciones registradas.
                </EmptyState.Title>
                <EmptyState.Description>
                  Empieza creando una liquidación con pre cálculo previo.
                </EmptyState.Description>
              </Stack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 2, "2xl": 3 }} gap="6">
            {existingRecords.map((record) => (
              <Card.Root
                key={record.id_caso_termina}
                minW="0"
                minH="100%"
                transition="transform 150ms ease"
                _hover={{ transform: "scale(1.01)" }}
              >
                <Card.Header>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap="3">
                    <Card.Title>{record.colaborador}</Card.Title>
                    <Badge colorPalette={getCausaBadgeColor(record.causa)} flexShrink={0}>
                      {record.causa}
                    </Badge>
                  </Stack>
                </Card.Header>
                <Card.Body>
                  <Stack gap="3">
                    <Stack gap="0">
                      <Text textStyle="sm" color="fg.muted">
                        Fecha de terminación
                      </Text>
                      <Text fontWeight="medium">{formatDateUiCompact(record.fechaTerminacion)}</Text>
                    </Stack>
                    <Stack gap="0">
                      <Text textStyle="sm" color="fg.muted">
                        Fecha de aprobación
                      </Text>
                      <Text fontWeight="medium">{formatDateUiCompact(record.fechaAprobacion)}</Text>
                    </Stack>
                    <Stack gap="0">
                      <Text textStyle="sm" color="fg.muted">
                        Monto total
                      </Text>
                      <Text fontWeight="medium" color="green.600">
                        {formatCRC(record.montoTotal)}
                      </Text>
                    </Stack>
                    <Stack gap="0">
                      <Text textStyle="sm" color="fg.muted">
                        Aprobador
                      </Text>
                      <Text fontWeight="medium">#{record.aprobador}</Text>
                    </Stack>
                  </Stack>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Layout>
  );
};
