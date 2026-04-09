import {
  Badge,
  Button,
  CloseButton,
  Dialog,
  EmptyState,
  Portal,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  createListCollection,
  parseDate,
} from "@chakra-ui/react";
import { Layout } from "../../../components/layout";
import { FiArrowDown, FiArrowUp, FiEdit2, FiEye, FiFilePlus, FiTrash2 } from "react-icons/fi";
import { PiMoney } from "react-icons/pi";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { Form } from "../../../components/forms/Form/Form";
import { InputField } from "../../../components/forms/InputField/InputField";
import { MonthPickerBase } from "../../../components/forms/InputField/fields/MonthPickerFieldVariant";
import { YearPickerBase } from "../../../components/forms/InputField/fields/YearPickerFieldVariant";
import { Modal } from "../../../components/general";
import { DataTable } from "../../../components/general/table/DataTable";
import type { DataTableActionColumn, DataTableColumn } from "../../../components/general/table/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { showToast } from "../../../services/toast/toastService";
import { deletePeriodoPlanilla } from "../../../services/api/planillas";
import { formatDateUiCompact, parseUiDateSafe } from "../../../utils";

const QUINCENAL_CYCLE_NAME = "QUINCENAL";

const QUINCENA_OPTIONS = [
  { label: "Primera quincena", value: "PRIMERA" },
  { label: "Segunda quincena", value: "SEGUNDA" },
] as const;

type QuincenaTipo = (typeof QUINCENA_OPTIONS)[number]["value"];

interface PeriodoPlanilla {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  id_ciclo_pago: number;
  estado: string;
  descripcion: string;
}

type CreatePeriodoFormValues = {
  mes_referencia_mes: string;
  mes_referencia_anio: string;
  quincena: QuincenaTipo;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  id_ciclo_pago: string;
};

type CicloPagoOption = {
  id: number;
  ciclo_pago: string;
};

type PersistPeriodoPayload = {
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  id_ciclo_pago: number;
};

type SortDir = "asc" | "desc";
type SortField = "fecha_inicio" | "fecha_fin" | "fecha_pago";
type QuincenaFilter = "" | "PRIMERA" | "SEGUNDA";

const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

function formatDateOnly(year: number, monthIndex: number, day: number) {
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function buildReferenceMonth(month: string, year: string) {
  if (!/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) return "";
  return `${year}-${month}`;
}

function buildQuincenaDates(monthValue: string, quincena: QuincenaTipo | "") {
  if (!/^\d{4}-\d{2}$/.test(monthValue) || !quincena) return null;

  const [yearRaw, monthRaw] = monthValue.split("-");
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();

  if (quincena === "PRIMERA") {
    return {
      fecha_inicio: formatDateOnly(year, monthIndex, 1),
      fecha_fin: formatDateOnly(year, monthIndex, 15),
      fecha_pago: formatDateOnly(year, monthIndex, 15),
    };
  }

  return {
    fecha_inicio: formatDateOnly(year, monthIndex, 16),
    fecha_fin: formatDateOnly(year, monthIndex, lastDayOfMonth),
    fecha_pago: formatDateOnly(year, monthIndex, lastDayOfMonth),
  };
}

function getPeriodoQuincenaLabel(period: PeriodoPlanilla) {
  const startDay = Number(period.fecha_inicio.slice(8, 10));
  return startDay <= 15 ? "Primera" : "Segunda";
}

function getPeriodoMonthYearLabel(period: PeriodoPlanilla) {
  const referenceDate = period.fecha_pago || period.fecha_fin || period.fecha_inicio;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDate)) return "Mes sin definir";

  const monthIndex = Number(referenceDate.slice(5, 7)) - 1;
  const year = referenceDate.slice(0, 4);

  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return `Mes sin definir ${year}`;
  }

  return `${MONTH_LABELS[monthIndex]} ${year}`;
}

function getPeriodoDisplayLabel(period: PeriodoPlanilla) {
  const quincenaLabel = getPeriodoQuincenaLabel(period) === "Primera" ? "1" : "2";
  return `${quincenaLabel} Quincena ${getPeriodoMonthYearLabel(period)}`;
}

function getPeriodoReferenceDate(period: PeriodoPlanilla) {
  return period.fecha_pago || period.fecha_fin || period.fecha_inicio;
}

