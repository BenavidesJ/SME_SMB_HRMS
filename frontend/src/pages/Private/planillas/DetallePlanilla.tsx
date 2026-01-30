/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useFormContext, useWatch } from "react-hook-form";
import { FiUser } from "react-icons/fi";
import { Layout } from "../../../components/layout";
import { Form } from "../../../components/forms/Form/Form";
import {
  InputField,
  type SelectOption,
} from "../../../components/forms/InputField/InputField";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { toTitleCase } from "../../../utils";
import { showToast } from "../../../services/toast/toastService";
import { useAuth } from "../../../context/AuthContext";
import type { EmployeeRow } from "../../../types";

type PayrollDetail = {
  id_detalle: number;
  id_periodo: number;
  id_colaborador: number;
  id_contrato: number;
  horas_ordinarias: number;
  horas_extra: number;
  horas_feriado: number;
  horas_nocturnas: number;
  bruto: number;
  deducciones: number;
  neto: number;
  generado_por: number;
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

type GenerateFormValues = {
  colaboradores: (string | number)[];
  fecha_inicio: string;
  fecha_fin: string;
};

const parsePayrollDetailsResponse = (
  value: unknown,
): PayrollDetailsResponse | null => {
  if (!value || typeof value !== "object") return null;

  if ("detalles" in value && Array.isArray((value as any).detalles)) {
    return value as PayrollDetailsResponse;
  }

  if ("data" in value) {
    return parsePayrollDetailsResponse((value as { data?: unknown }).data);
  }

  return null;
};

export const DetallePlanilla = () => {
  const { id } = useParams<{ id: string }>();
  const periodoId = Number(id);
  const periodoIdIsValid = Number.isInteger(periodoId) && periodoId > 0;
  const { user } = useAuth();

  const { data: employees = [], isLoading: employeesLoading } =
    useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const options = useMemo<SelectOption[]>(() => {
    return employees.map((emp) => ({
      label: toTitleCase(
        `${emp.nombre} ${emp.primer_apellido} ${emp.segundo_apellido}`.trim(),
      ),
      value: String(emp.id),
    }));
  }, [employees]);

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

  const {
    mutate: fetchPayrollDetails,
    isLoading: fetchingDetails,
  } = useApiMutation<PayrollDetailsPayload, PayrollDetailsResponse>({
    url: "planillas/detalle",
    method: "POST",
  });

  const {
    mutate: generatePayroll,
    isLoading: isGenerating,
  } = useApiMutation<
    PayrollDetailsPayload & {
      fecha_inicio: string;
      fecha_fin: string;
      generado_por: number;
    },
    void
  >({
    url: "planillas",
    method: "POST",
  });

  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [details, setDetails] = useState<PayrollDetailsResponse | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        maximumFractionDigits: 2,
      }),
    [],
  );

  const decimalFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-CR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const loadDetails = useCallback(
    async (collaboratorIds: number[], options: { silent?: boolean } = {}) => {
      if (!periodoIdIsValid || collaboratorIds.length === 0) {
        if (!options.silent && collaboratorIds.length === 0) {
          showToast(
            "No hay colaboradores disponibles para consultar.",
            "info",
          );
        }
        setDetails(null);
        return null;
      }

      try {
        const response = await fetchPayrollDetails({
          id_periodo: periodoId,
          colaboradores: collaboratorIds,
        });

        const payload = parsePayrollDetailsResponse(response);

        setDetails(payload);
        return payload;
      } catch (error) {
        console.error(error)
        if (!options.silent) {
          showToast(
            "No se logró consultar los detalles de planilla. Intente nuevamente.",
            "error",
          );
        }
        setDetails(null);
        return null;
      }
    },
    [fetchPayrollDetails, periodoId, periodoIdIsValid],
  );

  useEffect(() => {
    if (!periodoIdIsValid || !hasEmployees || initialFetchDone) return;
    setInitialFetchDone(true);
    setHasAttempted(true);
    loadDetails(allCollaboratorIds, { silent: true });
  }, [
    periodoIdIsValid,
    hasEmployees,
    initialFetchDone,
    allCollaboratorIds,
    loadDetails,
  ]);

  const handleGeneratePayroll = async (values: GenerateFormValues) => {
    setHasAttempted(true);

    if (!periodoIdIsValid) {
      showToast("El identificador del periodo es inválido.", "error");
      return false;
    }

    if (!user?.id) {
      showToast(
        "No se pudo identificar al usuario autenticado. Inicie sesión nuevamente.",
        "error",
      );
      return false;
    }

    const collaboratorIds = (values.colaboradores ?? [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (collaboratorIds.length === 0) {
      showToast("Seleccione al menos un colaborador.", "error");
      return false;
    }

    if (!values.fecha_inicio || !values.fecha_fin) {
      showToast("Debe indicar las fechas de inicio y fin del periodo.", "error");
      return false;
    }

    try {
      await generatePayroll({
        id_periodo: periodoId,
        colaboradores: collaboratorIds,
        fecha_inicio: values.fecha_inicio,
        fecha_fin: values.fecha_fin,
        generado_por: Number(user.id),
      });

      showToast("Planilla generada exitosamente.", "success");

      await loadDetails(allCollaboratorIds, { silent: false });
      return true;
    } catch (error) {
      console.log(error);
      showToast(
        "No se pudo generar la planilla. Verifique los datos e intente nuevamente.",
        "error",
      );
      return false;
    }
  };

  const detailList = details?.detalles ?? [];
  const hasDetails = detailList.length > 0;
  const shouldShowForm = !fetchingDetails && !hasDetails;

  const emptyStateTitle = hasAttempted
    ? "No se encontraron detalles"
    : "Consulta en progreso";
  const emptyStateDescription = hasAttempted
    ? "No existen registros de planilla para los colaboradores seleccionados en este periodo."
    : "Estamos consultando la información del periodo seleccionado.";

  const detailsSection = (
    <Stack flex="1" gap="4">
      {fetchingDetails ? (
        <Stack align="center" py="10" gap="3">
          <Spinner size="lg" />
          <Text color="fg.muted">Consultando detalle del periodo…</Text>
        </Stack>
      ) : hasDetails ? (
        <Stack gap="4">
          {detailList.map((detail) => {
            const fullName =
              collaboratorNameMap.get(detail.id_colaborador) ??
              `Colaborador #${detail.id_colaborador}`;

            return (
              <Card.Root
                key={detail.id_detalle}
                borderLeftWidth={6}
                style={{
                  borderLeftColor: "var(--chakra-colors-blue-500)",
                }}
              >
                <Card.Header>
                  <Card.Title>{fullName}</Card.Title>
                  <Card.Description>
                    Contrato #{detail.id_contrato} • Detalle #{detail.id_detalle}
                  </Card.Description>
                </Card.Header>

                <Card.Body>
                  <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="4">
                    <Stack gap="0">
                      <Text textStyle="xs" color="fg.muted">
                        Horas ordinarias
                      </Text>
                      <Text fontWeight="semibold">
                        {decimalFormatter.format(
                          Number(detail.horas_ordinarias ?? 0),
                        )}
                      </Text>
                    </Stack>
                    <Stack gap="0">
                      <Text textStyle="xs" color="fg.muted">
                        Horas extra
                      </Text>
                      <Text fontWeight="semibold">
                        {decimalFormatter.format(
                          Number(detail.horas_extra ?? 0),
                        )}
                      </Text>
                    </Stack>
                    <Stack gap="0">
                      <Text textStyle="xs" color="fg.muted">
                        Horas feriado
                      </Text>
                      <Text fontWeight="semibold">
                        {decimalFormatter.format(
                          Number(detail.horas_feriado ?? 0),
                        )}
                      </Text>
                    </Stack>
                    <Stack gap="0">
                      <Text textStyle="xs" color="fg.muted">
                        Horas nocturnas
                      </Text>
                      <Text fontWeight="semibold">
                        {decimalFormatter.format(
                          Number(detail.horas_nocturnas ?? 0),
                        )}
                      </Text>
                    </Stack>
                    <Stack gap="0">
                      <Text textStyle="xs" color="fg.muted">
                        Salario bruto
                      </Text>
                      <Text fontWeight="semibold">
                        {currencyFormatter.format(Number(detail.bruto ?? 0))}
                      </Text>
                    </Stack>
                    <Stack gap="0">
                      <Text textStyle="xs" color="fg.muted">
                        Salario neto
                      </Text>
                      <Text fontWeight="semibold">
                        {currencyFormatter.format(Number(detail.neto ?? 0))}
                      </Text>
                    </Stack>
                  </SimpleGrid>
                </Card.Body>

                <Card.Footer justifyContent="space-between">
                  <Badge variant="surface">
                    Generado por #{detail.generado_por}
                  </Badge>
                  <Badge colorPalette="red" variant="subtle">
                    Deducciones:{" "}
                    {currencyFormatter.format(Number(detail.deducciones ?? 0))}
                  </Badge>
                </Card.Footer>
              </Card.Root>
            );
          })}
        </Stack>
      ) : (
        <EmptyState.Root
          colorPalette="blue"
          border="0.15rem dashed"
          borderColor="blue.600"
          py="12"
        >
          <EmptyState.Content>
            <EmptyState.Title>{emptyStateTitle}</EmptyState.Title>
            <EmptyState.Description>
              {emptyStateDescription}
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      )}
    </Stack>
  );

  return (
    <Layout
      pageTitle={
        periodoIdIsValid
          ? `Detalle del periodo de planilla #${periodoId}`
          : "Detalle de periodo de planilla"
      }
    >
      <Stack gap="6">
        {shouldShowForm ? (
          <Stack
            direction={{ base: "column", xl: "row" }}
            align="flex-start"
            gap="6"
          >
            <Form<GenerateFormValues>
              onSubmit={handleGeneratePayroll}
              defaultValues={{
                colaboradores: defaultSelectedCollaborators,
                fecha_inicio: "",
                fecha_fin: "",
              }}
              resetOnSuccess
            >
              <Card.Root
                as="section"
                w={{ base: "full", xl: "320px" }}
                flexShrink={0}
              >
                <Card.Header>
                  <Card.Title>Generar detalle de planilla</Card.Title>
                  <Card.Description>
                    Calcula los montos del periodo seleccionado seleccionando
                    colaboradores y rango de fechas.
                  </Card.Description>
                </Card.Header>

                <Card.Body>
                  <Stack gap="4">
                    <Stack gap="0">
                      <Text textStyle="sm" color="fg.muted">
                        Periodo seleccionado
                      </Text>
                      <Heading size="sm">
                        {periodoIdIsValid ? `#${periodoId}` : "No disponible"}
                      </Heading>
                    </Stack>

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
                        validate: (value) =>
                          Array.isArray(value) && value.length > 0
                            ? true
                            : "Seleccione al menos un colaborador.",
                        setValueAs: (value) =>
                          Array.isArray(value) ? value : value ? [value] : [],
                      }}
                    />

                    <SelectedCollaboratorsBadges
                      collaboratorNameMap={collaboratorNameMap}
                    />

                    <InputField
                      fieldType="date"
                      name="fecha_inicio"
                      label="Fecha de inicio"
                      required
                    />
                    <InputField
                      fieldType="date"
                      name="fecha_fin"
                      label="Fecha de fin"
                      required
                    />
                  </Stack>
                </Card.Body>

                <Card.Footer justifyContent="flex-end">
                  <Button
                    type="submit"
                    colorPalette="blue"
                    loading={isGenerating}
                    disabled={
                      !periodoIdIsValid ||
                      employeesLoading ||
                      !hasEmployees ||
                      isGenerating
                    }
                  >
                    Generar planilla
                  </Button>
                </Card.Footer>
              </Card.Root>
            </Form>

            {detailsSection}
          </Stack>
        ) : (
          detailsSection
        )}
      </Stack>
    </Layout>
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
            key={value}
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