import {
  Box,
  Button,
  Select,
  SimpleGrid,
  Stack,
  Wrap,
  createListCollection,
} from "@chakra-ui/react";
import { Form, InputField } from "../../../components/forms";
import { Layout } from "../../../components/layout";
import { useAuth } from "../../../context/AuthContext";
import { Button as AppButton } from "../../../components/general/button/Button";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  addDaysToDateInput,
  formatDateUiCompact,
  getCostaRicaTodayDate,
  parseUiDateSafe,
  toTitleCase,
} from "../../../utils";
import { useApiMutation } from "../../../hooks/useApiMutations";
import type {
  CrearIncapacidadFormValues,
  CrearIncapacidadPayload,
  EmployeeRow,
  EmployeeUserInfo,
  IncapacidadGrupo,
  TipoIncapacidad,
} from "../../../types";
import { DateRangeField } from "../../../components/forms/InputField/fields";
import { DataTable } from "../../../components/general/table/DataTable";
import { SortHeader, type SortDir } from "../../../components/general/table/SortHeader";
import type { DataTableActionColumn, DataTableColumn } from "../../../components/general/table/types";
import { Modal } from "../../../components/general";
import { FiEye } from "react-icons/fi";

type SortField = "numero_boleta" | "tipo" | "fecha_inicio" | "fecha_fin" | "dias";

interface IncapacidadRow extends IncapacidadGrupo {
  id: string;
  tipo_label: string;
  tipo_key: string;
  dias_totales: number;
}

const ADMIN_ROLES = new Set(["ADMIN", "ADMINISTRADOR"]);
const normalizeTipo = (value?: string | null) => String(value ?? "").replace(/_/g, " ").trim().toUpperCase();

const getTipoLabel = (tipo: string | null | undefined) => {
  const raw = String(tipo ?? "").replace(/_/g, " ").trim();
  if (!raw) return "Tipo no definido";
  return raw.toUpperCase() === raw ? raw : toTitleCase(raw);
};

const toDateSortValue = (value?: string | null) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = parseUiDateSafe(value);
  return parsed ? parsed.getTime() : Number.NEGATIVE_INFINITY;
};

const isUsuarioActivo = (usuario?: EmployeeUserInfo | null) => {
  if (!usuario) return false;
  if (typeof usuario.estado === "string") {
    return usuario.estado.toUpperCase() === "ACTIVO";
  }
  if (typeof usuario.estado === "number") {
    return usuario.estado === 1;
  }
  return Boolean(usuario.estado);
};

