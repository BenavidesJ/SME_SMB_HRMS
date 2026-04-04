import {
  Button,
  CloseButton,
  Dialog,
  EmptyState,
  Portal,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FiArrowDown, FiArrowUp, FiEdit2, FiEye, FiFilePlus, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router";
import { Form } from "../../../components/forms/Form/Form";
import { InputField } from "../../../components/forms/InputField/InputField";
import { Modal } from "../../../components/general/modal/Modal";
import { DataTable } from "../../../components/general/table/DataTable";
import type { DataTableActionColumn, DataTableColumn } from "../../../components/general/table/types";
import { Layout } from "../../../components/layout";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useApiQuery } from "../../../hooks/useApiQuery";
import type { AguinaldoPeriodo } from "../../../services/api/aguinaldos";
import { showToast } from "../../../services/toast/toastService";
import { formatDateUiCompact, parseUiDateSafe } from "../../../utils";

type SortDir = "asc" | "desc";
type SortField = "anio" | "periodo_desde" | "periodo_hasta" | "fecha_pago";

type PeriodFormValues = {
  anio: string;
  periodo_desde: string;
  periodo_hasta: string;
  fecha_pago: string;
};

type LegalPeriodo = {
  anio: string;
  periodo_desde: string;
  periodo_hasta: string;
  fecha_pago_sugerida: string;
  fecha_pago_min: string;
  fecha_pago_max: string;
};

function buildLegalPeriodoByYear(year: number): LegalPeriodo {
  return {
    anio: String(year),
    periodo_desde: `${year - 1}-12-01`,
    periodo_hasta: `${year}-11-30`,
    fecha_pago_sugerida: `${year}-12-15`,
    fecha_pago_min: `${year}-12-01`,
    fecha_pago_max: `${year}-12-20`,
  };
}

function isFechaPagoWithinLegalWindow(fechaPago: string, legalPeriodo: LegalPeriodo) {
  if (!isValidDateOnly(fechaPago)) return false;

  return (
    fechaPago >= legalPeriodo.fecha_pago_min
    && fechaPago <= legalPeriodo.fecha_pago_max
  );
}

function getDefaultPeriodo() {
  const now = new Date();
  return buildLegalPeriodoByYear(now.getFullYear());
}

function toDateSortValue(value: string) {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = parseUiDateSafe(value);
  return parsed ? parsed.getTime() : Number.NEGATIVE_INFINITY;
}

function isValidDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
}

function PeriodFormFields({ isEditing }: { isEditing: boolean }) {
  const { control, setValue } = useFormContext<PeriodFormValues>();
  const selectedYearRaw = useWatch({ control, name: "anio" });
  const fechaPago = useWatch({ control, name: "fecha_pago" });
  const parsedYear = Number(selectedYearRaw);

  const legalPeriodo = useMemo(
    () => (Number.isInteger(parsedYear) && parsedYear > 0 ? buildLegalPeriodoByYear(parsedYear) : null),
    [parsedYear],
  );

  useEffect(() => {
    if (isEditing || !legalPeriodo) return;

    setValue("periodo_desde", legalPeriodo.periodo_desde, { shouldValidate: true });
    setValue("periodo_hasta", legalPeriodo.periodo_hasta, { shouldValidate: true });

    if (!isFechaPagoWithinLegalWindow(String(fechaPago ?? ""), legalPeriodo)) {
      setValue("fecha_pago", legalPeriodo.fecha_pago_sugerida, { shouldValidate: true });
    }
  }, [isEditing, legalPeriodo, fechaPago, setValue]);

  return (
    <>
      <InputField
        name="anio"
        label="Año"
        fieldType="year"
        required
        rules={{
          validate: (value: string) => {
            const year = Number(value);
            return Number.isInteger(year) && year > 0
              ? true
              : "El año del periodo es inválido.";
          },
        }}
      />

      <InputField
        name="periodo_desde"
        label="Periodo desde"
        fieldType="date"
        required
        readOnly={!isEditing}
      />

      <InputField
        name="periodo_hasta"
        label="Periodo hasta"
        fieldType="date"
        required
        readOnly={!isEditing}
      />

      <InputField
        name="fecha_pago"
        label="Fecha de pago"
        fieldType="date"
        required
        min={legalPeriodo?.fecha_pago_min}
        max={legalPeriodo?.fecha_pago_max}
        rules={{
          validate: (value: string) => {
            if (!legalPeriodo) return "Seleccione un año válido.";
            return isFechaPagoWithinLegalWindow(value, legalPeriodo)
              ? true
              : `La fecha de pago debe estar entre ${formatDateUiCompact(legalPeriodo.fecha_pago_min)} y ${formatDateUiCompact(legalPeriodo.fecha_pago_max)}.`;
          },
        }}
      />
    </>
  );
}

