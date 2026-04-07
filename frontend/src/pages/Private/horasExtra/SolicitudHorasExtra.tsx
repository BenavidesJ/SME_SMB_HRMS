import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Wrap,
  createListCollection,
} from "@chakra-ui/react";
import { Layout } from "../../../components/layout";
import { Form, InputField } from "../../../components/forms";
import { Button as AppButton } from "../../../components/general/button/Button";
import { Modal } from "../../../components/general";
import { DataTable } from "../../../components/general/table/DataTable";
import { SortHeader, type SortDir } from "../../../components/general/table/SortHeader";
import type { DataTableActionColumn, DataTableColumn } from "../../../components/general/table/types";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useAuth } from "../../../context/AuthContext";
import { MonthPickerBase } from "../../../components/forms/InputField/fields/MonthPickerFieldVariant";
import { formatDateUiCompact, formatDateTimeUi, getCostaRicaTodayDate, parseUiDateSafe, toTitleCase } from "../../../utils";
import type { Contrato, EmployeeRow } from "../../../types";
import type { DataConsultaSolicitudes, SolicitudHoraExtra, TipoDia } from "../../../types/Overtime";
import { SolicitudDetalleModal } from "./components";
import { ADMIN_REQUEST_STATUS_ORDER, normalizeRequestStatus } from "../../../utils/requestStatus";
import { FiEye } from "react-icons/fi";

interface TipoJornadaCatalog {
  id: number;
  tipo: string;
  max_horas_diarias: number | string;
  max_horas_semanales: number | string;
}

interface TipoHxRequest {
  id_colaborador: number;
  id_aprobador: number;
  fecha_trabajo: string;
  horas_solicitadas: number;
}

type CreateRequestFormValues = {
  id_aprobador: string;
  fecha_trabajo: string;
  horas_solicitadas: string;
};

type SortField = "id" | "colaborador" | "fecha_trabajo" | "fecha_solicitud" | "horas" | "tipo_dia" | "estado";

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

const getMonthYearParts = (monthYearValue: string) => {
  if (!/^\d{4}-\d{2}$/.test(monthYearValue)) {
    return { month: "", year: "" };
  }

  return {
    year: monthYearValue.slice(0, 4),
    month: monthYearValue.slice(5, 7),
  };
};

const toDateSortValue = (value?: string | null) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = parseUiDateSafe(value);
  return parsed ? parsed.getTime() : Number.NEGATIVE_INFINITY;
};

