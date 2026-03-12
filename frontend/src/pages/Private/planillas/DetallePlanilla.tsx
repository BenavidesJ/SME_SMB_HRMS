/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Badge,
  Box,
  Button,
  Card,
  CloseButton,
  Flex,
  Heading,
  HStack,
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
import { FiArrowDown, FiArrowUp, FiEye, FiRefreshCw, FiUser } from "react-icons/fi";
import { Layout } from "../../../components/layout";
import { Form } from "../../../components/forms/Form/Form";
import { Modal } from "../../../components/general";
import { DataTable } from "../../../components/general/table/DataTable";
import type { DataTableColumn } from "../../../components/general/table/types";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { toTitleCase, formatCRC } from "../../../utils";
import { showToast } from "../../../services/toast/toastService";
import { useAuth } from "../../../context/AuthContext";
import type { EmployeeRow } from "../../../types";

const COMPANY_NAME = "BioAlquimia";

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

type GenerarResponse = {
  generados: Array<{
    id_colaborador: number;
    nombre_completo: string;
    identificacion: string | null;
    salario_neto: number;
    id_detalle: number;
    id_contrato: number;
  }>;
  duplicados: Array<{
    id_colaborador: number;
    nombre_completo: string;
    id_detalle: number;
  }>;
  errores: Array<{
    id_colaborador: number;
    nombre_completo: string;
    motivo: string;
  }>;
  aprobacion?: {
    aprobado: boolean;
    estado_actualizado: boolean;
    total_elegibles: number;
    total_generados: number;
    total_pendientes: number;
  };
  mensaje: string;
};

type RecalcularPayload = {
  id_periodo: number;
  colaboradores: number[];
  generado_por?: number;
};

type EligibleCollaborator = {
  id_colaborador: number;
  id_contrato: number;
  nombre_completo: string;
  identificacion: string | null;
  fecha_inicio_contrato: string;
  tiene_planilla: boolean;
};

type EligibleCollaboratorsResponse = {
  id_periodo: number;
  fecha_inicio: string;
  fecha_fin: string;
  colaboradores: EligibleCollaborator[];
  total_elegibles: number;
  total_generados: number;
  total_pendientes: number;
};

type SimulationRowState = {
  reviewed: boolean;
  generated: boolean;
  isGenerating: boolean;
  error: string | null;
};

type ReviewTableSortField = "fullName" | "salarioMensual" | "bruto" | "deducciones" | "neto" | "estado";

type ReviewTableRow = {
  kind: "generated" | "simulation";
  collaboratorId: number;
  fullName: string;
  identification: string | null;
  salarioMensual: number;
  bruto: number;
  deducciones: number;
  neto: number;
  simulationItem?: SimulacionResultado;
  detail?: PayrollDetail;
};

type SortDir = "asc" | "desc";

function getSimulationStatus(rowState?: SimulationRowState) {
  if (rowState?.generated) {
    return { label: "Calculada", colorPalette: "green" as const };
  }

  if (rowState?.isGenerating) {
    return { label: "Calculando", colorPalette: "blue" as const };
  }

  if (rowState?.error) {
    return { label: "Error", colorPalette: "red" as const };
  }

  if (rowState?.reviewed) {
    return { label: "Lista para calcular", colorPalette: "cyan" as const };
  }

  return { label: "Pendiente de revisión", colorPalette: "yellow" as const };
}

function SortHeader({
  label,
  field,
  currentSortBy,
  currentSortDir,
  onChange,
}: {
  label: string;
  field: ReviewTableSortField;
  currentSortBy: ReviewTableSortField;
  currentSortDir: SortDir;
  // eslint-disable-next-line no-unused-vars
  onChange: (_field: ReviewTableSortField) => void;
}) {
  const isActive = currentSortBy === field;
  const icon = isActive && currentSortDir === "asc" ? <FiArrowUp /> : <FiArrowDown />;

  return (
    <Button variant="ghost" size="xs" px="0" onClick={() => onChange(field)}>
      <HStack gap="1">
        <Text>{label}</Text>
        <Box color={isActive ? "brand.blue.600" : "fg.muted"}>{icon}</Box>
      </HStack>
    </Button>
  );
}

function DetailInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="0.5">
      <Text fontSize="xs" color="fg.muted" textTransform="uppercase">{label}</Text>
      <Text fontWeight="semibold">{value}</Text>
    </Stack>
  );
}

// ── Component ──