function getPeriodoMonthValue(period: PeriodoPlanilla) {
  const referenceDate = getPeriodoReferenceDate(period);
  return /^\d{4}-\d{2}-\d{2}$/.test(referenceDate) ? referenceDate.slice(5, 7) : "";
}

function getPeriodoYearValue(period: PeriodoPlanilla) {
  const referenceDate = getPeriodoReferenceDate(period);
  return /^\d{4}-\d{2}-\d{2}$/.test(referenceDate) ? referenceDate.slice(0, 4) : "";
}

function getPeriodoQuincenaValue(period: PeriodoPlanilla): QuincenaFilter {
  return getPeriodoQuincenaLabel(period) === "Primera" ? "PRIMERA" : "SEGUNDA";
}

function getEstadoBadgeColor(estado: string | null | undefined) {
  const normalized = String(estado ?? "").trim().toUpperCase();
  if (normalized === "PENDIENTE") return "yellow";
  if (normalized === "APROBADO" || normalized === "PAGADO") return "green";
  return "gray";
}

function isSamePeriodRange(
  period: PeriodoPlanilla,
  dates: Pick<PersistPeriodoPayload, "fecha_inicio" | "fecha_fin" | "fecha_pago">,
) {
  return (
    period.fecha_inicio === dates.fecha_inicio
    && period.fecha_fin === dates.fecha_fin
    && period.fecha_pago === dates.fecha_pago
  );
}

function hasFirstHalfPeriodForMonth({
  payrollPeriods,
  monthValue,
  quincenalCycleId,
}: {
  payrollPeriods: PeriodoPlanilla[];
  monthValue: string;
  quincenalCycleId: number;
}) {
  const firstHalfDates = buildQuincenaDates(monthValue, "PRIMERA");
  if (!firstHalfDates) return false;

  return payrollPeriods.some(
    (period) =>
      period.id_ciclo_pago === quincenalCycleId && isSamePeriodRange(period, firstHalfDates),
  );
}

function toDateSortValue(value: string) {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = parseUiDateSafe(value);
  return parsed ? parsed.getTime() : Number.NEGATIVE_INFINITY;
}

function CreatePeriodFields({ quincenalCycleId }: { quincenalCycleId: number | null }) {
  const { watch, setValue, trigger, clearErrors } = useFormContext<CreatePeriodoFormValues>();
  const referenceMonth = watch("mes_referencia_mes");
  const referenceYear = watch("mes_referencia_anio");
  const quincena = watch("quincena");
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const yearRules = useMemo(
    () => ({
      validate: (value: string) => {
        if (!value?.trim()) return true;

        const parsedYear = Number(value);
        if (!Number.isInteger(parsedYear)) {
          return "El año tiene que ser igual o posterior al actual";
        }

        return parsedYear >= currentYear
          ? true
          : "El año tiene que ser igual o posterior al actual";
      },
    }),
    [currentYear],
  );

  useEffect(() => {
    if (!referenceYear?.trim()) {
      clearErrors("mes_referencia_anio");
      return;
    }

    void trigger("mes_referencia_anio");
  }, [referenceYear, trigger, clearErrors]);

  useEffect(() => {
    const monthValue = buildReferenceMonth(referenceMonth, referenceYear);
    const nextDates = buildQuincenaDates(monthValue, quincena);
    if (!nextDates) return;

    setValue("fecha_inicio", nextDates.fecha_inicio, { shouldValidate: true });
    setValue("fecha_fin", nextDates.fecha_fin, { shouldValidate: true });
    setValue("fecha_pago", nextDates.fecha_pago, { shouldValidate: true });
    setValue("id_ciclo_pago", quincenalCycleId ? String(quincenalCycleId) : "", {
      shouldValidate: true,
    });
  }, [referenceMonth, referenceYear, quincena, quincenalCycleId, setValue]);

  return (
    <Stack gap="4">
      <SimpleGrid columns={2} gap="4">
        <InputField
          name="mes_referencia_mes"
          label="Mes"
          fieldType="month"
          monthOnly
          required
          placeholder="Seleccione el mes"
        />
        <InputField
          name="mes_referencia_anio"
          label="Año"
          fieldType="year"
          required
          min={String(currentYear)}
          rules={yearRules}
          placeholder={String(currentYear)}
        />
      </SimpleGrid>
      <InputField
        name="quincena"
        label="Quincena a pagar"
        fieldType="select"
        required
        disableSelectPortal
        options={[...QUINCENA_OPTIONS]}
        placeholder="Seleccione la quincena"
      />
      <InputField
        name="fecha_inicio"
        label="Fecha de inicio"
        fieldType="date"
        required
        readOnly
      />
      <InputField
        name="fecha_fin"
        label="Fecha de fin"
        fieldType="date"
        required
        readOnly
      />
      <InputField
        name="fecha_pago"
        label="Fecha de pago"
        fieldType="date"
        required
        readOnly
      />
      <InputField
        name="id_ciclo_pago"
        label="Ciclo de pago"
        fieldType="select"
        required
        disableSelectPortal
        options={quincenalCycleId ? [{ label: QUINCENAL_CYCLE_NAME, value: String(quincenalCycleId) }] : []}
        selectRootProps={{
          disabled: true,
        }}
      />
    </Stack>
  );
}