export const RegistroIncapacidades = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userID = Number(user?.id ?? 0);
  const loggedUserRole = user?.usuario?.rol;
  const todayInCostaRica = useMemo(() => getCostaRicaTodayDate(), []);
  const minFechaInicio = useMemo(() => addDaysToDateInput(todayInCostaRica, -2), [todayInCostaRica]);
  const [openModal, setOpenModal] = useState(false);
  const [tipoFilter, setTipoFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "fecha_inicio",
    dir: "desc",
  });
  const pageSize = 10;

  const hasAdminPermission = useMemo(
    () => (loggedUserRole ? ADMIN_ROLES.has(loggedUserRole) : false),
    [loggedUserRole],
  );

  const { data: tipoIncapacidad = [] } = useApiQuery<TipoIncapacidad[]>({ url: "mantenimientos/tipos-incapacidad" });
  const { mutate: createIncapacidad, isLoading: isSubmitting } = useApiMutation<CrearIncapacidadPayload, void>({
    url: "/incapacidades",
    method: "POST",
  });

  const { data: incapacidades = [], isLoading: isLoadingList, refetch: refetchIncapacidades } = useApiQuery<IncapacidadGrupo[]>({
    url: `incapacidades/colaborador/${userID}`,
    enabled: Boolean(userID),
  });

  const { data: employees = [], isLoading: isEmployeesLoading } =
    useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const colaboradoresActivos = useMemo(
    () =>
      (employees ?? []).filter((colaborador) => {
        const estadoNombre = (colaborador.estado?.nombre ?? "").toUpperCase();
        return estadoNombre === "ACTIVO" && isUsuarioActivo(colaborador.usuario);
      }),
    [employees],
  );

  const colaboradoresVisibles = useMemo(() => {
    if (!hasAdminPermission) {
      return colaboradoresActivos.filter((colaborador) => colaborador.id === userID);
    }
    return colaboradoresActivos;
  }, [colaboradoresActivos, hasAdminPermission, userID]);

  const colaboradorOptions = useMemo(() => {
    return colaboradoresVisibles.map((colaborador) => {
      const collaboratorId = Number(colaborador.id);
      const baseName = [colaborador.nombre, colaborador.primer_apellido, colaborador.segundo_apellido]
        .filter(Boolean)
        .join(" ")
        .trim();

      const displayName = baseName ? toTitleCase(baseName) : `Colaborador ${collaboratorId}`;
      const suffix = collaboratorId === userID ? " (Para mi)" : "";

      return {
        label: `${displayName}${suffix}`,
        value: String(collaboratorId),
      };
    });
  }, [colaboradoresVisibles, userID]);

  const incapacidadOptions = useMemo(
    () => tipoIncapacidad.map((item) => ({ label: toTitleCase(item.nombre), value: item.nombre })),
    [tipoIncapacidad],
  );

  const tipoFilterCollection = useMemo(
    () =>
      createListCollection({
        items: tipoIncapacidad.map((item) => ({
          label: toTitleCase(item.nombre),
          value: normalizeTipo(item.nombre),
        })),
      }),
    [tipoIncapacidad],
  );

  const rows = useMemo<IncapacidadRow[]>(
    () =>
      incapacidades.map((item, index) => ({
        ...item,
        id: item.numero_boleta ?? `${item.fecha_inicio ?? "sin-fecha"}-${index}`,
        tipo_label: getTipoLabel(item.tipo_incapacidad),
        tipo_key: normalizeTipo(item.tipo_incapacidad),
        dias_totales: item.dias.length,
      })),
    [incapacidades],
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

  const filteredRows = useMemo(() => {
    if (!tipoFilter) return rows;
    return rows.filter((item) => item.tipo_key === tipoFilter);
  }, [rows, tipoFilter]);

  const sortedRows = useMemo(() => {
    const direction = sort.dir === "asc" ? 1 : -1;

    return [...filteredRows].sort((left, right) => {
      if (sort.field === "numero_boleta") {
        return String(left.numero_boleta ?? "").localeCompare(String(right.numero_boleta ?? ""), "es", { sensitivity: "base" }) * direction;
      }

      if (sort.field === "tipo") {
        return left.tipo_label.localeCompare(right.tipo_label, "es", { sensitivity: "base" }) * direction;
      }

      if (sort.field === "fecha_inicio") {
        return (toDateSortValue(left.fecha_inicio) - toDateSortValue(right.fecha_inicio)) * direction;
      }

      if (sort.field === "fecha_fin") {
        return (toDateSortValue(left.fecha_fin) - toDateSortValue(right.fecha_fin)) * direction;
      }

      return (left.dias_totales - right.dias_totales) * direction;
    });
  }, [filteredRows, sort]);

  useEffect(() => {
    setPage(1);
  }, [tipoFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  useEffect(() => {
    setPage((currentPage) => (currentPage > totalPages ? totalPages : currentPage));
  }, [totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [page, sortedRows]);

  const columns = useMemo<DataTableColumn<IncapacidadRow>[]>(
    () => [
      {
        id: "numero_boleta",
        header: (
          <SortHeader
            label="Boleta"
            field="numero_boleta"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "200px",
        cell: (item) => item.numero_boleta ?? "No definida",
      },
      {
        id: "tipo",
        header: (
          <SortHeader
            label="Tipo"
            field="tipo"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "200px",
        cell: (item) => item.tipo_label,
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
        minW: "160px",
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
        minW: "160px",
        cell: (item) => formatDateUiCompact(item.fecha_fin),
      },
      {
        id: "dias",
        header: (
          <SortHeader
            label="Días"
            field="dias"
            currentSortBy={sort.field}
            currentSortDir={sort.dir}
            onChange={handleSortChange}
          />
        ),
        minW: "120px",
        cell: (item) => item.dias_totales,
      },
    ],
    [sort.dir, sort.field],
  );

  const actionColumn = useMemo<DataTableActionColumn<IncapacidadRow>>(
    () => ({
      header: "Acciones",
      sticky: true,
      textAlign: "left",
      cell: (item) => (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={!item.numero_boleta}
          onClick={() => {
            if (!item.numero_boleta) return;
            const params = new URLSearchParams({ origen: "solicitud" });
            navigate(`/incapacidades/${encodeURIComponent(item.numero_boleta)}?${params.toString()}`);
          }}
        >
          <FiEye />
          Ver detalle
        </Button>
      ),
    }),
    [navigate],
  );

  const handleCreateRequest = async (values: CrearIncapacidadFormValues) => {
    const collaboratorId = hasAdminPermission
      ? Number(values.id_colaborador)
      : Number(userID);

    if (!Number.isFinite(collaboratorId) || collaboratorId <= 0) {
      return false;
    }

    const incapacidad: CrearIncapacidadPayload = {
      id_colaborador: collaboratorId,
      fecha_inicio: values.fecha_inicio,
      fecha_fin: values.fecha_fin,
      tipo_incap: String(values.tipo_incap ?? "").trim(),
      numero_boleta: String(values.numero_boleta ?? "").trim().toUpperCase(),
    };

    try {
      await createIncapacidad(incapacidad);
      await refetchIncapacidades();
      setOpenModal(false);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  return (
    <Layout pageTitle="Registro de Incapacidades">
      <Stack gap="5" pb="6">
        <Box>
          <AppButton appearance="login" size="lg" onClick={() => setOpenModal(true)}>
            Registrar incapacidad
          </AppButton>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
          <Select.Root
            collection={tipoFilterCollection}
            value={tipoFilter ? [tipoFilter] : []}
            onValueChange={(event) => setTipoFilter(event.value?.[0] ?? "")}
            size="sm"
          >
            <Select.HiddenSelect />
            <Select.Label>Tipo de incapacidad</Select.Label>
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
                {tipoFilterCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </SimpleGrid>

        <DataTable<IncapacidadRow>
          data={paginatedRows}
          columns={columns}
          actionColumn={actionColumn}
          isDataLoading={isLoadingList}
          size="md"
          pagination={{
            enabled: true,
            page,
            pageSize,
            totalCount: sortedRows.length,
            onPageChange: setPage,
          }}
        />
      </Stack>

      <Modal
        title="Registrar incapacidad"
        isOpen={openModal}
        onOpenChange={(event) => setOpenModal(event.open)}
        size="lg"
        content={
          <Form<CrearIncapacidadFormValues>
            onSubmit={handleCreateRequest}
            resetOnSuccess
            defaultValues={{
              id_colaborador: hasAdminPermission ? "" : userID,
            }}
          >
            <Wrap maxW="600px">
              <InputField
                fieldType="text"
                label="Número de Boleta"
                name="numero_boleta"
                required
                maxLength={50}
                rules={{
                  required: "El campo es obligatorio",
                  setValueAs: (value) => String(value ?? "").trim().toUpperCase(),
                  validate: (value) => {
                    const boleta = String(value ?? "").trim();

                    if (!boleta) return "El campo es obligatorio";
                    if (boleta.length > 50) return "La boleta no puede exceder 50 caracteres.";
                    if (boleta.includes("/")) return "La boleta no puede contener '/'.";

                    return true;
                  },
                }}
                helperText="Use el número legal de boleta emitido por la entidad correspondiente."
              />

              <DateRangeField
                startName="fecha_inicio"
                endName="fecha_fin"
                label="Período de incapacidad"
                required
                min={minFechaInicio}
                allowSameDay
                startRules={{
                  validate: (value: string) => {
                    if (!value) return true;
                    return value >= minFechaInicio || "La fecha de inicio no puede ser anterior a 2 días atrás.";
                  },
                }}
              />

              <InputField
                fieldType="select"
                label="Tipo de Incapacidad"
                name="tipo_incap"
                required
                disableSelectPortal
                placeholder={tipoIncapacidad.length ? "Seleccione una opción" : "Cargando..."}
                options={incapacidadOptions}
                rules={{
                  required: "El campo es obligatorio",
                  setValueAs: (value) => String(value ?? "").trim(),
                }}
                selectRootProps={{ disabled: tipoIncapacidad.length === 0 }}
              />

              {hasAdminPermission && (
                <InputField
                  fieldType="select"
                  label="Colaborador"
                  name="id_colaborador"
                  required
                  disableSelectPortal
                  placeholder={isEmployeesLoading ? "Cargando colaboradores..." : "Seleccione un colaborador"}
                  options={colaboradorOptions}
                  rules={{
                    required: "El campo es obligatorio",
                    setValueAs: (value) => (value !== undefined && value !== null && value !== "" ? Number(value) : undefined),
                  }}
                  selectRootProps={{ disabled: isEmployeesLoading || colaboradorOptions.length === 0 }}
                />
              )}
            </Wrap>

            <Box w={{ base: "100%", sm: "250px" }} mt={4}>
              <AppButton
                loading={isSubmitting}
                loadingText="Enviando"
                appearance="login"
                type="submit"
                size="lg"
                w="100%"
                disabled={
                  !userID
                  || !tipoIncapacidad.length
                  || (hasAdminPermission && (!colaboradorOptions.length || isEmployeesLoading))
                }
              >
                Registrar incapacidad
              </AppButton>
            </Box>
          </Form>
        }
      />
    </Layout>
  );
}