export const DetallePlanilla = () => {
  const { id } = useParams<{ id: string }>();
  const periodoId = Number(id);
  const periodoIdIsValid = Number.isInteger(periodoId) && periodoId > 0;
  const { user } = useAuth();

  // ── Period data ──
  const {
    data: periodoData,
    isLoading: isPeriodoLoading,
    refetch: refetchPeriodo,
  } =
    useApiQuery<PayrollPeriod | null>({
      url: periodoIdIsValid ? `planillas/periodo_planilla/${periodoId}` : "",
      enabled: periodoIdIsValid,
    });

  const periodo = periodoData ?? null;

  // ── Collaborators data ──
  const { data: employees = [] } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const {
    data: eligibleData,
    isLoading: eligibleLoading,
    refetch: refetchEligibleCollaborators,
  } = useApiQuery<EligibleCollaboratorsResponse | null>({
    url: periodoIdIsValid
      ? `planillas/periodo_planilla/${periodoId}/colaboradores-elegibles`
      : "",
    enabled: periodoIdIsValid,
  });

  const eligibleCollaborators = useMemo(
    () => eligibleData?.colaboradores ?? [],
    [eligibleData],
  );
  const pendingEligibleCollaborators = useMemo(
    () =>
      eligibleCollaborators.filter((collaborator) => !collaborator.tiene_planilla),
    [eligibleCollaborators],
  );

  const pendingEligibleCollaboratorIds = useMemo(
    () => pendingEligibleCollaborators.map((item) => item.id_colaborador),
    [pendingEligibleCollaborators],
  );

  const allCollaboratorIds = useMemo(
    () =>
      employees
        .map((emp) => Number(emp.id))
        .filter((val) => Number.isInteger(val) && val > 0),
    [employees],
  );

  const defaultSelectedCollaborators = useMemo(
    () => pendingEligibleCollaboratorIds.map((collaboratorId) => String(collaboratorId)),
    [pendingEligibleCollaboratorIds],
  );

  const hasPendingEligibleCollaborators = pendingEligibleCollaboratorIds.length > 0;

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
  const [simulationRowsState, setSimulationRowsState] = useState<
    Record<number, SimulationRowState>
  >({});
  const [selectedSimulationItem, setSelectedSimulationItem] =
    useState<SimulacionResultado | null>(null);
  const [selectedGeneratedCollaboratorId, setSelectedGeneratedCollaboratorId] =
    useState<number | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [reviewTableQuery, setReviewTableQuery] = useState<{
    page: number;
    limit: number;
    sortBy: ReviewTableSortField;
    sortDir: SortDir;
  }>({
    page: 1,
    limit: 10,
    sortBy: "fullName",
    sortDir: "asc",
  });

  // ── Create ──
  const { mutate: generarPlanilla, isLoading: isGenerating } = useApiMutation<
    GenerarPayload,
    GenerarResponse
  >({ url: "planillas", method: "POST" });

  // ── Recalculate ──
  const { mutate: recalcularPlanilla, isLoading: isRecalculating } =
    useApiMutation<RecalcularPayload, any>({
      url: "planillas/recalcular",
      method: "PATCH",
    });

  // ── Existing records ──
  const { mutate: fetchPayrollDetails } =
    useApiMutation<PayrollDetailsPayload, PayrollDetailsResponse>({
      url: "planillas/detalle",
      method: "POST",
    });

  const [existingDetails, setExistingDetails] =
    useState<PayrollDetailsResponse | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [recalculatingCollaboratorId, setRecalculatingCollaboratorId] =
    useState<number | null>(null);

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
    if (!periodoIdIsValid || allCollaboratorIds.length === 0 || initialFetchDone) return;
    setInitialFetchDone(true);
    loadExistingDetails({ silent: true });
  }, [periodoIdIsValid, allCollaboratorIds.length, initialFetchDone, loadExistingDetails]);

  const refreshPayrollContext = useCallback(async () => {
    await Promise.all([
      loadExistingDetails({ silent: true }),
      refetchEligibleCollaborators(),
      refetchPeriodo(),
    ]);
  }, [loadExistingDetails, refetchEligibleCollaborators, refetchPeriodo]);

  const applyGenerationResult = useCallback(
    (payload: GenerarResponse, collaboratorIds: number[]) => {
      const generatedIds = new Set(
        (payload.generados ?? []).map((item) => Number(item.id_colaborador)),
      );
      const duplicatedIds = new Set(
        (payload.duplicados ?? []).map((item) => Number(item.id_colaborador)),
      );
      const errorMap = new Map(
        (payload.errores ?? []).map((item) => [Number(item.id_colaborador), item.motivo]),
      );

      setSimulationRowsState((prev) => {
        const next = { ...prev };
        collaboratorIds.forEach((collaboratorId) => {
          const current = prev[collaboratorId];
          next[collaboratorId] = {
            reviewed: current?.reviewed ?? false,
            generated:
              current?.generated
              || generatedIds.has(collaboratorId)
              || duplicatedIds.has(collaboratorId),
            isGenerating: false,
            error: errorMap.get(collaboratorId) ?? null,
          };
        });
        return next;
      });
    },
    [],
  );

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
      setSelectedSimulationItem(null);
      setSimulationRowsState(
        Object.fromEntries(
          data.map((item: SimulacionResultado) => [
            item.id_colaborador,
            {
              reviewed: false,
              generated: false,
              isGenerating: false,
              error: null,
            },
          ]),
        ),
      );
      return true;
    } catch {
      setSimulacion([]);
      setSimulacionMeta(null);
      setSimulationRowsState({});
      setSelectedSimulationItem(null);
      return false;
    }
  };

  const markSimulationReviewed = (item: SimulacionResultado) => {
    setSelectedSimulationItem(item);
    setSimulationRowsState((prev) => ({
      ...prev,
      [item.id_colaborador]: {
        reviewed: true,
        generated: prev[item.id_colaborador]?.generated ?? false,
        isGenerating: prev[item.id_colaborador]?.isGenerating ?? false,
        error: prev[item.id_colaborador]?.error ?? null,
      },
    }));
  };

  const handleCrearIndividual = async (collaboratorId: number) => {
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

    setSimulationRowsState((prev) => ({
      ...prev,
      [collaboratorId]: {
        reviewed: prev[collaboratorId]?.reviewed ?? false,
        generated: prev[collaboratorId]?.generated ?? false,
        isGenerating: true,
        error: null,
      },
    }));

    try {
      const response = await generarPlanilla({
        id_periodo: periodoId,
        colaboradores: [collaboratorId],
        generado_por: Number(user.id),
      });

      applyGenerationResult(response, [collaboratorId]);
      await refreshPayrollContext();
    } catch (err: any) {
      if (err?.status === 409) {
        setSimulationRowsState((prev) => ({
          ...prev,
          [collaboratorId]: {
            reviewed: prev[collaboratorId]?.reviewed ?? false,
            generated: true,
            isGenerating: false,
            error: null,
          },
        }));
        await refreshPayrollContext();
        return;
      }

      setSimulationRowsState((prev) => ({
        ...prev,
        [collaboratorId]: {
          reviewed: prev[collaboratorId]?.reviewed ?? false,
          generated: prev[collaboratorId]?.generated ?? false,
          isGenerating: false,
          error: err?.message ?? "No se pudo calcular la planilla.",
        },
      }));
    }
  };

  const handleCrearTodas = async () => {
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

    const pendingIds = simulacion
      .filter((item) => !simulationRowsState[item.id_colaborador]?.generated)
      .map((item) => item.id_colaborador);

    if (pendingIds.length === 0) {
      showToast("No hay planillas pendientes por calcular en esta simulación.", "info");
      return;
    }

    setIsGeneratingAll(true);
    setSimulationRowsState((prev) => {
      const next = { ...prev };
      pendingIds.forEach((collaboratorId) => {
        next[collaboratorId] = {
          reviewed: prev[collaboratorId]?.reviewed ?? false,
          generated: prev[collaboratorId]?.generated ?? false,
          isGenerating: true,
          error: null,
        };
      });
      return next;
    });

    try {
      const response = await generarPlanilla({
        id_periodo: periodoId,
        colaboradores: pendingIds,
        generado_por: Number(user.id),
      });

      applyGenerationResult(response, pendingIds);
      await refreshPayrollContext();
    } catch (err: any) {
      const duplicatedIds =
        err?.details?.data?.duplicados?.map((item: { id_colaborador: number }) => Number(item.id_colaborador))
        ?? [];
      const errorMap = new Map(
        (err?.details?.data?.errores ?? []).map(
          (item: { id_colaborador: number; motivo: string }) => [Number(item.id_colaborador), item.motivo],
        ),
      );

      setSimulationRowsState((prev) => {
        const next = { ...prev };
        pendingIds.forEach((collaboratorId) => {
          next[collaboratorId] = {
            reviewed: prev[collaboratorId]?.reviewed ?? false,
            generated:
              (prev[collaboratorId]?.generated ?? false)
              || duplicatedIds.includes(collaboratorId),
            isGenerating: false,
            error:
              errorMap.get(collaboratorId)
              ?? (duplicatedIds.includes(collaboratorId) ? null : err?.message ?? "No se pudo calcular la planilla."),
          };
        });
        return next;
      });

      if (duplicatedIds.length > 0) {
        await refreshPayrollContext();
      }
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const existingDetailsList = useMemo(
    () => existingDetails?.detalles ?? [],
    [existingDetails],
  );

  const collaboratorMetaMap = useMemo(() => {
    const map = new Map<number, { fullName: string; identification: string | null }>();

    eligibleCollaborators.forEach((collaborator) => {
      map.set(collaborator.id_colaborador, {
        fullName: toTitleCase(collaborator.nombre_completo),
        identification: collaborator.identificacion,
      });
    });

    simulacion.forEach((item) => {
      map.set(item.id_colaborador, {
        fullName: toTitleCase(item.nombre_completo),
        identification: item.identificacion,
      });
    });

    employees.forEach((emp) => {
      const collaboratorId = Number(emp.id);
      if (!Number.isInteger(collaboratorId) || map.has(collaboratorId)) return;

      map.set(collaboratorId, {
        fullName: toTitleCase(
          `${emp.nombre} ${emp.primer_apellido} ${emp.segundo_apellido}`.trim(),
        ),
        identification: null,
      });
    });

    return map;
  }, [eligibleCollaborators, simulacion, employees]);

  const handleRecalcular = async (colaboradorId: number) => {
    if (!periodoIdIsValid) return;

    setRecalculatingCollaboratorId(colaboradorId);

    try {
      await recalcularPlanilla({
        id_periodo: periodoId,
        colaboradores: [colaboradorId],
        generado_por: user?.id ? Number(user.id) : undefined,
      });

      await refreshPayrollContext();
    } catch {
      // toast automático vía interceptor
    } finally {
      setRecalculatingCollaboratorId(null);
    }
  };

  // ── Computed ──
  const totalSimulado = useMemo(
    () => simulacion.reduce((acc, r) => acc + (r.salario_neto ?? 0), 0),
    [simulacion],
  );

  const reviewedSimulationsCount = useMemo(
    () =>
      simulacion.filter(
        (item) => simulationRowsState[item.id_colaborador]?.reviewed,
      ).length,
    [simulacion, simulationRowsState],
  );

  const generatedSimulationsCount = useMemo(
    () =>
      simulacion.filter(
        (item) => simulationRowsState[item.id_colaborador]?.generated,
      ).length,
    [simulacion, simulationRowsState],
  );

  const pendingSimulationItems = useMemo(
    () =>
      simulacion.filter(
        (item) => !simulationRowsState[item.id_colaborador]?.generated,
      ),
    [simulacion, simulationRowsState],
  );

  const reviewTableRows = useMemo(() => {
    const rowsByCollaborator = new Map<number, ReviewTableRow>();

    existingDetailsList.forEach((detail) => {
      const collaboratorMeta = collaboratorMetaMap.get(detail.id_colaborador);
      rowsByCollaborator.set(detail.id_colaborador, {
        kind: "generated",
        collaboratorId: detail.id_colaborador,
        fullName: collaboratorMeta?.fullName ?? `Colaborador #${detail.id_colaborador}`,
        identification: collaboratorMeta?.identification ?? null,
        salarioMensual: detail.salario_mensual,
        bruto: detail.salario_devengado,
        deducciones: detail.total_deducciones,
        neto: detail.salario_neto,
        detail,
      });
    });

    simulacion.forEach((item) => {
      if (rowsByCollaborator.has(item.id_colaborador)) return;

      rowsByCollaborator.set(item.id_colaborador, {
        kind: "simulation",
        collaboratorId: item.id_colaborador,
        fullName: toTitleCase(item.nombre_completo),
        identification: item.identificacion,
        salarioMensual: item.salario_mensual,
        bruto: item.salario_devengado,
        deducciones: item.total_deducciones,
        neto: item.salario_neto,
        simulationItem: item,
      });
    });

    return Array.from(rowsByCollaborator.values());
  }, [existingDetailsList, collaboratorMetaMap, simulacion]);

  const sortedReviewTableRows = useMemo(() => {
    const direction = reviewTableQuery.sortDir === "asc" ? 1 : -1;
    const stateValue = (row: ReviewTableRow) => {
      if (row.kind === "generated") return 4;
      const rowState = row.simulationItem
        ? simulationRowsState[row.simulationItem.id_colaborador]
        : undefined;
      if (rowState?.error) return 0;
      if (rowState?.generated) return 4;
      if (rowState?.isGenerating) return 3;
      if (rowState?.reviewed) return 2;
      return 1;
    };

    return [...reviewTableRows].sort((left, right) => {
      if (reviewTableQuery.sortBy === "fullName") {
        return direction * left.fullName.localeCompare(right.fullName, "es-CR");
      }

      if (reviewTableQuery.sortBy === "estado") {
        return direction * (stateValue(left) - stateValue(right));
      }

      return direction * ((left[reviewTableQuery.sortBy] as number) - (right[reviewTableQuery.sortBy] as number));
    });
  }, [reviewTableRows, reviewTableQuery.sortBy, reviewTableQuery.sortDir, simulationRowsState]);

  const totalReviewPages = Math.max(1, Math.ceil(sortedReviewTableRows.length / reviewTableQuery.limit));

  useEffect(() => {
    if (reviewTableQuery.page <= totalReviewPages) return;
    setReviewTableQuery((prev) => ({ ...prev, page: totalReviewPages }));
  }, [reviewTableQuery.page, totalReviewPages]);

  const paginatedReviewTableRows = useMemo(() => {
    const start = (reviewTableQuery.page - 1) * reviewTableQuery.limit;
    return sortedReviewTableRows.slice(start, start + reviewTableQuery.limit);
  }, [sortedReviewTableRows, reviewTableQuery.page, reviewTableQuery.limit]);

  const selectedGeneratedPayroll = useMemo(
    () =>
      reviewTableRows.find(
        (row) => row.kind === "generated" && row.collaboratorId === selectedGeneratedCollaboratorId,
      ) ?? null,
    [reviewTableRows, selectedGeneratedCollaboratorId],
  );

  const handleReviewTableSortChange = (field: ReviewTableSortField) => {
    setReviewTableQuery((prev) => ({
      ...prev,
      page: 1,
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const reviewTableColumns = useMemo<Array<DataTableColumn<ReviewTableRow>>>(
    () => [
      {
        id: "fullName",
        header: (
          <SortHeader
            label="Colaborador"
            field="fullName"
            currentSortBy={reviewTableQuery.sortBy}
            currentSortDir={reviewTableQuery.sortDir}
            onChange={handleReviewTableSortChange}
          />
        ),
        minW: "280px",
        cell: (row) => (
          <Stack gap="0">
            <Text fontWeight="semibold">{row.fullName}</Text>
            <Text textStyle="xs" color="fg.muted">
              {row.identification ?? "Sin identificación"}
            </Text>
          </Stack>
        ),
      },
      {
        id: "salarioMensual",
        header: (
          <SortHeader
            label="Salario mensual"
            field="salarioMensual"
            currentSortBy={reviewTableQuery.sortBy}
            currentSortDir={reviewTableQuery.sortDir}
            onChange={handleReviewTableSortChange}
          />
        ),
        minW: "170px",
        textAlign: "right",
        cell: (row) => formatCRC(row.salarioMensual),
      },
      {
        id: "bruto",
        header: (
          <SortHeader
            label="Bruto"
            field="bruto"
            currentSortBy={reviewTableQuery.sortBy}
            currentSortDir={reviewTableQuery.sortDir}
            onChange={handleReviewTableSortChange}
          />
        ),
        minW: "150px",
        textAlign: "right",
        cell: (row) => formatCRC(row.bruto),
      },
      {
        id: "deducciones",
        header: (
          <SortHeader
            label="Deducciones"
            field="deducciones"
            currentSortBy={reviewTableQuery.sortBy}
            currentSortDir={reviewTableQuery.sortDir}
            onChange={handleReviewTableSortChange}
          />
        ),
        minW: "160px",
        textAlign: "right",
        cell: (row) => <Text color="red.600">-{formatCRC(row.deducciones)}</Text>,
      },
      {
        id: "neto",
        header: (
          <SortHeader
            label="Neto"
            field="neto"
            currentSortBy={reviewTableQuery.sortBy}
            currentSortDir={reviewTableQuery.sortDir}
            onChange={handleReviewTableSortChange}
          />
        ),
        minW: "160px",
        textAlign: "right",
        cell: (row) => <Text fontWeight="bold" color="green.600">{formatCRC(row.neto)}</Text>,
      },
      {
        id: "estado",
        header: (
          <SortHeader
            label="Estado"
            field="estado"
            currentSortBy={reviewTableQuery.sortBy}
            currentSortDir={reviewTableQuery.sortDir}
            onChange={handleReviewTableSortChange}
          />
        ),
        minW: "220px",
        cell: (row) => {
          if (row.kind === "generated") {
            return <Badge colorPalette="green" variant="subtle">Generada</Badge>;
          }

          const rowState = row.simulationItem
            ? simulationRowsState[row.simulationItem.id_colaborador]
            : undefined;
          const status = getSimulationStatus(rowState);

          return (
            <Stack gap="1">
              <Badge colorPalette={status.colorPalette} variant="subtle">
                {status.label}
              </Badge>
              {rowState?.error && (
                <Text textStyle="xs" color="red.600">
                  {rowState.error}
                </Text>
              )}
            </Stack>
          );
        },
      },
    ],
    [reviewTableQuery.sortBy, reviewTableQuery.sortDir, simulationRowsState],
  );

  const allSimulationsReviewed =
    simulacion.length > 0 && reviewedSimulationsCount === simulacion.length;

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
          <Stack gap="6">
            <Stack
              direction={{ base: "column", xl: "row" }}
              align="flex-start"
              gap="6"
            >
              <Card.Root
                as="section"
                w={{ base: "full", xl: "560px" }}
                flexShrink={0}
              >
                <Card.Header>
                  <Card.Title>Calcular planilla quincenal</Card.Title>
                  <Card.Description>
                    Revisa cuidadosamente cada planilla para asegurar que los datos son correctos.
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

                      <Stack gap="0">
                        <Text textStyle="sm" color="fg.muted">
                          Estado del período
                        </Text>
                        <Badge
                          w="fit-content"
                          colorPalette={
                            String(periodo?.estado ?? "").trim().toUpperCase() === "APROBADO"
                              ? "green"
                              : "yellow"
                          }
                        >
                          {periodo?.estado ?? "Sin estado"}
                        </Badge>
                      </Stack>

                      <Stack gap="0">
                        <Text textStyle="sm" color="fg.muted">
                          Elegibles pendientes
                        </Text>
                        <Heading size="sm">
                          {eligibleLoading ? "…" : pendingEligibleCollaborators.length}
                        </Heading>
                      </Stack>
                    </SimpleGrid>
                    <SelectedCollaboratorsBadges
                      collaborators={pendingEligibleCollaborators}
                      defaultCollaboratorIds={defaultSelectedCollaborators}
                      isLoading={eligibleLoading}
                    />
                  </Stack>
                </Card.Body>

                <Card.Footer justifyContent="flex-end" gap="3">
                  <Button
                    type="submit"
                    colorPalette="blue"
                    variant="outline"
                    loading={isSimulating}
                    disabled={
                      !periodoIdIsValid ||
                      eligibleLoading ||
                      !hasPendingEligibleCollaborators ||
                      isGenerating ||
                      isGeneratingAll
                    }
                  >
                    Pre cálculo
                  </Button>

                  {simulacion.length > 0 && (
                    <Button
                      type="button"
                      colorPalette="green"
                      loading={isGeneratingAll}
                      disabled={
                        !allSimulationsReviewed
                        || pendingSimulationItems.length === 0
                        || isGenerating
                        || isGeneratingAll
                      }
                      onClick={handleCrearTodas}
                    >
                      Calcular todas ({pendingSimulationItems.length})
                    </Button>
                  )}
                </Card.Footer>
              </Card.Root>

              {(isSimulating || simulacion.length > 0) && (
                <Stack flex="1" gap="4" w="full">
                  {isSimulating ? (
                    <Stack align="center" py="10" gap="3">
                      <Spinner size="lg" />
                      <Text color="fg.muted">Ejecutando pre cálculo…</Text>
                    </Stack>
                  ) : (
                    <Card.Root>
                      <Card.Body>
                        <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} gap="4">
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
                              {formatDate(simulacionMeta?.fecha_inicio)} – {formatDate(simulacionMeta?.fecha_fin)}
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
                          <Box>
                            <Text textStyle="xs" color="fg.muted">
                              Revisadas
                            </Text>
                            <Heading size="md">
                              {reviewedSimulationsCount}/{simulacion.length}
                            </Heading>
                          </Box>
                          <Box>
                            <Text textStyle="xs" color="fg.muted">
                              Calculadas
                            </Text>
                            <Heading size="md">
                              {generatedSimulationsCount}/{simulacion.length}
                            </Heading>
                          </Box>
                        </SimpleGrid>
                      </Card.Body>
                    </Card.Root>
                  )}
                </Stack>
              )}
            </Stack>

            <Card.Root>
              <Card.Header>
                <Card.Title>Tabla de Revision de planillas</Card.Title>
              </Card.Header>
              <Card.Body>
                <DataTable
                  columns={reviewTableColumns}
                  data={paginatedReviewTableRows}
                  isDataLoading={isSimulating && reviewTableRows.length === 0}
                  actionColumn={{
                    header: "Acciones",
                    w: "220px",
                    cell: (row) => {
                      if (row.kind === "generated") {
                        return (
                          <Flex justify="flex-end">
                            <Button
                              size="xs"
                              colorPalette="orange"
                              loading={
                                isRecalculating
                                && recalculatingCollaboratorId === row.collaboratorId
                              }
                              disabled={
                                (isRecalculating
                                  && recalculatingCollaboratorId === row.collaboratorId)
                                || isGeneratingAll
                                || isGenerating
                              }
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRecalcular(row.collaboratorId);
                              }}
                            >
                              <FiRefreshCw />
                              Recalcular
                            </Button>
                          </Flex>
                        );
                      }

                      const item = row.simulationItem;
                      if (!item) return null;

                      const rowState = simulationRowsState[item.id_colaborador];

                      return (
                        <Flex justify="flex-end" gap="2" wrap="wrap">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              markSimulationReviewed(item);
                            }}
                          >
                            <FiEye />
                            Ver
                          </Button>
                          <Button
                            size="xs"
                            colorPalette="green"
                            loading={rowState?.isGenerating ?? false}
                            disabled={
                              !rowState?.reviewed
                              || rowState?.generated
                              || rowState?.isGenerating
                              || isGeneratingAll
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCrearIndividual(item.id_colaborador);
                            }}
                          >
                            Calcular
                          </Button>
                        </Flex>
                      );
                    },
                  }}
                  getRowProps={(row) => {
                    if (row.kind !== "generated" || !row.detail) {
                      return {};
                    }

                    return {
                      onClick: () => setSelectedGeneratedCollaboratorId(row.collaboratorId),
                      style: { cursor: "pointer" },
                    };
                  }}
                  pagination={{
                    enabled: true,
                    page: reviewTableQuery.page,
                    pageSize: reviewTableQuery.limit,
                    totalCount: sortedReviewTableRows.length,
                    onPageChange: (nextPage) => {
                      setReviewTableQuery((prev) => ({ ...prev, page: nextPage }));
                    },
                  }}
                />
              </Card.Body>
            </Card.Root>
          </Stack>
        </Form>
      </Stack>

      <Modal
        title={selectedSimulationItem ? `Revisión de ${toTitleCase(selectedSimulationItem.nombre_completo)}` : "Detalle de simulación"}
        size="xl"
        isOpen={Boolean(selectedSimulationItem)}
        onOpenChange={({ open }) => {
          if (!open) setSelectedSimulationItem(null);
        }}
        content={
          selectedSimulationItem ? (
            <SimulacionColaboradorCard item={selectedSimulationItem} />
          ) : null
        }
      />

      <Modal
        title={selectedGeneratedPayroll ? `Planilla calculada de ${selectedGeneratedPayroll.fullName}` : "Detalle de planilla"}
        size="xl"
        isOpen={Boolean(selectedGeneratedPayroll)}
        onOpenChange={({ open }) => {
          if (!open) setSelectedGeneratedCollaboratorId(null);
        }}
        content={
          selectedGeneratedPayroll?.detail ? (
            <GeneratedPayrollDetailCard
              detail={selectedGeneratedPayroll.detail}
              fullName={selectedGeneratedPayroll.fullName}
              identification={selectedGeneratedPayroll.identification}
              periodoLabel={periodoRangeLabel}
              fechaPago={periodo?.fecha_pago ?? null}
            />
          ) : null
        }
      />
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

