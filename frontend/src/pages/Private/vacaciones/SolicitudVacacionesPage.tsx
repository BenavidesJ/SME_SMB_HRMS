import {
  Alert,
  Badge,
  Box,
  HStack,
  Select,
  SimpleGrid,
  Stack,
  Text,
  createListCollection,
  Wrap,
  Button,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { Form, InputField } from "../../../components/forms";
import { Modal } from "../../../components/general";
import { Button as AppButton } from "../../../components/general/button/Button";
import { DataTable } from "../../../components/general/table/DataTable";
import { SortHeader, type SortDir } from "../../../components/general/table/SortHeader";
import type { DataTableActionColumn, DataTableColumn } from "../../../components/general/table/types";
import { Layout } from "../../../components/layout";
import { useAuth } from "../../../context/AuthContext";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { MonthPickerBase } from "../../../components/forms/InputField/fields/MonthPickerFieldVariant";
import { YearPickerBase } from "../../../components/forms/InputField/fields/YearPickerFieldVariant";
import { showToast } from "../../../services/toast/toastService";
import type { Contrato, EmployeeRow } from "../../../types";
import { formatDateUiCompact, getCostaRicaTodayDate, parseUiDateSafe, toTitleCase } from "../../../utils";
import { ADMIN_REQUEST_STATUS_ORDER, normalizeRequestStatus } from "../../../utils/requestStatus";
import type {
  CreateVacacionFormValues,
  VacacionCreateResponse,
  VacacionListItem,
  VacacionPayload,
  VacacionSaldoData,
} from "./types";
import { DateRangeField } from "../../../components/forms/InputField/fields";
import { FiEye } from "react-icons/fi";

type SortField = "id" | "fecha_inicio" | "fecha_fin" | "dias_solicitados" | "estado";

const getDateParts = (value?: string | null) => {
  if (!value) return { month: "", year: "" };

  const normalized = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) {
    return {
      month: normalized.slice(5, 7),
      year: normalized.slice(0, 4),
    };
  }

  const parsed = parseUiDateSafe(normalized);
  if (!parsed) return { month: "", year: "" };

  return {
    month: String(parsed.getMonth() + 1).padStart(2, "0"),
    year: String(parsed.getFullYear()),
  };
};

const matchesMonthYear = (value: string | null | undefined, month: string, year: string) => {
  const { month: valueMonth, year: valueYear } = getDateParts(value);
  if (month && valueMonth !== month) return false;
  if (year && valueYear !== year) return false;
  return true;
};

const toDateSortValue = (value?: string | null) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = parseUiDateSafe(value);
  return parsed ? parsed.getTime() : Number.NEGATIVE_INFINITY;
};

const getDurationLabel = (startDateRaw: string, endDateRaw: string) => {
  const MS_IN_DAY = 86_400_000;
  const startDate = parseUiDateSafe(startDateRaw);
  const endDate = parseUiDateSafe(endDateRaw);

  if (!startDate || !endDate) return "Duración desconocida";

  const diffDays = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / MS_IN_DAY));
  const totalDays = diffDays + 1;

  return `${totalDays} ${totalDays === 1 ? "día" : "días"}`;
};

const estadoBadgeProps = (estado?: string) => {
  switch (normalizeRequestStatus(estado)) {
    case "PENDIENTE":
      return { colorPalette: "yellow", variant: "subtle" as const };
    case "APROBADO":
      return { colorPalette: "blue", variant: "subtle" as const };
    case "CANCELADO":
      return { colorPalette: "gray", variant: "subtle" as const };
    case "RECHAZADO":
      return { colorPalette: "red", variant: "subtle" as const };
    default:
      return { colorPalette: "gray", variant: "subtle" as const };
  }
};

const getStatusValue = (item: VacacionListItem) => normalizeRequestStatus(item.estadoSolicitudVacaciones?.estado ?? "");

const getSkippedDatesDescription = (item: VacacionListItem) => {
  if (!item.dias_skipped_detalle?.length) return "Ninguno";

  return item.dias_skipped_detalle
    .map((skip) => `${formatDateUiCompact(skip.date)} (${toTitleCase(skip.reason)})`)
    .join(", ");
};