export const AguinaldosPeriodos = () => {
  const navigate = useNavigate();

  const {
    data: periodos = [],
    isLoading: isLoadingPeriodos,
    refetch,
  } = useApiQuery<AguinaldoPeriodo[]>({ url: "aguinaldos/periodos" });

  const { mutate: updatePeriodo, isLoading: isUpdating } = useApiMutation<
    {
      anio: number;
      periodo_desde: string;
      periodo_hasta: string;
      fecha_pago: string;
    },
    AguinaldoPeriodo,
    string
  >({
    url: (periodoKey) => `aguinaldos/periodos/${encodeURIComponent(periodoKey)}`,
    method: "PATCH",
  });

  const { mutate: deletePeriodo, isLoading: isDeleting } = useApiMutation<void, {
    periodo_key: string;
    eliminados: number;
  }, string>({
    url: (periodoKey) => `aguinaldos/periodos/${encodeURIComponent(periodoKey)}`,
    method: "DELETE",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AguinaldoPeriodo | null>(null);
  const [periodToDelete, setPeriodToDelete] = useState<AguinaldoPeriodo | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "fecha_pago",
    dir: "desc",
  });

  const defaults = useMemo(() => getDefaultPeriodo(), []);

  const defaultFormValues = useMemo<PeriodFormValues>(() => {
    if (editingPeriod) {
      return {
        anio: String(editingPeriod.anio),
        periodo_desde: editingPeriod.periodo_desde,
        periodo_hasta: editingPeriod.periodo_hasta,
        fecha_pago: editingPeriod.fecha_pago,
      };
    }

    return {
      anio: defaults.anio,
      periodo_desde: defaults.periodo_desde,
      periodo_hasta: defaults.periodo_hasta,
      fecha_pago: defaults.fecha_pago_sugerida,
    };
  }, [editingPeriod, defaults]);

  const isSaving = isUpdating;

  const handleSortChange = useCallback((field: SortField) => {
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
  }, []);

  const buildSortHeader = useCallback(
    (label: string, field: SortField) => {
      const isActive = sort.field === field;

      return (
        <Button
          variant="ghost"
          size="xs"
          px="0"
          justifyContent="flex-start"
          onClick={() => handleSortChange(field)}
        >
          {label}
          {isActive ? (sort.dir === "asc" ? <FiArrowUp /> : <FiArrowDown />) : null}
        </Button>
      );
    },
    [handleSortChange, sort],
  );

  const sortedPeriodos = useMemo(() => {
    const direction = sort.dir === "asc" ? 1 : -1;

    return [...periodos].sort((left, right) => {
      const leftValue = (() => {
        if (sort.field === "anio") return Number(left.anio);
        if (sort.field === "periodo_desde") return toDateSortValue(left.periodo_desde);
        if (sort.field === "periodo_hasta") return toDateSortValue(left.periodo_hasta);
        return toDateSortValue(left.fecha_pago);
      })();

      const rightValue = (() => {
        if (sort.field === "anio") return Number(right.anio);
        if (sort.field === "periodo_desde") return toDateSortValue(right.periodo_desde);
        if (sort.field === "periodo_hasta") return toDateSortValue(right.periodo_hasta);
        return toDateSortValue(right.fecha_pago);
      })();

      if (leftValue === rightValue) {
        return Number(right.ultimo_registro_id) - Number(left.ultimo_registro_id);
      }

      return (leftValue - rightValue) * direction;
    });
  }, [periodos, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedPeriodos.length / pageSize));

  useEffect(() => {
    setPage((currentPage) => (currentPage > totalPages ? totalPages : currentPage));
  }, [totalPages]);

  const paginatedPeriodos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedPeriodos.slice(start, start + pageSize);
  }, [sortedPeriodos, page]);

  const handleSubmitPeriod = async (values: PeriodFormValues) => {
    if (!isValidDateOnly(values.periodo_desde) || !isValidDateOnly(values.periodo_hasta) || !isValidDateOnly(values.fecha_pago)) {
      showToast("Revise el formato de las fechas del periodo.", "error");
      return false;
    }

    const anio = Number(values.anio);
    if (!Number.isInteger(anio) || anio <= 0) {
      showToast("El año del periodo es inválido.", "error");
      return false;
    }

    const legalPeriodo = buildLegalPeriodoByYear(anio);

    if (
      values.periodo_desde !== legalPeriodo.periodo_desde
      || values.periodo_hasta !== legalPeriodo.periodo_hasta
    ) {
      showToast(
        `El periodo legal para ${anio} debe ser del ${formatDateUiCompact(legalPeriodo.periodo_desde)} al ${formatDateUiCompact(legalPeriodo.periodo_hasta)}.`,
        "error",
      );
      return false;
    }

    if (!isFechaPagoWithinLegalWindow(values.fecha_pago, legalPeriodo)) {
      showToast(
        `La fecha de pago debe estar entre ${formatDateUiCompact(legalPeriodo.fecha_pago_min)} y ${formatDateUiCompact(legalPeriodo.fecha_pago_max)}.`,
        "error",
      );
      return false;
    }

    const desdeMs = new Date(`${values.periodo_desde}T00:00:00`).getTime();
    const hastaMs = new Date(`${values.periodo_hasta}T00:00:00`).getTime();

    if (Number.isNaN(desdeMs) || Number.isNaN(hastaMs) || desdeMs > hastaMs) {
      showToast("El rango del periodo es inválido.", "error");
      return false;
    }

    try {
      if (editingPeriod) {
        await updatePeriodo(editingPeriod.periodo_key, {
          anio,
          periodo_desde: legalPeriodo.periodo_desde,
          periodo_hasta: legalPeriodo.periodo_hasta,
          fecha_pago: values.fecha_pago,
        });

        showToast("Periodo de aguinaldo actualizado.", "success");
        await refetch();
      } else {
        const params = new URLSearchParams({
          anio: String(anio),
          periodo_desde: legalPeriodo.periodo_desde,
          periodo_hasta: legalPeriodo.periodo_hasta,
          fecha_pago: values.fecha_pago,
        });

        navigate(`/aguinaldos/nuevo?${params.toString()}`);
      }

      setShowForm(false);
      setEditingPeriod(null);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleStartCreate = () => {
    setEditingPeriod(null);
    setShowForm((prev) => !prev);
  };

  const handleEditPeriod = (period: AguinaldoPeriodo) => {
    setEditingPeriod(period);
    setShowForm(true);
  };

  const handleDeletePeriod = async (period: AguinaldoPeriodo) => {
    try {
      const result = await deletePeriodo(period.periodo_key);
      await refetch();

      const removed = Number(result?.eliminados ?? 0);
      showToast(
        removed > 0
          ? `Se eliminaron ${removed} registro(s) de aguinaldo del periodo.`
          : "Periodo eliminado.",
        "success",
      );
      setPeriodToDelete(null);
    } catch (error) {
      console.log(error);
      showToast("No se pudo eliminar el periodo.", "error");
    }
  };

  const columns = useMemo<DataTableColumn<AguinaldoPeriodo>[]>(
    () => [
      {
        id: "periodo",
        header: "Periodo",
        minW: "240px",
        textAlign: "left",
        cell: (period) => `${formatDateUiCompact(period.periodo_desde)} - ${formatDateUiCompact(period.periodo_hasta)}`,
      },
      {
        id: "anio",
        header: buildSortHeader("Año", "anio"),
        textAlign: "left",
        w: "110px",
        cell: (period) => period.anio,
      },
      {
        id: "fecha_pago",
        header: buildSortHeader("Fecha pago", "fecha_pago"),
        textAlign: "left",
        minW: "150px",
        cell: (period) => formatDateUiCompact(period.fecha_pago),
      },
      {
        id: "registrado_por",
        header: "Registrado por",
        minW: "220px",
        textAlign: "left",
        cell: (period) => period.registrado_por_nombre,
      },
    ],
    [buildSortHeader],
  );

  const actionColumn = useMemo<DataTableActionColumn<AguinaldoPeriodo>>(
    () => ({
      header: "Acciones",
      w: "320px",
      textAlign: "left",
      sticky: true,
      cell: (period) => (
        <Stack direction="row" justifyContent="flex-start" gap="2" flexWrap="wrap">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigate(`/aguinaldos/${encodeURIComponent(period.periodo_key)}`)}
          >
            <FiEye /> Ver
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => handleEditPeriod(period)}
          >
            <FiEdit2 /> Editar
          </Button>
          <Button
            variant="ghost"
            size="xs"
            colorPalette="red"
            onClick={() => setPeriodToDelete(period)}
          >
            <FiTrash2 /> Eliminar
          </Button>
        </Stack>
      ),
    }),
    [navigate],
  );

  return (
    <Layout pageTitle="Aguinaldos">
      <Stack gap="6" marginBottom="5rem">
        <Button
          colorPalette="blue"
          alignSelf="flex-start"
          onClick={handleStartCreate}
        >
          <FiFilePlus />
          {showForm && !editingPeriod ? " Cerrar formulario" : " Crear periodo de aguinaldo"}
        </Button>

        <Modal
          title={editingPeriod ? "Editar periodo de aguinaldo" : "Nuevo periodo de aguinaldo"}
          isOpen={showForm}
          size="lg"
          onOpenChange={(event) => {
            setShowForm(event.open);
            if (!event.open) {
              setEditingPeriod(null);
            }
          }}
          content={
            showForm ? (
              <Form<PeriodFormValues>
                key={editingPeriod ? `edit-${editingPeriod.periodo_key}` : "create-periodo-aguinaldo"}
                onSubmit={handleSubmitPeriod}
                defaultValues={defaultFormValues}
                formOptions={{ mode: "onChange" }}
              >
                <Stack gap="4">
                  <PeriodFormFields isEditing={Boolean(editingPeriod)} />

                  <Stack direction="row" justifyContent="flex-end" gap="3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingPeriod(null);
                      }}
                    >
                      {editingPeriod ? "Cancelar edición" : "Cancelar"}
                    </Button>
                    <Button
                      type="submit"
                      colorPalette="blue"
                      loading={isSaving}
                    >
                      {editingPeriod ? "Guardar cambios" : "Continuar"}
                    </Button>
                  </Stack>
                </Stack>
              </Form>
            ) : null
          }
        />

        <Dialog.Root
          open={Boolean(periodToDelete)}
          onOpenChange={({ open }) => {
            if (!open) {
              setPeriodToDelete(null);
            }
          }}
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Eliminar periodo de aguinaldo</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap="3">
                    <Text>
                      {periodToDelete
                        ? `Se eliminarán todos los aguinaldos del periodo ${formatDateUiCompact(periodToDelete.periodo_desde)} al ${formatDateUiCompact(periodToDelete.periodo_hasta)}.`
                        : "Se eliminarán los aguinaldos del periodo seleccionado."}
                    </Text>
                    <Text color="fg.muted">
                      Esta acción es permanente y no se puede deshacer.
                    </Text>
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="outline">Cancelar</Button>
                  </Dialog.ActionTrigger>
                  <Button
                    colorPalette="red"
                    loading={isDeleting}
                    onClick={async () => {
                      if (!periodToDelete) return;
                      await handleDeletePeriod(periodToDelete);
                    }}
                  >
                    Eliminar periodo
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>

        {isLoadingPeriodos ? (
          <Spinner alignSelf="center" size="lg" />
        ) : periodos.length === 0 ? (
          <EmptyState.Root
            colorPalette="blue"
            h="320px"
            border="0.15rem dashed"
            borderColor="blue.600"
            alignContent="center"
            mt="1rem"
          >
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiFilePlus />
              </EmptyState.Indicator>
              <Stack textAlign="center" gap="2">
                <EmptyState.Title>
                  Aún no existen periodos de aguinaldo con registros.
                </EmptyState.Title>
                <EmptyState.Description>
                  Empieza creando un periodo y registra al menos un aguinaldo para que aparezca en esta tabla.
                </EmptyState.Description>
              </Stack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <DataTable<AguinaldoPeriodo>
            data={paginatedPeriodos}
            columns={columns}
            actionColumn={actionColumn}
            isDataLoading={isLoadingPeriodos}
            size="md"
            pagination={{
              enabled: true,
              page,
              pageSize,
              totalCount: sortedPeriodos.length,
              onPageChange: setPage,
            }}
          />
        )}
      </Stack>
    </Layout>
  );
};
