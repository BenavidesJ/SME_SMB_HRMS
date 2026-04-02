import {
  Badge,
  Box,
  Button,
  Select,
  SimpleGrid,
  Stack,
  Wrap,
  createListCollection,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { Form, InputField } from "../../../components/forms";
import { MonthPickerBase } from "../../../components/forms/InputField/fields/MonthPickerFieldVariant";
import { Modal } from "../../../components/general";
import { Button as AppButton } from "../../../components/general/button/Button";
import { DataTable } from "../../../components/general/table/DataTable";
import { SortHeader, type SortDir } from "../../../components/general/table/SortHeader";
import type { DataTableActionColumn, DataTableColumn } from "../../../components/general/table/types";
import { Layout } from "../../../components/layout";
import { useAuth } from "../../../context/AuthContext";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { showToast } from "../../../services/toast/toastService";
import type { Contrato, EmployeeRow } from "../../../types";
import { formatDateUiCompact, getCostaRicaTodayDate, parseUiDateSafe, toTitleCase } from "../../../utils";
import { ADMIN_REQUEST_STATUS_ORDER, normalizeRequestStatus } from "../../../utils/requestStatus";
import { FiEye } from "react-icons/fi";
import type {
  CreatePermisoFormValues,
  PermisoCreateResponse,
  PermisoListItem,
  PermisoPayload,
  PermisoTipo,
} from "./types";
import { DateRangeField } from "../../../components/forms/InputField/fields";
import { PermisoDetalleModal } from "./components/PermisoDetalleModal";

const PERMISO_TIPOS: Array<{ code: PermisoTipo; label: string }> = [
  { code: "GOCE", label: "Permiso con goce salarial" },
  { code: "SIN_GOCE", label: "Permiso sin goce salarial" },
];

type SortField = "id" | "fecha_inicio" | "fecha_fin" | "tipo_permiso" | "dias_solicitados" | "estado";

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

const getStatusValue = (item: PermisoListItem) =>
  normalizeRequestStatus(item.estadoSolicitudPermisos?.estado ?? item.estado_solicitud);

const getPermisoTipoLabel = (item: PermisoListItem) => {
  if (item.tiposSolicitud?.tipo_solicitud) {
    return item.tiposSolicitud.tipo_solicitud;
  }

  const fromCatalog = PERMISO_TIPOS.find(
    (tipo) => tipo.code === String(item.tipo_permiso ?? "").toUpperCase(),
  )?.label;

  return fromCatalog ?? "Tipo no disponible";
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



export const SolicitudPermisosPage = () => {
  const { user } = useAuth();
  const userID = user?.id;
  const todayInCostaRica = useMemo(() => getCostaRicaTodayDate(), []);
  const [openModal, setOpenModal] = useState(false);
  const [detailItem, setDetailItem] = useState<PermisoListItem | null>(null);
  const [estadoFilter, setEstadoFilter] = useState("");
  const [inicioMonthYearFilter, setInicioMonthYearFilter] = useState("");
  const [finMonthYearFilter, setFinMonthYearFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "fecha_inicio",
    dir: "desc",
  });
  const pageSize = 10;

  const {
    data: permisosResponse = [],
    isLoading: isLoadingPermisos,
    refetch: refetchMyPermisos,
  } = useApiQuery<PermisoListItem[]>({
    url: `permisos/colaborador/${userID}`,
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

  const defaultApproverId = useMemo(() => approverOptions[0]?.value ?? "", [approverOptions]);
  const formKey = useMemo(() => `permisos-form-${defaultApproverId}`, [defaultApproverId]);

  const tipoPermisoOptions = useMemo(
    () => PERMISO_TIPOS.map((tipo) => ({ label: tipo.label, value: tipo.code })),
    [],
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

  const filteredPermisos = useMemo(() => {
    const inicioParts = getMonthYearParts(inicioMonthYearFilter);
    const finParts = getMonthYearParts(finMonthYearFilter);

    return permisosResponse.filter((item) => {
      if (estadoFilter && getStatusValue(item) !== estadoFilter) return false;
      if (!matchesMonthYear(item.fecha_inicio, inicioParts.month, inicioParts.year)) return false;
      if (!matchesMonthYear(item.fecha_fin, finParts.month, finParts.year)) return false;
      return true;
    });
  }, [estadoFilter, finMonthYearFilter, inicioMonthYearFilter, permisosResponse]);

  const sortedPermisos = useMemo(() => {
    const direction = sort.dir === "asc" ? 1 : -1;

    return [...filteredPermisos].sort((left, right) => {
      if (sort.field === "id") {
        const value = (left.id_solicitud - right.id_solicitud) * direction;
        return value === 0 ? right.id_solicitud - left.id_solicitud : value;
      }

      if (sort.field === "fecha_inicio") {
        const value = (toDateSortValue(left.fecha_inicio) - toDateSortValue(right.fecha_inicio)) * direction;
        return value === 0 ? right.id_solicitud - left.id_solicitud : value;
      }

      if (sort.field === "fecha_fin") {
        const value = (toDateSortValue(left.fecha_fin) - toDateSortValue(right.fecha_fin)) * direction;
        return value === 0 ? right.id_solicitud - left.id_solicitud : value;
      }

      if (sort.field === "tipo_permiso") {
        const value = getPermisoTipoLabel(left).localeCompare(getPermisoTipoLabel(right), "es", { sensitivity: "base" }) * direction;
        return value === 0 ? right.id_solicitud - left.id_solicitud : value;
      }

      if (sort.field === "dias_solicitados") {
        const leftDays = Number(left.dias_solicitados ?? left.cantidad_dias ?? 0);
        const rightDays = Number(right.dias_solicitados ?? right.cantidad_dias ?? 0);
        const value = (leftDays - rightDays) * direction;
        return value === 0 ? right.id_solicitud - left.id_solicitud : value;
      }

      const value = getStatusValue(left).localeCompare(getStatusValue(right), "es", { sensitivity: "base" }) * direction;
      return value === 0 ? right.id_solicitud - left.id_solicitud : value;
    });
  }, [filteredPermisos, sort]);

  useEffect(() => {
    setPage(1);
  }, [estadoFilter, inicioMonthYearFilter, finMonthYearFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedPermisos.length / pageSize));

  useEffect(() => {
    setPage((currentPage) => (currentPage > totalPages ? totalPages : currentPage));
  }, [totalPages]);

  const paginatedPermisos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedPermisos.slice(start, start + pageSize);
  }, [page, sortedPermisos]);

  const columns = useMemo<DataTableColumn<PermisoListItem>[]>(
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
        cell: (item) => `#${item.id_solicitud}`,
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
        minW: "170px",
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
        minW: "170px",
        cell: (item) => formatDateUiCompact(item.fecha_fin),
      },
      {
        id: "tipo_permiso",
        header: (
          <SortHeader
            label="Tipo"
            field="tipo_permiso"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "220px",
        cell: (item) => getPermisoTipoLabel(item),
      },
      {
        id: "dias_solicitados",
        header: (
          <SortHeader
            label="Días"
            field="dias_solicitados"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "100px",
        cell: (item) => item.dias_solicitados ?? item.cantidad_dias ?? "—",
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
        minW: "120px",
        cell: (item) => {
          const status = getStatusValue(item);
          return (
            <Badge {...estadoBadgeProps(status)}>
              {toTitleCase(status.toLowerCase())}
            </Badge>
          );
        },
      },
    ],
    [sort.dir, sort.field],
  );

  const actionColumn = useMemo<DataTableActionColumn<PermisoListItem>>(
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

  const { mutate: createPermiso, isLoading: isSubmitting } = useApiMutation<PermisoPayload, PermisoCreateResponse>({
    url: "/permisos",
    method: "POST",
  });

  const handleCreatePermiso = async (formValues: CreatePermisoFormValues) => {
    if (!userID) {
      console.error("No se pudo determinar el colaborador autenticado");
      return false;
    }

    const approverId = Number(formValues.id_aprobador);
    const expectedApproverId = Number(jefeDirectoId);

    if (!Number.isFinite(approverId) || approverId <= 0) {
      showToast("Seleccione un aprobador válido.", "error", "Solicitud de permisos");
      return false;
    }

    if (!Number.isFinite(expectedApproverId) || expectedApproverId <= 0) {
      showToast("No tienes un jefe directo asignado en tu contrato activo.", "error", "Solicitud de permisos");
      return false;
    }

    if (approverId !== expectedApproverId) {
      showToast("El aprobador debe ser tu jefe directo.", "error", "Solicitud de permisos");
      return false;
    }

    const selectedTipo = PERMISO_TIPOS.find((tipo) => tipo.code === formValues.tipo_permiso);
    if (!selectedTipo) {
      showToast("Seleccione un tipo de permiso válido.", "error", "Solicitud de permisos");
      return false;
    }

    const payload: PermisoPayload = {
      id_colaborador: Number(userID),
      id_aprobador: expectedApproverId,
      fecha_inicio: formValues.fecha_inicio,
      fecha_fin: formValues.fecha_fin,
      tipo_permiso: selectedTipo.code,
      ...(formValues.observaciones ? { observaciones: formValues.observaciones } : {}),
    };

    try {
      const result = await createPermiso(payload);

      if (payload.tipo_permiso === "GOCE" && typeof result?.cantidad_dias === "number") {
        showToast(
          `Esta solicitud cubre ${result.cantidad_dias} ${result.cantidad_dias === 1 ? "día" : "días"} laborables.`,
          "info",
          "Cálculo de permisos",
        );
      }

      if (Array.isArray(result?.warnings)) {
        result.warnings.forEach((warning, index) => {
          if (!warning) return;
          showToast(warning, "warning", index === 0 ? "Avisos del periodo" : undefined);
        });
      }

      await refetchMyPermisos();
      setOpenModal(false);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return (
    <Layout pageTitle="Solicitud de Permisos">
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
            value={inicioMonthYearFilter}
            onChange={setInicioMonthYearFilter}
            placeholder="Todos"
            label="Fecha Inicio"
            clearable
          />

          <MonthPickerBase
            value={finMonthYearFilter}
            onChange={setFinMonthYearFilter}
            placeholder="Todos"
            label="Fecha Fin"
            clearable
          />
        </SimpleGrid>

        <DataTable<PermisoListItem>
          data={paginatedPermisos}
          columns={columns}
          actionColumn={actionColumn}
          isDataLoading={isLoadingPermisos}
          size="md"
          pagination={{
            enabled: true,
            page,
            pageSize,
            totalCount: sortedPermisos.length,
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
            onSubmit={handleCreatePermiso}
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
              <InputField
                fieldType="select"
                label="Tipo de permiso"
                name="tipo_permiso"
                required
                disableSelectPortal
                placeholder={tipoPermisoOptions.length ? "Seleccione un tipo" : "Cargando..."}
                options={tipoPermisoOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: tipoPermisoOptions.length === 0 }}
              />
              <DateRangeField
                startName="fecha_inicio"
                endName="fecha_fin"
                label="Período del permiso"
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
                disabled={!approverOptions.length}
              >
                Registrar permiso
              </AppButton>
            </Box>
          </Form>
        }
      />

      <PermisoDetalleModal
        item={detailItem}
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
      />
    </Layout>
  );
};