export const SolicitudVacacionesPage = () => {
  const { user } = useAuth();
  const userID = user?.id;
  const todayInCostaRica = useMemo(() => getCostaRicaTodayDate(), []);
  const [openModal, setOpenModal] = useState(false);

  const {
    data: vacacionesResponse = [],
    isLoading: isLoadingVacaciones,
    refetch: refetchMyVacaciones,
  } = useApiQuery<VacacionListItem[]>({
    url: `vacaciones/colaborador/${userID}`,
    enabled: Boolean(userID),
  });

  const {
    data: saldoVacaciones,
    isLoading: isLoadingSaldoVacaciones,
  } = useApiQuery<VacacionSaldoData>({
    url: userID ? `vacaciones/saldo/${userID}` : "",
    enabled: Boolean(userID),
  });

  const { data: employees = [], isLoading: isLoadingEmployees } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });
  const { data: myContracts = [] } = useApiQuery<Contrato[]>({
    url: userID ? `empleados/${userID}/contratos` : "",
    enabled: Boolean(userID),
  });

  const jefeDirectoId = useMemo(() => {
    const activeContracts = myContracts.filter((contract) => String(contract.estado ?? "").toUpperCase() === "ACTIVO");
    const latestContract = (activeContracts.length ? activeContracts : myContracts)
      .slice()
      .sort((a, b) => String(b.fecha_inicio ?? "").localeCompare(String(a.fecha_inicio ?? "")))[0];

    return latestContract?.id_jefe_directo ? Number(latestContract.id_jefe_directo) : null;
  }, [myContracts]);

  const approverOptions = useMemo(() => {
    if (!jefeDirectoId) return [];

    const manager = (employees ?? []).find((colaborador) => Number(colaborador.id) === Number(jefeDirectoId));
    if (!manager) {
      return [{ label: `Colaborador ${jefeDirectoId}`, value: String(jefeDirectoId) }];
    }

    const baseName = [manager.nombre, manager.primer_apellido, manager.segundo_apellido]
      .filter(Boolean)
      .join(" ")
      .trim();
    const displayName = baseName ? toTitleCase(baseName) : `Colaborador ${jefeDirectoId}`;
    return [{ label: displayName, value: String(jefeDirectoId) }];
  }, [employees, jefeDirectoId]);

  const availableBalance = useMemo(() => {
    if (!userID || isLoadingSaldoVacaciones) return null;
    return Number(saldoVacaciones?.dias_disponibles ?? 0);
  }, [userID, isLoadingSaldoVacaciones, saldoVacaciones]);

  const hasNoBalance = availableBalance !== null && availableBalance <= 0;

  const defaultApproverId = useMemo(() => approverOptions[0]?.value ?? "", [approverOptions]);
  const formKey = useMemo(() => `vacaciones-form-${defaultApproverId}`, [defaultApproverId]);
  const pageSize = 10;

  const [estadoFilter, setEstadoFilter] = useState("");
  const [inicioMonthFilter, setInicioMonthFilter] = useState("");
  const [inicioYearFilter, setInicioYearFilter] = useState("");
  const [finMonthFilter, setFinMonthFilter] = useState("");
  const [finYearFilter, setFinYearFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "fecha_inicio",
    dir: "desc",
  });
  const [detailItem, setDetailItem] = useState<VacacionListItem | null>(null);

  const { mutate: createVacacion, isLoading: isSubmitting } = useApiMutation<VacacionPayload, VacacionCreateResponse>({
    url: "/vacaciones",
    method: "POST",
  });

  const handleCreateVacacion = async (formValues: CreateVacacionFormValues) => {
    if (!userID) {
      console.error("No se pudo determinar el colaborador autenticado");
      return false;
    }

    const approverId = Number(formValues.id_aprobador);
    const expectedApproverId = Number(jefeDirectoId);

    if (!Number.isFinite(approverId) || approverId <= 0) {
      showToast("Seleccione un aprobador válido.", "error", "Solicitud de vacaciones");
      return false;
    }

    if (!Number.isFinite(expectedApproverId) || expectedApproverId <= 0) {
      showToast("No tienes un jefe directo asignado en tu contrato activo.", "error", "Solicitud de vacaciones");
      return false;
    }

    if (approverId !== expectedApproverId) {
      showToast("El aprobador debe ser tu jefe directo.", "error", "Solicitud de vacaciones");
      return false;
    }

    const payload: VacacionPayload = {
      id_colaborador: Number(userID),
      id_aprobador: expectedApproverId,
      fecha_inicio: formValues.fecha_inicio,
      fecha_fin: formValues.fecha_fin,
      observaciones: formValues.observaciones,
    };

    try {
      const result = await createVacacion(payload);

      if (result?.meta_engine?.chargeableDays !== undefined) {
        showToast(
          `Esta solicitud descuenta ${result.meta_engine.chargeableDays} ${result.meta_engine.chargeableDays === 1 ? "día" : "días"} del saldo.`,
          "info",
          "Cálculo de vacaciones",
        );
      }

      if (Array.isArray(result?.warnings)) {
        result.warnings.forEach((warning, index) => {
          if (!warning) return;
          showToast(warning, "warning", index === 0 ? "Avisos del periodo" : undefined);
        });
      }

      await refetchMyVacaciones();
      setOpenModal(false);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const estadoCollection = useMemo(
    () =>
      createListCollection({
        items: ADMIN_REQUEST_STATUS_ORDER.map((status) => ({
          label: toTitleCase(status.toLowerCase()),
          value: status,
        })),
      }),
    [],
  );

  const handleSortChange = (field: SortField) => {
    setPage(1);
    setSort((currentSort) => {
      if (currentSort.field === field) {
        return {
          field,
          dir: currentSort.dir === "asc" ? "desc" : "asc",
        };
      }

      return {
        field,
        dir: "desc",
      };
    });
  };

  const filteredVacaciones = useMemo(
    () =>
      vacacionesResponse.filter((item) => {
        if (estadoFilter && getStatusValue(item) !== estadoFilter) return false;
        if (!matchesMonthYear(item.fecha_inicio, inicioMonthFilter, inicioYearFilter)) return false;
        if (!matchesMonthYear(item.fecha_fin, finMonthFilter, finYearFilter)) return false;
        return true;
      }),
    [estadoFilter, finMonthFilter, finYearFilter, inicioMonthFilter, inicioYearFilter, vacacionesResponse],
  );

  const sortedVacaciones = useMemo(() => {
    const direction = sort.dir === "asc" ? 1 : -1;

    return [...filteredVacaciones].sort((left, right) => {
      if (sort.field === "id") {
        const value = (left.id_solicitud_vacaciones - right.id_solicitud_vacaciones) * direction;
        return value === 0 ? right.id_solicitud_vacaciones - left.id_solicitud_vacaciones : value;
      }

      if (sort.field === "fecha_inicio") {
        const value = (toDateSortValue(left.fecha_inicio) - toDateSortValue(right.fecha_inicio)) * direction;
        return value === 0 ? right.id_solicitud_vacaciones - left.id_solicitud_vacaciones : value;
      }

      if (sort.field === "fecha_fin") {
        const value = (toDateSortValue(left.fecha_fin) - toDateSortValue(right.fecha_fin)) * direction;
        return value === 0 ? right.id_solicitud_vacaciones - left.id_solicitud_vacaciones : value;
      }

      if (sort.field === "dias_solicitados") {
        const leftDays = Number(left.dias_solicitados ?? 0);
        const rightDays = Number(right.dias_solicitados ?? 0);
        const value = (leftDays - rightDays) * direction;
        return value === 0 ? right.id_solicitud_vacaciones - left.id_solicitud_vacaciones : value;
      }

      const statusValue = getStatusValue(left).localeCompare(getStatusValue(right), "es", { sensitivity: "base" }) * direction;
      return statusValue === 0 ? right.id_solicitud_vacaciones - left.id_solicitud_vacaciones : statusValue;
    });
  }, [filteredVacaciones, sort]);

  useEffect(() => {
    setPage(1);
  }, [estadoFilter, inicioMonthFilter, inicioYearFilter, finMonthFilter, finYearFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedVacaciones.length / pageSize));

  useEffect(() => {
    setPage((currentPage) => (currentPage > totalPages ? totalPages : currentPage));
  }, [totalPages]);

  const paginatedVacaciones = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedVacaciones.slice(start, start + pageSize);
  }, [page, sortedVacaciones]);

  const columns = useMemo<DataTableColumn<VacacionListItem>[]>(
    () => [
      {
        id: "id",
        header: (
          <SortHeader
            label="Solicitud"
            field="id"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "130px",
        cell: (item) => `#${item.id_solicitud_vacaciones}`,
      },
      {
        id: "fecha_inicio",
        header: (
          <SortHeader
            label="Fecha inicio"
            field="fecha_inicio"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "180px",
        cell: (item) => formatDateUiCompact(item.fecha_inicio),
      },
      {
        id: "fecha_fin",
        header: (
          <SortHeader
            label="Fecha fin"
            field="fecha_fin"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "180px",
        cell: (item) => formatDateUiCompact(item.fecha_fin),
      },
      {
        id: "duracion",
        header: "Duración",
        minW: "150px",
        cell: (item) => getDurationLabel(item.fecha_inicio, item.fecha_fin),
      },
      {
        id: "dias_solicitados",
        header: (
          <SortHeader
            label="Días solicitados"
            field="dias_solicitados"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "160px",
        textAlign: "left",
        cell: (item) => item.dias_solicitados ?? "0",
      },
      {
        id: "estado",
        header: (
          <SortHeader
            label="Estado"
            field="estado"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "140px",
        cell: (item) => {
          const estado = getStatusValue(item) || "DESCONOCIDO";
          return (
            <Badge {...estadoBadgeProps(estado)}>
              {toTitleCase(estado.toLowerCase())}
            </Badge>
          );
        },
      },
    ],
    [sort.dir, sort.field],
  );

  const actionColumn = useMemo<DataTableActionColumn<VacacionListItem>>(
    () => ({
      header: "Acciones",
      sticky: true,
      textAlign: "left",
      cell: (item) => (
        <Button type="button" variant="ghost" size="xs" onClick={() => setDetailItem(item)}>
          <FiEye />
          Ver detalle
        </Button>
      ),
    }),
    [],
  );

  return (
    <Layout pageTitle="Solicitud de Vacaciones">
      <Stack gap="5" pb="6">
        <Box>
          <AppButton appearance="login" size="lg" onClick={() => setOpenModal(true)}>
            Crear Solicitud
          </AppButton>
        </Box>

        {Boolean(userID) && !isLoadingSaldoVacaciones && (
          hasNoBalance ? (
            <Alert.Root status="warning">
              <Alert.Indicator />
              <Alert.Title>En este momento no tienes saldo de vacaciones.</Alert.Title>
            </Alert.Root>
          ) : (
            <Alert.Root status="success">
              <Alert.Indicator />
              <Alert.Title>
                {availableBalance !== null && availableBalance > 0
                  && `Tienes saldo de ${availableBalance} ${availableBalance === 1 ? "día disponible" : "días disponibles"}.`}
              </Alert.Title>
            </Alert.Root>
          )
        )}

        <SimpleGrid columns={{ base: 1, md: 5 }} gap="4">
          <Select.Root
            collection={estadoCollection}
            value={estadoFilter ? [estadoFilter] : []}
            onValueChange={(event) => setEstadoFilter(event.value?.[0] ?? "")}
            size="sm"
          >
            <Select.HiddenSelect />
            <Select.Label>Estado</Select.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Todos" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.ClearTrigger />
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {estadoCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>

          <MonthPickerBase
            monthOnly
            value={inicioMonthFilter}
            onChange={setInicioMonthFilter}
            placeholder="Todos"
            label="Mes fecha inicio"
            clearable
          />

          <YearPickerBase
            value={inicioYearFilter}
            onChange={setInicioYearFilter}
            placeholder="Todos"
            label="Año fecha inicio"
            clearable
          />

          <MonthPickerBase
            monthOnly
            value={finMonthFilter}
            onChange={setFinMonthFilter}
            placeholder="Todos"
            label="Mes fecha fin"
            clearable
          />

          <YearPickerBase
            value={finYearFilter}
            onChange={setFinYearFilter}
            placeholder="Todos"
            label="Año fecha fin"
            clearable
          />
        </SimpleGrid>

        <DataTable<VacacionListItem>
          data={paginatedVacaciones}
          columns={columns}
          actionColumn={actionColumn}
          isDataLoading={isLoadingVacaciones}
          size="md"
          pagination={{
            enabled: true,
            page,
            pageSize,
            totalCount: sortedVacaciones.length,
            onPageChange: setPage,
          }}
        />
      </Stack>

      <Modal
        title="Crear Solicitud"
        isOpen={openModal}
        onOpenChange={(event) => setOpenModal(event.open)}
        size="lg"
        content={
          <Form
            key={formKey}
            onSubmit={handleCreateVacacion}
            resetOnSuccess
            defaultValues={{ id_aprobador: defaultApproverId }}
          >
            <Wrap maxW="600px">
              <InputField
                fieldType="select"
                label="Aprobador"
                name="id_aprobador"
                required
                disableSelectPortal
                placeholder={isLoadingEmployees ? "Cargando jefe directo..." : "Jefe directo no disponible"}
                options={approverOptions}
                selectRootProps={{ disabled: true }}
                rules={{ required: "El campo es obligatorio" }}
              />
              <DateRangeField
                startName="fecha_inicio"
                endName="fecha_fin"
                label="Período de vacaciones"
                required
                min={todayInCostaRica}
                startRules={{
                  validate: (value: string) => {
                    if (!value) return true;
                    return value >= todayInCostaRica || "La fecha de inicio no puede ser anterior a hoy.";
                  },
                }}
              />
              <InputField
                fieldType="text"
                label="Observaciones"
                name="observaciones"
                placeholder="Detalle adicional (opcional)"
                rules={{
                  setValueAs: (v) => (typeof v === "string" ? v.trim() || undefined : undefined),
                }}
                required={false}
              />
            </Wrap>

            <Box w={{ base: "100%", sm: "250px" }} mt={4}>
              <AppButton
                loading={isSubmitting}
                loadingText="Enviando"
                appearance="login"
                type="submit"
                size="lg"
                w="100%"
                disabled={!approverOptions.length || isLoadingSaldoVacaciones || hasNoBalance}
              >
                Registrar vacaciones
              </AppButton>
            </Box>
          </Form>
        }
      />

      <Modal
        title={detailItem ? `Detalle solicitud #${detailItem.id_solicitud_vacaciones}` : "Detalle de solicitud"}
        isOpen={Boolean(detailItem)}
        onOpenChange={(event) => {
          if (!event.open) setDetailItem(null);
        }}
        size="lg"
        content={
          detailItem ? (
            <Stack gap="3" fontSize="sm">
              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Estado:</Text>
                <Badge {...estadoBadgeProps(getStatusValue(detailItem))}>
                  {toTitleCase(getStatusValue(detailItem).toLowerCase() || "desconocido")}
                </Badge>
              </HStack>

              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Fecha inicio:</Text>
                <Text fontWeight="semibold">{formatDateUiCompact(detailItem.fecha_inicio)}</Text>
              </HStack>

              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Fecha fin:</Text>
                <Text fontWeight="semibold">{formatDateUiCompact(detailItem.fecha_fin)}</Text>
              </HStack>

              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Duración:</Text>
                <Text>{getDurationLabel(detailItem.fecha_inicio, detailItem.fecha_fin)}</Text>
              </HStack>

              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Días solicitados:</Text>
                <Text>{detailItem.dias_solicitados ?? "0"}</Text>
              </HStack>

              <HStack gap="2" wrap="wrap">
                <Text color="fg.muted">Días aprobados:</Text>
                <Text>{detailItem.dias_aprobados ?? "0"}</Text>
              </HStack>

              <Stack gap="1">
                <Text color="fg.muted">Días omitidos:</Text>
                <Text>{getSkippedDatesDescription(detailItem)}</Text>
              </Stack>

              {detailItem.saldo_vacaciones && (
                <HStack gap="2" wrap="wrap">
                  <Text color="fg.muted">Saldo al registrar:</Text>
                  <Text>
                    {detailItem.saldo_vacaciones.dias_ganados - detailItem.saldo_vacaciones.dias_tomados} días
                  </Text>
                </HStack>
              )}

              <Stack gap="1">
                <Text color="fg.muted">Observaciones:</Text>
                <Text>{detailItem.observaciones || "Sin observaciones"}</Text>
              </Stack>
            </Stack>
          ) : null
        }
      />
    </Layout>
  );
};