function SubmitPeriodButton({
  editingPeriod,
  isSaving,
  cycleOptionsLength,
  quincenalCycleId,
}: {
  editingPeriod: PeriodoPlanilla | null;
  isSaving: boolean;
  cycleOptionsLength: number;
  quincenalCycleId: number | null;
}) {
  const { watch, formState } = useFormContext<CreatePeriodoFormValues>();

  const isEditing = Boolean(editingPeriod);
  const values = watch();

  const isCreateFormComplete = Boolean(
    values.mes_referencia_mes
    && values.mes_referencia_anio
    && values.quincena
    && values.fecha_inicio
    && values.fecha_fin
    && values.fecha_pago
    && values.id_ciclo_pago,
  );

  const hasErrors = Object.keys(formState.errors).length > 0;
  const isDisabled = isEditing
    ? cycleOptionsLength === 0 || isSaving
    : !quincenalCycleId || isSaving || !isCreateFormComplete || hasErrors;

  return (
    <Button
      type="submit"
      colorPalette="blue"
      loading={isSaving}
      disabled={isDisabled}
    >
      {editingPeriod ? "Guardar cambios" : "Guardar periodo"}
    </Button>
  );
}

export const Planillas = () => {
  const { data: payrollPeriods = [], isLoading: isTableLoading, refetch } =
    useApiQuery<PeriodoPlanilla[]>({ url: "planillas/periodo_planilla" });

  const { mutate: createPeriod, isLoading: isCreating } =
    useApiMutation<PersistPeriodoPayload, void>({
      url: "planillas/periodo_planilla",
      method: "POST",
    });

  const { mutate: updatePeriod, isLoading: isUpdating } =
    useApiMutation<PersistPeriodoPayload, void, number>({
      url: (id) => `planillas/periodo_planilla/${id}`,
      method: "PATCH",
    });

  const { data: cycles = [], isLoading: isLoadingCycles } =
    useApiQuery<CicloPagoOption[]>({ url: "mantenimientos/ciclos-pago" });

  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PeriodoPlanilla | null>(null);
  const [periodToDelete, setPeriodToDelete] = useState<PeriodoPlanilla | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "fecha_inicio",
    dir: "desc",
  });
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [quincenaFilter, setQuincenaFilter] = useState<QuincenaFilter>("");
  const navigate = useNavigate();
  const pageSize = 8;

  const renderDate = useCallback((value: string) => formatDateUiCompact(value), []);

  const cycleOptions = useMemo(
    () =>
      cycles.map((cycle) => ({
        label: cycle.ciclo_pago,
        value: String(cycle.id),
      })),
    [cycles],
  );

  const filterYearOptions = useMemo(
    () =>
      Array.from(new Set(payrollPeriods.map((period) => getPeriodoYearValue(period)).filter(Boolean)))
        .sort((a, b) => Number(b) - Number(a)),
    [payrollPeriods],
  );

  const yearFilterMin = useMemo(() => {
    const minYear = filterYearOptions.length
      ? filterYearOptions[filterYearOptions.length - 1]
      : String(new Date().getFullYear());
    try { return parseDate(`${minYear}-01-01`); } catch { return undefined; }
  }, [filterYearOptions]);

  const yearFilterMax = useMemo(() => {
    const maxYear = filterYearOptions.length
      ? filterYearOptions[0]
      : String(new Date().getFullYear());
    try { return parseDate(`${maxYear}-12-31`); } catch { return undefined; }
  }, [filterYearOptions]);

  const quincenaFilterCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Primera quincena", value: "PRIMERA" },
          { label: "Segunda quincena", value: "SEGUNDA" },
        ],
      }),
    [],
  );

  const quincenalCycle = useMemo(
    () =>
      cycles.find(
        (cycle) => cycle.ciclo_pago.trim().toUpperCase() === QUINCENAL_CYCLE_NAME,
      ) ?? null,
    [cycles],
  );

  const defaultFormValues = useMemo<CreatePeriodoFormValues>(
    () => {
      const currentMonthValue = getCurrentMonthValue();
      const [currentYear, currentMonth] = currentMonthValue.split("-");

      return (
        editingPeriod
          ? {
            mes_referencia_mes: editingPeriod.fecha_inicio.slice(5, 7),
            mes_referencia_anio: editingPeriod.fecha_inicio.slice(0, 4),
            quincena: editingPeriod.fecha_inicio.slice(8, 10) === "01" ? "PRIMERA" : "SEGUNDA",
            fecha_inicio: editingPeriod.fecha_inicio,
            fecha_fin: editingPeriod.fecha_fin,
            fecha_pago: editingPeriod.fecha_pago,
            id_ciclo_pago: String(editingPeriod.id_ciclo_pago),
          }
          : {
            mes_referencia_mes: currentMonth,
            mes_referencia_anio: currentYear,
            quincena: "PRIMERA",
            fecha_inicio: "",
            fecha_fin: "",
            fecha_pago: "",
            id_ciclo_pago: quincenalCycle ? String(quincenalCycle.id) : "",
          }
      );
    },
    [editingPeriod, quincenalCycle],
  );

  const handleSubmitPeriod = async (values: CreatePeriodoFormValues) => {
    const isEditing = Boolean(editingPeriod);

    try {
      let payload: PersistPeriodoPayload;

      if (isEditing) {
        if (!values.id_ciclo_pago) {
          showToast("Seleccione un ciclo de pago.", "error");
          return false;
        }

        payload = {
          fecha_inicio: values.fecha_inicio,
          fecha_fin: values.fecha_fin,
          fecha_pago: values.fecha_pago,
          id_ciclo_pago: Number(values.id_ciclo_pago),
        };
      } else {
        if (!quincenalCycle) {
          showToast("No existe un ciclo de pago quincenal disponible para crear el periodo.", "error");
          return false;
        }

        const referenceMonth = buildReferenceMonth(
          values.mes_referencia_mes,
          values.mes_referencia_anio,
        );

        if (!referenceMonth || !values.quincena) {
          showToast("Seleccione el mes y la quincena a pagar.", "error");
          return false;
        }

        const automaticDates = buildQuincenaDates(referenceMonth, values.quincena);
        if (!automaticDates) {
          showToast("No se pudieron calcular las fechas del periodo seleccionado.", "error");
          return false;
        }

        if (
          values.quincena === "SEGUNDA"
          && !hasFirstHalfPeriodForMonth({
            payrollPeriods,
            monthValue: referenceMonth,
            quincenalCycleId: quincenalCycle.id,
          })
        ) {
          showToast(
            "No corresponde crear la segunda quincena porque en ese mes falta registrar la primera quincena.",
            "error",
          );
          return false;
        }

        payload = {
          ...automaticDates,
          id_ciclo_pago: quincenalCycle.id,
        };
      }

      if (editingPeriod) {
        await updatePeriod(editingPeriod.id, payload);
        showToast("Periodo de planilla actualizado.", "success");
      } else {
        await createPeriod(payload);
        showToast("Periodo de planilla creado.", "success");
      }

      await refetch();
      setShowForm(false);
      setEditingPeriod(null);
      return true;
    } catch (error) {
      console.log(error);

      const apiMessage =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;

      if (!apiMessage) {
        showToast(
          "No se pudo guardar el periodo. Revise la información e intente nuevamente.",
          "error",
        );
      }

      return false;
    }
  };

  const handleStartCreate = () => {
    setEditingPeriod(null);
    setShowForm((prev) => !prev);
  };

  const handleEditPeriod = (period: PeriodoPlanilla) => {
    setEditingPeriod(period);
    setShowForm(true);
  };

  const handleDeletePeriod = async (period: PeriodoPlanilla) => {
    try {
      await deletePeriodoPlanilla(period.id);
      await refetch();
      showToast("Periodo eliminado.", "success");
      setPeriodToDelete(null);
    } catch (error) {
      console.log(error);
      showToast("No se pudo eliminar el periodo.", "error");
    }
  };

  const isSaving = isCreating || isUpdating;

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

  const filteredPayrollPeriods = useMemo(
    () =>
      payrollPeriods.filter((period) => {
        if (monthFilter && getPeriodoMonthValue(period) !== monthFilter) return false;
        if (yearFilter && getPeriodoYearValue(period) !== yearFilter) return false;
        if (quincenaFilter && getPeriodoQuincenaValue(period) !== quincenaFilter) return false;
        return true;
      }),
    [monthFilter, payrollPeriods, quincenaFilter, yearFilter],
  );

  const sortedPayrollPeriods = useMemo(() => {
    const direction = sort.dir === "asc" ? 1 : -1;

    const getSortValue = (period: PeriodoPlanilla) => {
      if (sort.field === "fecha_fin") return toDateSortValue(period.fecha_fin);
      if (sort.field === "fecha_pago") return toDateSortValue(period.fecha_pago);
      return toDateSortValue(period.fecha_inicio);
    };

    return [...filteredPayrollPeriods].sort((left, right) => {
      const leftValue = getSortValue(left);
      const rightValue = getSortValue(right);

      if (leftValue === rightValue) {
        return right.id - left.id;
      }

      return (leftValue - rightValue) * direction;
    });
  }, [filteredPayrollPeriods, sort]);

  useEffect(() => {
    setPage(1);
  }, [monthFilter, yearFilter, quincenaFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedPayrollPeriods.length / pageSize));

  useEffect(() => {
    setPage((currentPage) => (currentPage > totalPages ? totalPages : currentPage));
  }, [totalPages]);

  const paginatedPayrollPeriods = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedPayrollPeriods.slice(start, start + pageSize);
  }, [sortedPayrollPeriods, page]);

  const columns = useMemo<DataTableColumn<PeriodoPlanilla>[]>(
    () => [
      {
        id: "periodo",
        header: "Periodo",
        w: "170px",
        textAlign: "left",
        cell: (period) => getPeriodoDisplayLabel(period),
      },
      {
        id: "fecha_inicio",
        header: buildSortHeader("Fecha inicio", "fecha_inicio"),
        w: "120px",
        textAlign: "left",
        cell: (period) => renderDate(period.fecha_inicio),
      },
      {
        id: "fecha_fin",
        header: buildSortHeader("Fecha fin", "fecha_fin"),
        w: "120px",
        textAlign: "left",
        cell: (period) => renderDate(period.fecha_fin),
      },
      {
        id: "fecha_pago",
        header: buildSortHeader("Fecha pago", "fecha_pago"),
        w: "120px",
        textAlign: "left",
        cell: (period) => renderDate(period.fecha_pago),
      },
      {
        id: "estado",
        header: "Estado",
        w: "90px",
        textAlign: "left",
        cell: (period) => (
          <Badge colorPalette={getEstadoBadgeColor(period.estado)}>
            {period.estado}
          </Badge>
        ),
      },
    ],
    [buildSortHeader, renderDate],
  );

  const actionColumn = useMemo<DataTableActionColumn<PeriodoPlanilla>>(
    () => ({
      header: "Acciones",
      textAlign: "center",
      w: "80px",
      sticky: true,
      cell: (period) => (
        <Stack >
          <Button
            variant="subtle"
            colorPalette="blue"
            size="sm"
            onClick={() => navigate(`/planillas/periodo_planilla/${period.id}`)}
          >
            <FiEye /> Ver
          </Button>
          <Button
            variant="subtle"
            colorPalette="yellow"
            size="sm"
            onClick={() => handleEditPeriod(period)}
          >
            <FiEdit2 /> Editar
          </Button>
          <Button
            variant="subtle"
            size="sm"
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
    <Layout pageTitle="Generación y gestión de planillas">
      <Stack gap="6" marginBottom="100px">
        <Button
          colorPalette="blue"
          alignSelf="flex-start"
          onClick={handleStartCreate}
        >
          <FiFilePlus />
          {showForm && !editingPeriod ? " Cerrar formulario" : " Crear periodo de planilla"}
        </Button>

        <Modal
          title={editingPeriod ? "Editar periodo de planilla" : "Nuevo periodo de planilla"}
          isOpen={showForm}
          size="lg"
          onOpenChange={(e) => {
            setShowForm(e.open);
            if (!e.open) {
              setEditingPeriod(null);
            }
          }}
          content={
            showForm ? (
              <Form<CreatePeriodoFormValues>
                key={editingPeriod ? `edit-${editingPeriod.id}` : `create-${quincenalCycle?.id ?? "pending"}`}
                onSubmit={handleSubmitPeriod}
                defaultValues={defaultFormValues}
                resetOnSuccess={!editingPeriod}
                formOptions={{ mode: "onChange" }}
              >
                <Stack gap="4">
                  {editingPeriod ? (
                    <Stack gap="4">
                      <InputField
                        name="fecha_inicio"
                        label="Fecha de inicio"
                        fieldType="date"
                        required
                      />
                      <InputField
                        name="fecha_fin"
                        label="Fecha de fin"
                        fieldType="date"
                        required
                      />
                      <InputField
                        name="fecha_pago"
                        label="Fecha de pago"
                        fieldType="date"
                        required
                      />
                      <InputField
                        name="id_ciclo_pago"
                        label="Ciclo de pago"
                        fieldType="select"
                        required
                        disableSelectPortal
                        options={cycleOptions}
                        placeholder={
                          cycleOptions.length === 0
                            ? isLoadingCycles
                              ? "Cargando ciclos..."
                              : "Sin ciclos disponibles"
                            : "Seleccione un ciclo de pago"
                        }
                        selectRootProps={{
                          disabled: cycleOptions.length === 0,
                        }}
                      />
                    </Stack>
                  ) : (
                    <CreatePeriodFields quincenalCycleId={quincenalCycle?.id ?? null} />
                  )}
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
                    <SubmitPeriodButton
                      editingPeriod={editingPeriod}
                      isSaving={isSaving}
                      cycleOptionsLength={cycleOptions.length}
                      quincenalCycleId={quincenalCycle?.id ?? null}
                    />
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
                  <Dialog.Title>Eliminar periodo de planilla</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap="3">
                    <Text>
                      {periodToDelete
                        ? `Se eliminará el período del ${renderDate(periodToDelete.fecha_inicio)} al ${renderDate(periodToDelete.fecha_fin)}.`
                        : "Se eliminará el período seleccionado."}
                    </Text>
                    <Text color="fg.muted">
                      También se eliminarán primero todas las planillas asociadas a este período y luego el período de planilla.
                    </Text>
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="outline">Cancelar</Button>
                  </Dialog.ActionTrigger>
                  <Button
                    colorPalette="red"
                    onClick={async () => {
                      if (!periodToDelete) return;
                      await handleDeletePeriod(periodToDelete);
                    }}
                  >
                    Eliminar período
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
          <MonthPickerBase
            monthOnly
            value={monthFilter}
            onChange={setMonthFilter}
            placeholder="Todos"
            label="Mes"
            clearable
          />

          <YearPickerBase
            value={yearFilter}
            onChange={setYearFilter}
            placeholder="Todos"
            label="Año"
            clearable
            min={yearFilterMin}
            max={yearFilterMax}
          />

          <Select.Root
            collection={quincenaFilterCollection}
            value={quincenaFilter ? [quincenaFilter] : []}
            onValueChange={(event) => setQuincenaFilter((event.value?.[0] as QuincenaFilter) ?? "")}
            size="sm"
          >
            <Select.HiddenSelect />
            <Select.Label>Quincena</Select.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Todas" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.ClearTrigger />
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {quincenaFilterCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </SimpleGrid>

        {isTableLoading ? (
          <Spinner alignSelf="center" size="lg" />
        ) : payrollPeriods.length === 0 ? (
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
                <PiMoney />
              </EmptyState.Indicator>
              <Stack textAlign="center" gap="2">
                <EmptyState.Title>
                  Aún no existen periodos de planilla registrados.
                </EmptyState.Title>
                <EmptyState.Description>
                  Empieza creando un periodo de planillas.
                </EmptyState.Description>
              </Stack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <DataTable<PeriodoPlanilla>
            data={paginatedPayrollPeriods}
            columns={columns}
            actionColumn={actionColumn}
            isDataLoading={isTableLoading}
            size="md"
            pagination={{
              enabled: true,
              page,
              pageSize,
              totalCount: sortedPayrollPeriods.length,
              onPageChange: setPage,
            }}
          />
        )}
      </Stack>
    </Layout>
  );
};