const GeneratedPayrollDetailCard = ({
  detail,
  fullName,
  identification,
  periodoLabel,
  fechaPago,
}: {
  detail: PayrollDetail;
  fullName: string;
  identification: string | null;
  periodoLabel: string;
  fechaPago: string | null;
}) => {
  const deducciones = [
    ...detail.deducciones,
    {
      id_deduccion: -1,
      nombre: "Impuesto sobre la renta",
      porcentaje: 0,
      monto: detail.renta.monto_quincenal,
    },
  ].filter((item) => item.monto > 0);

  return (
    <Stack gap="6" maxW="1100px" mx="auto" w="full">
      <Card.Root>
        <Card.Body>
          <Stack align="center" gap="2" textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="brand.blue.700">
              {COMPANY_NAME}
            </Text>
            <Text color="fg.muted">Detalle de planilla calculada</Text>
            <Text fontSize="sm" color="fg.muted">Período {periodoLabel}</Text>
          </Stack>
        </Card.Body>
      </Card.Root>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="4">
        <Card.Root>
          <Card.Header>
            <Card.Title>Información del colaborador</Card.Title>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
              <DetailInfoItem label="Nombre" value={fullName} />
              <DetailInfoItem label="Identificación" value={identification ?? "N/D"} />
              <DetailInfoItem label="Contrato" value={`#${detail.id_contrato}`} />
              <DetailInfoItem label="Detalle" value={`#${detail.id_detalle}`} />
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Información del período</Card.Title>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
              <DetailInfoItem label="Rango" value={periodoLabel} />
              <DetailInfoItem label="Fecha de pago" value={formatDate(fechaPago)} />
              <DetailInfoItem label="Salario mensual" value={formatCRC(detail.salario_mensual)} />
              <DetailInfoItem label="Tarifa por hora" value={formatCRC(detail.tarifa_hora)} />
            </SimpleGrid>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="4">
        <Card.Root>
          <Card.Header>
            <Card.Title>Devengos</Card.Title>
          </Card.Header>
          <Card.Body>
            <Stack gap="3">
              <HStack justify="space-between"><Text>Salario quincenal base</Text><Text fontWeight="semibold">{formatCRC(detail.salario_quincenal)}</Text></HStack>
              <HStack justify="space-between"><Text>Horas ordinarias ({detail.horas_ordinarias.cantidad})</Text><Text fontWeight="semibold">{formatCRC(detail.horas_ordinarias.monto)}</Text></HStack>
              <HStack justify="space-between"><Text>Horas extra ({detail.horas_extra.cantidad})</Text><Text fontWeight="semibold">{formatCRC(detail.horas_extra.monto)}</Text></HStack>
              <HStack justify="space-between"><Text>Horas nocturnas ({detail.horas_nocturnas.cantidad})</Text><Text fontWeight="semibold">{formatCRC(detail.horas_nocturnas.monto)}</Text></HStack>
              <HStack justify="space-between"><Text>Horas feriado ({detail.horas_feriado.cantidad})</Text><Text fontWeight="semibold">{formatCRC(detail.horas_feriado.monto)}</Text></HStack>
              <Separator />
              <HStack justify="space-between"><Text fontWeight="bold">Salario devengado</Text><Text fontWeight="bold" color="brand.blue.700">{formatCRC(detail.salario_devengado)}</Text></HStack>
            </Stack>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Deducciones</Card.Title>
          </Card.Header>
          <Card.Body>
            <Stack gap="3">
              {deducciones.length > 0 ? deducciones.map((item) => (
                <HStack key={`${item.id_deduccion}-${item.nombre}`} justify="space-between" align="start">
                  <Stack gap="0">
                    <Text>{item.nombre}</Text>
                    {item.porcentaje > 0 && (
                      <Text fontSize="xs" color="fg.muted">{item.porcentaje}%</Text>
                    )}
                  </Stack>
                  <Text fontWeight="semibold">{formatCRC(item.monto)}</Text>
                </HStack>
              )) : (
                <Text color="fg.muted">No hay deducciones aplicadas.</Text>
              )}
              <Separator />
              <HStack justify="space-between"><Text fontWeight="bold">Total deducciones</Text><Text fontWeight="bold" color="red.600">{formatCRC(detail.total_deducciones)}</Text></HStack>
            </Stack>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <Card.Root borderColor="green.300" bg="green.50">
        <Card.Body>
          <HStack justify="space-between" wrap="wrap">
            <Stack gap="0">
              <Text fontSize="sm" color="fg.muted">Monto neto a recibir</Text>
              <Text fontSize="3xl" fontWeight="bold" color="green.700">{formatCRC(detail.salario_neto)}</Text>
            </Stack>
            <Stack gap="0" textAlign={{ base: "left", md: "right" }}>
              <Text fontSize="sm" color="fg.muted">Renta quincenal</Text>
              <Text fontWeight="semibold">{formatCRC(detail.renta.monto_quincenal)}</Text>
            </Stack>
          </HStack>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
};

const SelectedCollaboratorsBadges = ({
  collaborators,
  defaultCollaboratorIds,
  isLoading,
}: {
  collaborators: EligibleCollaborator[];
  defaultCollaboratorIds: string[];
  isLoading: boolean;
}) => {
  const hasInitializedRef = useRef(false);
  const { control, setValue } = useFormContext<GenerateFormValues>();
  const selected = useWatch({ control, name: "colaboradores" });

  const collaboratorNameMap = useMemo(() => {
    const map = new Map<number, string>();
    collaborators.forEach((collaborator) => {
      map.set(
        collaborator.id_colaborador,
        toTitleCase(collaborator.nombre_completo),
      );
    });
    return map;
  }, [collaborators]);

  useEffect(() => {
    const currentSelection = Array.isArray(selected) ? selected.map(String) : [];

    if (!hasInitializedRef.current) {
      if (defaultCollaboratorIds.length === 0) {
        return;
      }

      if (currentSelection.length === 0) {
        setValue("colaboradores", defaultCollaboratorIds, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: true,
        });
      }

      hasInitializedRef.current = true;
      return;
    }

    const filteredSelection = currentSelection.filter((value) =>
      defaultCollaboratorIds.includes(value),
    );

    if (filteredSelection.length !== currentSelection.length) {
      setValue("colaboradores", filteredSelection, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [defaultCollaboratorIds, selected, setValue]);

  const removeCollaborator = (collaboratorId: string | number) => {
    const collaboratorKey = String(collaboratorId);
    const currentSelection = Array.isArray(selected) ? selected.map(String) : [];
    setValue(
      "colaboradores",
      currentSelection.filter((value) => value !== collaboratorKey),
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
  };

  if (isLoading) {
    return (
      <Text textStyle="sm" color="fg.muted">
        Cargando colaboradores elegibles...
      </Text>
    );
  }

  if (!Array.isArray(selected) || selected.length === 0) {
    return (
      <Text textStyle="sm" color="fg.muted">
        No hay colaboradores elegibles pendientes. Los ya calculados se ocultan automáticamente de esta lista.
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
            <CloseButton
              size="2xs"
              onClick={(event) => {
                event.stopPropagation();
                removeCollaborator(value);
              }}
            />
          </Badge>
        );
      })}
    </Stack>
  );
};