const estadoBadgeProps = (estado: string) => {
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

const tipoDiaBadgeProps = (tipo: TipoDia | undefined) => {
  switch (tipo) {
    case "FERIADO":
      return { colorPalette: "orange", variant: "subtle" as const };
    case "DESCANSO":
      return { colorPalette: "purple", variant: "subtle" as const };
    case "LABORAL":
    default:
      return { colorPalette: "green", variant: "subtle" as const };
  }
};

const tipoDiaLabel: Record<NonNullable<TipoDia>, string> = {
  FERIADO: "Feriado",
  LABORAL: "Laboral",
  DESCANSO: "Descanso",
};

export const SolicitudHorasExtra = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const todayInCostaRica = useMemo(() => getCostaRicaTodayDate(), []);
  const [openModal, setOpenModal] = useState(false);
  const [detailItem, setDetailItem] = useState<SolicitudHoraExtra | null>(null);
  const [estadoFilter, setEstadoFilter] = useState("");
  const [trabajoMonthYearFilter, setTrabajoMonthYearFilter] = useState("");
  const [solicitudMonthYearFilter, setSolicitudMonthYearFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "fecha_solicitud",
    dir: "desc",
  });
  const pageSize = 10;

  const { data: tiposJornada = [] } = useApiQuery<TipoJornadaCatalog[]>({ url: "mantenimientos/tipos-jornada" });
  const { data: employees = [], isLoading: isLoadingEmployees } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });
  const { data: myContracts = [] } = useApiQuery<Contrato[]>({
    url: userId ? `empleados/${userId}/contratos` : "",
    enabled: Boolean(userId),
  });
  const {
    data: myRequestsResponse,
    isLoading: isLoadingRequests,
    refetch: refetchMyRequests,
  } = useApiQuery<DataConsultaSolicitudes>({
    url: userId ? `/horas-extra/solicitudes?id_colaborador=${userId}` : "",
    enabled: Boolean(userId),
  });

  const { mutate: createHxRequest, isLoading: isSubmitting } = useApiMutation<TipoHxRequest, void>({
    url: "/horas-extra/solicitud",
    method: "POST",
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

  const defaultApproverId = useMemo(() => approverOptions[0]?.value ?? "", [approverOptions]);
  const formKey = useMemo(() => `horas-extra-form-${defaultApproverId}`, [defaultApproverId]);

  const latestContract = useMemo(() => {
    const activeContracts = myContracts.filter((contract) => String(contract.estado ?? "").toUpperCase() === "ACTIVO");
    return (activeContracts.length ? activeContracts : myContracts)
      .slice()
      .sort((a, b) => String(b.fecha_inicio ?? "").localeCompare(String(a.fecha_inicio ?? "")))[0] ?? null;
  }, [myContracts]);

  const overtimeAvailability = useMemo(() => {
    if (!latestContract) {
      return {
        blocked: true,
        reason: "No se encontró un contrato para calcular el cupo de horas extra.",
        options: [] as Array<{ label: string; value: string }>,
      };
    }

    const jornadaTipo = String(latestContract.tipo_jornada ?? "").trim();
    if (!jornadaTipo) {
      return {
        blocked: true,
        reason: "El contrato activo no tiene tipo de jornada configurado.",
        options: [] as Array<{ label: string; value: string }>,
      };
    }

    const jornada = tiposJornada.find((item) => String(item.tipo ?? "").toUpperCase() === jornadaTipo.toUpperCase());
    if (!jornada) {
      return {
        blocked: true,
        reason: `No se pudo resolver la jornada "${jornadaTipo}" para calcular horas extra.`,
        options: [] as Array<{ label: string; value: string }>,
      };
    }

    const maxHorasDiarias = Number(jornada.max_horas_diarias);
    if (!Number.isFinite(maxHorasDiarias) || maxHorasDiarias <= 0) {
      return {
        blocked: true,
        reason: "La jornada tiene un máximo diario inválido para calcular horas extra.",
        options: [] as Array<{ label: string; value: string }>,
      };
    }

    const maxExtra = 12 - maxHorasDiarias;
    const maxExtraEntera = Math.floor(maxExtra);

    if (maxExtraEntera < 1) {
      return {
        blocked: true,
        reason: `Con una jornada de ${maxHorasDiarias} horas diarias no hay cupo disponible para horas extra.`,
        options: [] as Array<{ label: string; value: string }>,
      };
    }

    const options = Array.from({ length: maxExtraEntera }, (_, index) => {
      const hour = index + 1;
      return {
        label: `${hour} ${hour === 1 ? "hora" : "horas"}`,
        value: String(hour),
      };
    });

    return {
      blocked: false,
      reason: "",
      options,
    };
  }, [latestContract, tiposJornada]);

  const isOvertimeBlocked = overtimeAvailability.blocked;
  const overtimeHoursOptions = overtimeAvailability.options;
  const myRequests = useMemo(
    () => (myRequestsResponse && "grupos" in myRequestsResponse ? myRequestsResponse.grupos.flatMap((group) => group.items) : myRequestsResponse?.items ?? []),
    [myRequestsResponse],
  );

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

  const filteredRequests = useMemo(
    () => {
      const trabajoParts = getMonthYearParts(trabajoMonthYearFilter);
      const solicitudParts = getMonthYearParts(solicitudMonthYearFilter);

      return myRequests.filter((item) => {
        if (estadoFilter && normalizeRequestStatus(item.estado.estado) !== estadoFilter) return false;
        if (!matchesMonthYear(item.fecha_trabajo, trabajoParts.month, trabajoParts.year)) return false;
        if (!matchesMonthYear(item.fecha_solicitud, solicitudParts.month, solicitudParts.year)) return false;
        return true;
      });
    },
    [
      estadoFilter,
      myRequests,
      solicitudMonthYearFilter,
      trabajoMonthYearFilter,
    ],
  );

  const sortedRequests = useMemo(() => {
    const direction = sort.dir === "asc" ? 1 : -1;

    return [...filteredRequests].sort((left, right) => {
      if (sort.field === "id") {
        const value = (left.id_solicitud_hx - right.id_solicitud_hx) * direction;
        return value === 0 ? right.id_solicitud_hx - left.id_solicitud_hx : value;
      }

      if (sort.field === "colaborador") {
        const value = left.colaborador.nombre_completo.localeCompare(right.colaborador.nombre_completo, "es", { sensitivity: "base" }) * direction;
        return value === 0 ? right.id_solicitud_hx - left.id_solicitud_hx : value;
      }

      if (sort.field === "fecha_trabajo") {
        const value = (toDateSortValue(left.fecha_trabajo) - toDateSortValue(right.fecha_trabajo)) * direction;
        return value === 0 ? right.id_solicitud_hx - left.id_solicitud_hx : value;
      }

      if (sort.field === "fecha_solicitud") {
        const value = (toDateSortValue(left.fecha_solicitud) - toDateSortValue(right.fecha_solicitud)) * direction;
        return value === 0 ? right.id_solicitud_hx - left.id_solicitud_hx : value;
      }

      if (sort.field === "horas") {
        const value = (Number(left.horas_solicitadas) - Number(right.horas_solicitadas)) * direction;
        return value === 0 ? right.id_solicitud_hx - left.id_solicitud_hx : value;
      }

      if (sort.field === "tipo_dia") {
        const value = String(left.tipo_dia ?? "").localeCompare(String(right.tipo_dia ?? ""), "es", { sensitivity: "base" }) * direction;
        return value === 0 ? right.id_solicitud_hx - left.id_solicitud_hx : value;
      }

      const value = normalizeRequestStatus(left.estado.estado).localeCompare(normalizeRequestStatus(right.estado.estado), "es", { sensitivity: "base" }) * direction;
      return value === 0 ? right.id_solicitud_hx - left.id_solicitud_hx : value;
    });
  }, [filteredRequests, sort]);

  useEffect(() => {
    setPage(1);
  }, [estadoFilter, solicitudMonthYearFilter, trabajoMonthYearFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / pageSize));

  useEffect(() => {
    setPage((currentPage) => (currentPage > totalPages ? totalPages : currentPage));
  }, [totalPages]);

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRequests.slice(start, start + pageSize);
  }, [page, sortedRequests]);

  const columns = useMemo<DataTableColumn<SolicitudHoraExtra>[]>(
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
        cell: (item) => `#${item.id_solicitud_hx}`,
      },
      {
        id: "colaborador",
        header: (
          <SortHeader
            label="Colaborador"
            field="colaborador"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "220px",
        cell: (item) => item.colaborador.nombre_completo,
      },
      {
        id: "fecha_trabajo",
        header: (
          <SortHeader
            label="Fecha trabajo"
            field="fecha_trabajo"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "170px",
        cell: (item) => formatDateUiCompact(item.fecha_trabajo),
      },
      {
        id: "fecha_solicitud",
        header: (
          <SortHeader
            label="Fecha solicitud"
            field="fecha_solicitud"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "190px",
        cell: (item) => formatDateTimeUi(item.fecha_solicitud),
      },
      {
        id: "horas",
        header: (
          <SortHeader
            label="Horas"
            field="horas"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "100px",
        cell: (item) => item.horas_solicitadas,
      },
      {
        id: "tipo_dia",
        header: (
          <SortHeader
            label="Tipo de día"
            field="tipo_dia"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "100px",
        cell: (item) => {
          if (!item.tipo_dia) return "—";
          return (
            <Stack gap="1">
              <Badge w="90px" alignContent="center" {...tipoDiaBadgeProps(item.tipo_dia)}>{tipoDiaLabel[item.tipo_dia]}</Badge>
              {item.tipo_dia === "FERIADO" && item.nombre_feriado && (
                <Text fontSize="xs" color="fg.muted">{item.nombre_feriado}</Text>
              )}
            </Stack>
          );
        },
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
        minW: "100px",
        cell: (item) => (
          <Badge {...estadoBadgeProps(item.estado.estado)}>
            {toTitleCase(item.estado.estado.toLowerCase())}
          </Badge>
        ),
      },
    ],
    [sort.dir, sort.field],
  );

  const actionColumn = useMemo<DataTableActionColumn<SolicitudHoraExtra>>(
    () => ({
      header: "Acciones",
      sticky: true,
      textAlign: "left",
      cell: (item) => (
        <Button type="button" variant="subtle" colorPalette="blue" size="sm" onClick={() => setDetailItem(item)}>
          <FiEye />
          Ver detalle
        </Button>
      ),
    }),
    [],
  );

  const handleCreateRequest = async (solicitud: CreateRequestFormValues) => {
    const employeeId = user?.id;
    const approverId = Number(solicitud.id_aprobador);
    const requestedHours = Number(solicitud.horas_solicitadas);

    if (!Number.isFinite(approverId) || approverId <= 0) {
      return false;
    }

    if (isOvertimeBlocked || !Number.isFinite(requestedHours) || requestedHours <= 0) {
      return false;
    }

    try {
      const payload: TipoHxRequest = {
        fecha_trabajo: solicitud.fecha_trabajo,
        horas_solicitadas: requestedHours,
        id_colaborador: Number(employeeId),
        id_aprobador: approverId,
      };

      await createHxRequest(payload);
      await refetchMyRequests();
      setOpenModal(false);

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  return (
    <Layout pageTitle="Solicitudes de horas extra">
      <Stack gap="5" pb="6">
        <Box>
          <AppButton appearance="login" size="lg" onClick={() => setOpenModal(true)}>
            Crear Solicitud
          </AppButton>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
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
            value={trabajoMonthYearFilter}
            onChange={setTrabajoMonthYearFilter}
            placeholder="Todos"
            label="Fecha Trabajo"
            clearable
          />

          <MonthPickerBase
            value={solicitudMonthYearFilter}
            onChange={setSolicitudMonthYearFilter}
            placeholder="Todos"
            label="Fecha Solicitud"
            clearable
          />
        </SimpleGrid>

        <DataTable<SolicitudHoraExtra>
          data={paginatedRequests}
          columns={columns}
          actionColumn={actionColumn}
          isDataLoading={isLoadingRequests}
          size="md"
          pagination={{
            enabled: true,
            page,
            pageSize,
            totalCount: sortedRequests.length,
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
          <Form<CreateRequestFormValues>
            key={formKey}
            onSubmit={handleCreateRequest}
            resetOnSuccess
            defaultValues={{ id_aprobador: defaultApproverId, horas_solicitadas: "" }}
          >
            <Wrap maxW="600px">
              <InputField
                fieldType="select"
                label="Aprobador"
                name="id_aprobador"
                required
                disableSelectPortal
                placeholder={
                  isLoadingEmployees ? "Cargando jefe directo..." : "Jefe directo no disponible"
                }
                options={approverOptions}
                selectRootProps={{ disabled: true }}
                rules={{ required: "El campo es obligatorio" }}
              />
              <InputField
                fieldType="date"
                label="Fecha de realización"
                name="fecha_trabajo"
                required
                min={todayInCostaRica}
                rules={{
                  required: "El campo es obligatorio",
                  validate: (value) => {
                    const selectedDate = String(value ?? "");
                    if (!selectedDate) return true;
                    return selectedDate >= todayInCostaRica || "La fecha no puede ser anterior a hoy.";
                  },
                }}
              />
              {!isOvertimeBlocked && (
                <InputField
                  fieldType="select"
                  label="Cantidad de horas"
                  name="horas_solicitadas"
                  required
                  disableSelectPortal
                  placeholder={overtimeHoursOptions.length ? "Seleccione una opción" : "Sin opciones disponibles"}
                  options={overtimeHoursOptions}
                  rules={{ required: "El campo es obligatorio" }}
                  selectRootProps={{ disabled: overtimeHoursOptions.length === 0 }}
                />
              )}
            </Wrap>

            {isOvertimeBlocked && (
              <Alert.Root status="warning" mt={4}>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>No se puede registrar la solicitud</Alert.Title>
                  <Alert.Description>{overtimeAvailability.reason}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

            <Box w={{ base: "100%", sm: "250px" }} mt={4}>
              <AppButton
                loading={isSubmitting}
                loadingText="Enviando"
                appearance="login"
                type="submit"
                size="lg"
                w="100%"
                disabled={!approverOptions.length || isOvertimeBlocked}
              >
                Enviar solicitud
              </AppButton>
            </Box>
          </Form>
        }
      />

      <SolicitudDetalleModal
        item={detailItem}
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        canManageActions={false}
        tiposHoraExtra={[]}
        onApprove={() => undefined}
        onDecline={() => undefined}
        onChangeTipoHx={() => undefined}
        isSubmitting={false}
      />
    </Layout>
  );
};
