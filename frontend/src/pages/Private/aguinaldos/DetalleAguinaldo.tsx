/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Badge,
  Box,
  Button,
  Card,
  CloseButton,
  EmptyState,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { Document, Font, Image, Page, StyleSheet, Text as PdfText, View, pdf } from "@react-pdf/renderer";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  FiArrowDown,
  FiArrowUp,
  FiDownload,
  FiEye,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";
import notoSans400 from "@fontsource/noto-sans/files/noto-sans-latin-ext-400-normal.woff";
import notoSans700 from "@fontsource/noto-sans/files/noto-sans-latin-ext-700-normal.woff";
import logoPdf from "../../../assets/logo.jpg";
import { Form } from "../../../components/forms/Form/Form";
import {
  InputField,
  type SelectOption,
} from "../../../components/forms/InputField/InputField";
import { Modal } from "../../../components/general/modal/Modal";
import { DataTable } from "../../../components/general/table/DataTable";
import type { DataTableColumn } from "../../../components/general/table/types";
import { Layout } from "../../../components/layout";
import { useAuth } from "../../../context/AuthContext";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useApiQuery } from "../../../hooks/useApiQuery";
import type {
  AguinaldoDetalleResponse,
  AguinaldoElegiblesResponse,
  AguinaldoRegistro,
  AguinaldoSimulacion,
  AguinaldoSimulacionResponse,
  CrearLoteResponse,
  RecalcularResponse,
} from "../../../services/api/aguinaldos";
import { buildAguinaldoPeriodoKey } from "../../../services/api/aguinaldos";
import { showToast } from "../../../services/toast/toastService";
import { formatCRC, formatDateUiCompact, parseUiDateSafe, toTitleCase } from "../../../utils";

const MONTH_NAME_FORMATTER = new Intl.DateTimeFormat("es-CR", { month: "long" });
const PDF_COLON_SYMBOL = "\u20A1";
const COMPANY_NAME = "BioAlquimia";

Font.register({
  family: "NotoSansPdf",
  fonts: [
    { src: notoSans400, fontWeight: 400 },
    { src: notoSans700, fontWeight: 700 },
  ],
});

type SortDir = "asc" | "desc";
type ReviewTableSortField = "fullName" | "aguinaldo" | "estado";

type ReviewTableRow = {
  kind: "generated" | "simulation";
  key: string;
  idAguinaldo: number | null;
  collaboratorId: number;
  fullName: string;
  identification: string | number | null;
  aguinaldo: number;
  simulationItem?: AguinaldoSimulacion;
};

type SimulationRowState = {
  reviewed: boolean;
  generated: boolean;
  isGenerating: boolean;
  error: string | null;
};

type CalcularFormValues = {
  colaboradores: (string | number)[];
};

type LegalPeriodo = {
  anio: number;
  periodo_desde: string;
  periodo_hasta: string;
  fecha_pago_min: string;
  fecha_pago_max: string;
  fecha_pago_sugerida: string;
};

function isDateOnlyValue(value: string | null | undefined) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
}

function buildLegalPeriodoByYear(year: number): LegalPeriodo {
  return {
    anio: year,
    periodo_desde: `${year - 1}-12-01`,
    periodo_hasta: `${year}-11-30`,
    fecha_pago_min: `${year}-12-01`,
    fecha_pago_max: `${year}-12-20`,
    fecha_pago_sugerida: `${year}-12-15`,
  };
}

function getDefaultPeriodo() {
  const now = new Date();
  return buildLegalPeriodoByYear(now.getFullYear());
}

function parsePeriodFromKey(periodoKeyRaw: string) {
  const key = decodeURIComponent(String(periodoKeyRaw ?? "")).trim();
  if (!key || key === "nuevo") return null;

  const parts = key.split("|");
  if (parts.length !== 4) return null;

  const [yearRaw, periodoDesdeRaw, periodoHastaRaw, fechaPagoRaw] = parts;
  const year = Number(yearRaw);

  if (!Number.isInteger(year) || year <= 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodoDesdeRaw)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodoHastaRaw)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaPagoRaw)) return null;

  return {
    anio: year,
    periodo_desde: periodoDesdeRaw,
    periodo_hasta: periodoHastaRaw,
    fecha_pago: fechaPagoRaw,
  };
}

function getMonthName(month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) return `Mes ${month}`;
  return toTitleCase(MONTH_NAME_FORMATTER.format(new Date(Date.UTC(2000, month - 1, 1))));
}

function formatPdfCRC(value: number | string) {
  const numericValue = typeof value === "string" ? Number(value.replace(/,/g, "")) : value;
  if (!Number.isFinite(numericValue)) return `${PDF_COLON_SYMBOL}0,00`;

  const formatted = new Intl.NumberFormat("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);

  return `${PDF_COLON_SYMBOL}${formatted}`;
}

function buildAguinaldoPdfFileName(detail: AguinaldoDetalleResponse) {
  return `detalle-aguinaldo-${detail.id_aguinaldo}-${detail.anio}.pdf`;
}

const aguinaldoPdfStyles = StyleSheet.create({
  page: {
    padding: 26,
    fontSize: 10,
    fontFamily: "NotoSansPdf",
    color: "#1A202C",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 9,
  },
  companyName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#123B7A",
  },
  logo: {
    width: 150,
    height: 54,
    marginBottom: 10,
    objectFit: "contain",
    alignSelf: "center",
  },
  title: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: 700,
    marginBottom: 12,
    color: "#123B7A",
  },
  sectionTitle: {
    backgroundColor: "#123B7A",
    color: "#FFFFFF",
    padding: 5,
    fontSize: 9,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 6,
  },
  infoGrid: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
  },
  infoCard: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: "#D7E0F1",
    padding: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 8.5,
    color: "#4A5568",
  },
  value: {
    fontSize: 9.5,
    fontWeight: 700,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderColor: "#123B7A",
    borderWidth: 1,
  },
  tableRow: {
    flexDirection: "row",
  },
  headerCell: {
    backgroundColor: "#123B7A",
    color: "#FFFFFF",
    borderStyle: "solid",
    borderColor: "#123B7A",
    borderWidth: 1,
    padding: 5,
    fontSize: 8.5,
    flexGrow: 1,
    flexBasis: 0,
  },
  bodyCell: {
    borderStyle: "solid",
    borderColor: "#D7E0F1",
    borderWidth: 1,
    padding: 5,
    fontSize: 8.5,
    flexGrow: 1,
    flexBasis: 0,
  },
  totalsBox: {
    marginTop: 12,
    marginLeft: "auto",
    width: 220,
    borderWidth: 1,
    borderColor: "#123B7A",
    padding: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  netHighlight: {
    marginTop: 6,
    backgroundColor: "#E6F4EA",
    borderWidth: 1,
    borderColor: "#68D391",
    padding: 8,
  },
  footer: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 8,
    color: "#4A5568",
  },
});

function AguinaldoDetallePdfDocument({ detail }: { detail: AguinaldoDetalleResponse }) {
  const companyName = detail.empresa?.nombre ?? COMPANY_NAME;
  const montoAPagar = Number(detail.monto_registrado ?? 0);

  return (
    <Document>
      <Page size="A4" style={aguinaldoPdfStyles.page}>
        <View style={aguinaldoPdfStyles.topBar}>
          <PdfText style={aguinaldoPdfStyles.companyName}>{companyName}</PdfText>
          <PdfText>{formatDateUiCompact(detail.generado_en ?? new Date().toISOString())}</PdfText>
        </View>

        <Image src={logoPdf} style={aguinaldoPdfStyles.logo} />
        <PdfText style={aguinaldoPdfStyles.title}>Comprobante de aguinaldo</PdfText>

        <View style={aguinaldoPdfStyles.infoGrid}>
          <View style={aguinaldoPdfStyles.infoCard}>
            <View style={aguinaldoPdfStyles.infoRow}>
              <PdfText style={aguinaldoPdfStyles.label}>Colaborador</PdfText>
              <PdfText style={aguinaldoPdfStyles.value}>{detail.nombre_completo}</PdfText>
            </View>
            <View style={aguinaldoPdfStyles.infoRow}>
              <PdfText style={aguinaldoPdfStyles.label}>Identificacion</PdfText>
              <PdfText style={aguinaldoPdfStyles.value}>{String(detail.identificacion ?? "N/D")}</PdfText>
            </View>
            <View style={aguinaldoPdfStyles.infoRow}>
              <PdfText style={aguinaldoPdfStyles.label}>Registrado por</PdfText>
              <PdfText style={aguinaldoPdfStyles.value}>{detail.registrado_por?.nombre_completo ?? "N/D"}</PdfText>
            </View>
          </View>

          <View style={aguinaldoPdfStyles.infoCard}>
            <View style={aguinaldoPdfStyles.infoRow}>
              <PdfText style={aguinaldoPdfStyles.label}>Empresa</PdfText>
              <PdfText style={aguinaldoPdfStyles.value}>{companyName}</PdfText>
            </View>
            <View style={aguinaldoPdfStyles.infoRow}>
              <PdfText style={aguinaldoPdfStyles.label}>Periodo</PdfText>
              <PdfText style={aguinaldoPdfStyles.value}>
                {formatDateUiCompact(detail.periodo_desde)} - {formatDateUiCompact(detail.periodo_hasta)}
              </PdfText>
            </View>
            <View style={aguinaldoPdfStyles.infoRow}>
              <PdfText style={aguinaldoPdfStyles.label}>Fecha de pago</PdfText>
              <PdfText style={aguinaldoPdfStyles.value}>{formatDateUiCompact(detail.fecha_pago)}</PdfText>
            </View>
          </View>
        </View>

        <PdfText style={aguinaldoPdfStyles.sectionTitle}>Salarios considerados para calculo</PdfText>
        <View style={aguinaldoPdfStyles.table}>
          <View style={aguinaldoPdfStyles.tableRow}>
            <PdfText style={aguinaldoPdfStyles.headerCell}>Mes</PdfText>
            <PdfText style={aguinaldoPdfStyles.headerCell}>Anio</PdfText>
            <PdfText style={aguinaldoPdfStyles.headerCell}>Salario bruto mensual</PdfText>
          </View>

          {detail.desglose_mensual_bruto.length > 0 ? (
            detail.desglose_mensual_bruto.map((item) => (
              <View key={`${item.anio}-${item.mes}`} style={aguinaldoPdfStyles.tableRow}>
                <PdfText style={aguinaldoPdfStyles.bodyCell}>{getMonthName(item.mes)}</PdfText>
                <PdfText style={aguinaldoPdfStyles.bodyCell}>{item.anio}</PdfText>
                <PdfText style={aguinaldoPdfStyles.bodyCell}>{formatPdfCRC(item.total)}</PdfText>
              </View>
            ))
          ) : (
            <View style={aguinaldoPdfStyles.tableRow}>
              <PdfText style={aguinaldoPdfStyles.bodyCell}>Sin registros en planilla para el periodo.</PdfText>
              <PdfText style={aguinaldoPdfStyles.bodyCell}>-</PdfText>
              <PdfText style={aguinaldoPdfStyles.bodyCell}>{formatPdfCRC(0)}</PdfText>
            </View>
          )}
        </View>

        <View style={aguinaldoPdfStyles.totalsBox}>
          <View style={aguinaldoPdfStyles.totalRow}>
            <PdfText style={aguinaldoPdfStyles.label}>Aguinaldo recalculado actual</PdfText>
            <PdfText style={aguinaldoPdfStyles.value}>{formatPdfCRC(detail.monto_calculado_actual)}</PdfText>
          </View>

          <View style={aguinaldoPdfStyles.netHighlight}>
            <View style={aguinaldoPdfStyles.totalRow}>
              <PdfText style={aguinaldoPdfStyles.value}>Monto a pagar</PdfText>
              <PdfText style={aguinaldoPdfStyles.value}>{formatPdfCRC(montoAPagar)}</PdfText>
            </View>
          </View>
        </View>

        <PdfText style={aguinaldoPdfStyles.footer}>Generado por BioAlquimia para consulta del periodo de aguinaldo.</PdfText>
      </Page>
    </Document>
  );
}

function SortHeader<TField extends string>({
  label,
  field,
  currentSortBy,
  currentSortDir,
  onChange,
}: {
  label: string;
  field: TField;
  currentSortBy: TField;
  currentSortDir: SortDir;
  // eslint-disable-next-line no-unused-vars
  onChange: (field: TField) => void;
}) {
  const isActive = currentSortBy === field;
  const icon = isActive && currentSortDir === "asc" ? <FiArrowUp /> : <FiArrowDown />;

  return (
    <Button type="button" variant="ghost" size="xs" px="0" onClick={() => onChange(field)}>
      <HStack gap="1">
        <Text>{label}</Text>
        <Box color={isActive ? "brand.blue.600" : "fg.muted"}>{icon}</Box>
      </HStack>
    </Button>
  );
}

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

export const DetalleAguinaldo = () => {
  const navigate = useNavigate();
  const { periodoKey } = useParams<{ periodoKey: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const defaults = useMemo(() => getDefaultPeriodo(), []);

  const periodFromKey = useMemo(
    () => parsePeriodFromKey(periodoKey ?? ""),
    [periodoKey],
  );

  const isNewPeriod = (periodoKey ?? "").trim() === "nuevo";

  const resolvedPeriod = useMemo(() => {
    const yearFromQuery = Number(searchParams.get("anio"));
    const selectedYear = Number.isInteger(yearFromQuery) && yearFromQuery > 0
      ? yearFromQuery
      : defaults.anio;
    const legalPeriodo = buildLegalPeriodoByYear(selectedYear);
    const queryDesde = searchParams.get("periodo_desde");
    const queryHasta = searchParams.get("periodo_hasta");
    const queryFechaPago = searchParams.get("fecha_pago");

    const hasLegalRangeFromQuery =
      queryDesde === legalPeriodo.periodo_desde
      && queryHasta === legalPeriodo.periodo_hasta;

    const fechaPagoLegal =
      isDateOnlyValue(queryFechaPago)
      && String(queryFechaPago) >= legalPeriodo.fecha_pago_min
      && String(queryFechaPago) <= legalPeriodo.fecha_pago_max;

    const fallbackFromQuery = {
      anio: selectedYear,
      periodo_desde: hasLegalRangeFromQuery ? String(queryDesde) : legalPeriodo.periodo_desde,
      periodo_hasta: hasLegalRangeFromQuery ? String(queryHasta) : legalPeriodo.periodo_hasta,
      fecha_pago: fechaPagoLegal ? String(queryFechaPago) : legalPeriodo.fecha_pago_sugerida,
    };

    if (periodFromKey) {
      return periodFromKey;
    }

    return fallbackFromQuery;
  }, [defaults.anio, defaults.periodo_desde, defaults.periodo_hasta, periodFromKey, searchParams]);

  const periodLabel = useMemo(
    () => `${formatDateUiCompact(resolvedPeriod.periodo_desde)} - ${formatDateUiCompact(resolvedPeriod.periodo_hasta)}`,
    [resolvedPeriod.periodo_desde, resolvedPeriod.periodo_hasta],
  );

  const elegiblesUrl = useMemo(() => {
    if (!resolvedPeriod.periodo_desde || !resolvedPeriod.periodo_hasta) return "";

    const params = new URLSearchParams({
      periodo_desde: resolvedPeriod.periodo_desde,
      periodo_hasta: resolvedPeriod.periodo_hasta,
    });

    return `aguinaldos/elegibles?${params.toString()}`;
  }, [resolvedPeriod.periodo_desde, resolvedPeriod.periodo_hasta]);

  const {
    data: eligibleData,
    isLoading: eligibleLoading,
    refetch: refetchEligibleCollaborators,
  } = useApiQuery<AguinaldoElegiblesResponse | null>({
    url: elegiblesUrl,
    enabled: Boolean(elegiblesUrl),
  });

  const eligibleCollaborators = useMemo(
    () => eligibleData?.colaboradores ?? [],
    [eligibleData],
  );

  const pendingEligibleCollaborators = useMemo(
    () => eligibleCollaborators.filter((collaborator) => !collaborator.tiene_aguinaldo),
    [eligibleCollaborators],
  );

  const defaultSelectedCollaborators = useMemo(
    () => pendingEligibleCollaborators.map((collaborator) => String(collaborator.id_colaborador)),
    [pendingEligibleCollaborators],
  );

  const hasPendingEligibleCollaborators = pendingEligibleCollaborators.length > 0;

  const options = useMemo<SelectOption[]>(
    () => pendingEligibleCollaborators.map((collaborator) => ({
      label: toTitleCase(collaborator.nombre_completo),
      value: String(collaborator.id_colaborador),
    })),
    [pendingEligibleCollaborators],
  );

  const {
    mutate: simularCalculo,
    isLoading: isSimulating,
  } = useApiMutation<
    { colaboradores: number[]; periodo_desde: string; periodo_hasta: string },
    AguinaldoSimulacionResponse
  >({ url: "aguinaldos/calcular-lote", method: "POST" });

  const [simulacion, setSimulacion] = useState<AguinaldoSimulacion[]>([]);
  const [simulacionMeta, setSimulacionMeta] = useState<{
    periodo_desde: string;
    periodo_hasta: string;
  } | null>(null);
  const [simulationRowsState, setSimulationRowsState] = useState<Record<number, SimulationRowState>>({});
  const [selectedSimulationItem, setSelectedSimulationItem] = useState<AguinaldoSimulacion | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const {
    mutate: crearLote,
  } = useApiMutation<
    {
      colaboradores: number[];
      periodo_desde: string;
      periodo_hasta: string;
      anio: number;
      fecha_pago: string;
      registrado_por: number;
    },
    CrearLoteResponse
  >({ url: "aguinaldos/crear-lote", method: "POST" });

  const {
    mutate: recalcular,
    isLoading: isRecalculating,
  } = useApiMutation<{ ids: number[] }, RecalcularResponse>({
    url: "aguinaldos/recalcular",
    method: "PATCH",
  });

  const existingRecordsUrl = useMemo(() => {
    if (isNewPeriod) return "";

    const params = new URLSearchParams({
      anio: String(resolvedPeriod.anio),
      periodo_desde: resolvedPeriod.periodo_desde,
      periodo_hasta: resolvedPeriod.periodo_hasta,
      fecha_pago: resolvedPeriod.fecha_pago,
    });

    return `aguinaldos?${params.toString()}`;
  }, [isNewPeriod, resolvedPeriod.anio, resolvedPeriod.fecha_pago, resolvedPeriod.periodo_desde, resolvedPeriod.periodo_hasta]);

  const {
    data: existingRecords = [],
    isLoading: loadingRecords,
    refetch: refetchRecords,
  } = useApiQuery<AguinaldoRegistro[]>({
    url: existingRecordsUrl,
    enabled: Boolean(existingRecordsUrl),
    initialData: [],
  });

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

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<number | null>(null);
  const [isDownloadingDetailPdf, setIsDownloadingDetailPdf] = useState(false);
  const [recalculatingRecordId, setRecalculatingRecordId] = useState<number | null>(null);

  const resolvedAnio = useMemo(() => {
    const explicitYear = Number(resolvedPeriod.anio);
    if (Number.isInteger(explicitYear) && explicitYear > 0) return explicitYear;

    return parseUiDateSafe(resolvedPeriod.periodo_hasta)?.getFullYear() ?? defaults.anio;
  }, [defaults.anio, resolvedPeriod.anio, resolvedPeriod.periodo_hasta]);

  const refreshAguinaldoContext = async () => {
    await Promise.all([refetchRecords(), refetchEligibleCollaborators()]);
  };

  const detailUrl = selectedRecordForDetail
    ? `aguinaldos/${selectedRecordForDetail}/detalle`
    : "";

  const {
    data: selectedRecordDetail,
    isLoading: isDetailLoading,
  } = useApiQuery<AguinaldoDetalleResponse | null>({
    url: detailUrl,
    enabled: Boolean(detailUrl) && isDetailOpen,
  });

  const handleOpenDetail = (recordId: number) => {
    setSelectedRecordForDetail(recordId);
    setIsDetailOpen(true);
  };

  const handleDownloadDetailPdf = async () => {
    if (!selectedRecordDetail) return;

    setIsDownloadingDetailPdf(true);
    try {
      const blob = await pdf(<AguinaldoDetallePdfDocument detail={selectedRecordDetail} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildAguinaldoPdfFileName(selectedRecordDetail);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingDetailPdf(false);
    }
  };

  const handlePrecalculo = async (values: CalcularFormValues) => {
    const collaboratorIds = (values.colaboradores ?? [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (collaboratorIds.length === 0) {
      showToast("Seleccione al menos un colaborador.", "error");
      return false;
    }

    try {
      const response = await simularCalculo({
        colaboradores: collaboratorIds,
        periodo_desde: resolvedPeriod.periodo_desde,
        periodo_hasta: resolvedPeriod.periodo_hasta,
      });

      const data = (response as any)?.resultados ?? (response as any)?.data?.resultados ?? [];
      const meta = {
        periodo_desde:
          (response as any)?.periodo_desde
          ?? (response as any)?.data?.periodo_desde
          ?? resolvedPeriod.periodo_desde,
        periodo_hasta:
          (response as any)?.periodo_hasta
          ?? (response as any)?.data?.periodo_hasta
          ?? resolvedPeriod.periodo_hasta,
      };

      setSimulacion(data);
      setSimulacionMeta(meta);
      setSelectedSimulationItem(null);
      setSimulationRowsState(
        Object.fromEntries(
          data.map((item: AguinaldoSimulacion) => [
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
      setSelectedSimulationItem(null);
      setSimulationRowsState({});
      return false;
    }
  };

  const applyGenerationResult = (payload: CrearLoteResponse, collaboratorIds: number[]) => {
    const generatedIds = new Set((payload.creados ?? []).map((item) => Number(item.id_colaborador)));
    const duplicatedIds = new Set((payload.duplicados ?? []).map((item) => Number(item.id_colaborador)));

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
          error: null,
        };
      });

      return next;
    });
  };

  const markSimulationReviewed = (item: AguinaldoSimulacion) => {
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
    if (!user?.id) {
      showToast("No se pudo identificar al usuario autenticado.", "error");
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
      const response = await crearLote({
        colaboradores: [collaboratorId],
        periodo_desde: resolvedPeriod.periodo_desde,
        periodo_hasta: resolvedPeriod.periodo_hasta,
        anio: resolvedAnio,
        fecha_pago: resolvedPeriod.fecha_pago,
        registrado_por: Number(user.id),
      });

      applyGenerationResult(response, [collaboratorId]);

      if (isNewPeriod) {
        const createdPeriodoKey = buildAguinaldoPeriodoKey({
          anio: resolvedAnio,
          periodo_desde: resolvedPeriod.periodo_desde,
          periodo_hasta: resolvedPeriod.periodo_hasta,
          fecha_pago: resolvedPeriod.fecha_pago,
        });

        navigate(`/aguinaldos/${encodeURIComponent(createdPeriodoKey)}`);
      } else {
        await refreshAguinaldoContext();
      }
    } catch (error: any) {
      if (error?.status === 409 || error?.response?.status === 409) {
        setSimulationRowsState((prev) => ({
          ...prev,
          [collaboratorId]: {
            reviewed: prev[collaboratorId]?.reviewed ?? false,
            generated: true,
            isGenerating: false,
            error: null,
          },
        }));
        await refreshAguinaldoContext();
        return;
      }

      setSimulationRowsState((prev) => ({
        ...prev,
        [collaboratorId]: {
          reviewed: prev[collaboratorId]?.reviewed ?? false,
          generated: prev[collaboratorId]?.generated ?? false,
          isGenerating: false,
          error: error?.message ?? "No se pudo calcular el aguinaldo.",
        },
      }));
    }
  };

  const handleCrearTodas = async () => {
    if (!user?.id) {
      showToast("No se pudo identificar al usuario autenticado.", "error");
      return;
    }

    const pendingIds = simulacion
      .filter((item) => !simulationRowsState[item.id_colaborador]?.generated)
      .map((item) => item.id_colaborador);

    if (pendingIds.length === 0) {
      showToast("No hay aguinaldos pendientes por calcular en esta simulación.", "info");
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
      const response = await crearLote({
        colaboradores: pendingIds,
        periodo_desde: resolvedPeriod.periodo_desde,
        periodo_hasta: resolvedPeriod.periodo_hasta,
        anio: resolvedAnio,
        fecha_pago: resolvedPeriod.fecha_pago,
        registrado_por: Number(user.id),
      });

      applyGenerationResult(response, pendingIds);

      if (isNewPeriod) {
        const createdPeriodoKey = buildAguinaldoPeriodoKey({
          anio: resolvedAnio,
          periodo_desde: resolvedPeriod.periodo_desde,
          periodo_hasta: resolvedPeriod.periodo_hasta,
          fecha_pago: resolvedPeriod.fecha_pago,
        });

        navigate(`/aguinaldos/${encodeURIComponent(createdPeriodoKey)}`);
      } else {
        await refreshAguinaldoContext();
      }
    } catch (error: any) {
      const duplicatedIds =
        error?.response?.data?.data?.duplicados?.map((item: { id_colaborador: number }) => Number(item.id_colaborador))
        ?? [];

      setSimulationRowsState((prev) => {
        const next = { ...prev };
        pendingIds.forEach((collaboratorId) => {
          next[collaboratorId] = {
            reviewed: prev[collaboratorId]?.reviewed ?? false,
            generated:
              (prev[collaboratorId]?.generated ?? false)
              || duplicatedIds.includes(collaboratorId)
              || (error?.status === 409 || error?.response?.status === 409),
            isGenerating: false,
            error: duplicatedIds.includes(collaboratorId)
              ? null
              : error?.message ?? "No se pudo calcular el aguinaldo.",
          };
        });
        return next;
      });

      if (duplicatedIds.length > 0 || error?.status === 409 || error?.response?.status === 409) {
        await refreshAguinaldoContext();
      }
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleRecalcularRecord = async (idAguinaldo: number) => {
    setRecalculatingRecordId(idAguinaldo);

    try {
      await recalcular({ ids: [idAguinaldo] });
      await refreshAguinaldoContext();
    } catch {
      // Global API toast handles visible error
    } finally {
      setRecalculatingRecordId(null);
    }
  };

  const reviewTableRows = useMemo<ReviewTableRow[]>(() => {
    const rowsByCollaborator = new Map<number, ReviewTableRow>();

    existingRecords.forEach((record) => {
      rowsByCollaborator.set(record.id_colaborador, {
        kind: "generated",
        key: `g-${record.id_aguinaldo}`,
        idAguinaldo: record.id_aguinaldo,
        collaboratorId: record.id_colaborador,
        fullName: toTitleCase(record.nombre_completo),
        identification: record.identificacion,
        aguinaldo: Number(record.monto_calculado ?? 0),
      });
    });

    simulacion.forEach((item) => {
      if (rowsByCollaborator.has(item.id_colaborador)) return;

      rowsByCollaborator.set(item.id_colaborador, {
        kind: "simulation",
        key: `s-${item.id_colaborador}`,
        idAguinaldo: null,
        collaboratorId: item.id_colaborador,
        fullName: toTitleCase(item.nombre_completo),
        identification: item.identificacion,
        aguinaldo: Number(item.monto_aguinaldo ?? 0),
        simulationItem: item,
      });
    });

    return Array.from(rowsByCollaborator.values());
  }, [existingRecords, simulacion]);

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

      return direction * (left.aguinaldo - right.aguinaldo);
    });
  }, [reviewTableQuery.sortBy, reviewTableQuery.sortDir, reviewTableRows, simulationRowsState]);

  const totalSimuladoAguinaldo = useMemo(
    () => simulacion.reduce((acc, item) => acc + Number(item.monto_aguinaldo ?? 0), 0),
    [simulacion],
  );

  const reviewedSimulationsCount = useMemo(
    () => simulacion.filter((item) => simulationRowsState[item.id_colaborador]?.reviewed).length,
    [simulacion, simulationRowsState],
  );

  const generatedSimulationsCount = useMemo(
    () => simulacion.filter((item) => simulationRowsState[item.id_colaborador]?.generated).length,
    [simulacion, simulationRowsState],
  );

  const pendingSimulationItems = useMemo(
    () => simulacion.filter((item) => !simulationRowsState[item.id_colaborador]?.generated),
    [simulacion, simulationRowsState],
  );

  const allSimulationsReviewed =
    simulacion.length > 0 && reviewedSimulationsCount === simulacion.length;

  const totalReviewPages = Math.max(1, Math.ceil(sortedReviewTableRows.length / reviewTableQuery.limit));

  useEffect(() => {
    if (reviewTableQuery.page <= totalReviewPages) return;
    setReviewTableQuery((prev) => ({ ...prev, page: totalReviewPages }));
  }, [reviewTableQuery.page, totalReviewPages]);

  const paginatedReviewTableRows = useMemo(() => {
    const start = (reviewTableQuery.page - 1) * reviewTableQuery.limit;
    return sortedReviewTableRows.slice(start, start + reviewTableQuery.limit);
  }, [sortedReviewTableRows, reviewTableQuery.page, reviewTableQuery.limit]);

  const handleReviewTableSortChange = (field: ReviewTableSortField) => {
    setReviewTableQuery((prev) => ({
      ...prev,
      page: 1,
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const reviewTableColumns = useMemo<DataTableColumn<ReviewTableRow>[]>(
    () => [
      {
        id: "fullName",
        minW: "300px",
        header: (
          <SortHeader
            label="Colaborador"
            field="fullName"
            currentSortBy={reviewTableQuery.sortBy}
            currentSortDir={reviewTableQuery.sortDir}
            onChange={handleReviewTableSortChange}
          />
        ),
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
        id: "aguinaldo",
        minW: "180px",
        textAlign: "right",
        header: (
          <SortHeader
            label="Aguinaldo"
            field="aguinaldo"
            currentSortBy={reviewTableQuery.sortBy}
            currentSortDir={reviewTableQuery.sortDir}
            onChange={handleReviewTableSortChange}
          />
        ),
        cell: (row) => <Text fontWeight="bold" color="green.600">{formatCRC(row.aguinaldo)}</Text>,
      },
      {
        id: "estado",
        minW: "240px",
        header: (
          <SortHeader
            label="Estado"
            field="estado"
            currentSortBy={reviewTableQuery.sortBy}
            currentSortDir={reviewTableQuery.sortDir}
            onChange={handleReviewTableSortChange}
          />
        ),
        cell: (row) => {
          if (row.kind === "generated") {
            return <Badge colorPalette="green" variant="subtle">Calculada</Badge>;
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
              {rowState?.error ? (
                <Text textStyle="xs" color="red.600">{rowState.error}</Text>
              ) : null}
            </Stack>
          );
        },
      },
    ],
    [reviewTableQuery.sortBy, reviewTableQuery.sortDir, simulationRowsState],
  );

  return (
    <Layout pageTitle={isNewPeriod ? "Nuevo periodo de aguinaldo" : `Detalle de periodo ${periodLabel}`}>
      <Stack gap="8" marginBottom="5rem">
        <Form<CalcularFormValues>
          key={`detalle-aguinaldo-${periodoKey ?? "nuevo"}-${resolvedPeriod.periodo_desde}-${resolvedPeriod.fecha_pago}`}
          onSubmit={handlePrecalculo}
          defaultValues={{
            colaboradores: defaultSelectedCollaborators,
          }}
        >
          <Stack gap="6">
            <Stack direction={{ base: "column", xl: "row" }} align="flex-start" gap="6">
              <Card.Root as="section" w={{ base: "full", xl: "560px" }} flexShrink={0}>
                <Card.Header>
                  <Card.Title>{isNewPeriod ? "Calcular aguinaldos" : "Gestionar aguinaldos del periodo"}</Card.Title>
                  <Card.Description>
                    Revisa cuidadosamente cada aguinaldo antes de calcularlo.
                  </Card.Description>
                </Card.Header>

                <Card.Body>
                  <Stack gap="4">
                    <SimpleGrid columns={2} gap="3">
                      <Stack gap="0">
                        <Text textStyle="sm" color="fg.muted">Periodo</Text>
                        <Heading size="sm">{periodLabel}</Heading>
                      </Stack>

                      <Stack gap="0">
                        <Text textStyle="sm" color="fg.muted">Fecha de pago</Text>
                        <Text fontWeight="semibold">{formatDateUiCompact(resolvedPeriod.fecha_pago)}</Text>
                      </Stack>

                      <Stack gap="0">
                        <Text textStyle="sm" color="fg.muted">Año del período</Text>
                        <Heading size="sm">{resolvedAnio}</Heading>
                      </Stack>

                      <Stack gap="0">
                        <Text textStyle="sm" color="fg.muted">Elegibles pendientes</Text>
                        <Heading size="sm">{eligibleLoading ? "..." : pendingEligibleCollaborators.length}</Heading>
                      </Stack>
                    </SimpleGrid>

                    <InputField
                      fieldType="select"
                      name="colaboradores"
                      label="Colaboradores"
                      required
                      disableSelectPortal
                      options={options}
                      placeholder={
                        eligibleLoading
                          ? "Cargando elegibles..."
                          : options.length === 0
                            ? "Sin colaboradores elegibles pendientes"
                            : "Seleccione uno o varios"
                      }
                      selectRootProps={{
                        multiple: true,
                        disabled: eligibleLoading || !hasPendingEligibleCollaborators,
                      }}
                      rules={{
                        validate: (value: any) =>
                          Array.isArray(value) && value.length > 0
                            ? true
                            : "Seleccione al menos un colaborador.",
                        setValueAs: (value: any) =>
                          Array.isArray(value) ? value : value ? [value] : [],
                      }}
                    />

                    <SelectedCollaboratorsBadges
                      collaborators={pendingEligibleCollaborators}
                      defaultCollaboratorIds={defaultSelectedCollaborators}
                      isLoading={eligibleLoading}
                    />

                    {eligibleData ? (
                      <HStack justify="space-between" fontSize="sm" color="fg.muted">
                        <Text>Elegibles: {eligibleData.total_elegibles}</Text>
                        <Text>Pendientes: {eligibleData.total_pendientes}</Text>
                        <Text>Registrados: {eligibleData.total_generados}</Text>
                      </HStack>
                    ) : null}
                  </Stack>
                </Card.Body>

                <Card.Footer justifyContent="flex-end" gap="3">
                  <SubmitButtons
                    isSimulating={isSimulating}
                    isGeneratingAll={isGeneratingAll}
                    hasSimulacion={simulacion.length > 0}
                    allSimulationsReviewed={allSimulationsReviewed}
                    pendingCount={pendingSimulationItems.length}
                    disabled={eligibleLoading || !hasPendingEligibleCollaborators}
                    onCrearTodas={handleCrearTodas}
                  />
                </Card.Footer>
              </Card.Root>

              {(isSimulating || simulacion.length > 0) && (
                <Stack flex="1" gap="4" w="full">
                  {isSimulating ? (
                    <Stack align="center" py="10" gap="3">
                      <Spinner size="lg" />
                      <Text color="fg.muted">Ejecutando precálculo...</Text>
                    </Stack>
                  ) : (
                    <Card.Root>
                      <Card.Body>
                        <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} gap="4">
                          <Box>
                            <Text textStyle="xs" color="fg.muted">Colaboradores</Text>
                            <Heading size="md">{simulacion.length}</Heading>
                          </Box>
                          <Box>
                            <Text textStyle="xs" color="fg.muted">Período</Text>
                            <Text fontWeight="semibold">
                              {formatDateUiCompact(simulacionMeta?.periodo_desde)} - {formatDateUiCompact(simulacionMeta?.periodo_hasta)}
                            </Text>
                          </Box>
                          <Box>
                            <Text textStyle="xs" color="fg.muted">Total aguinaldo</Text>
                            <Heading size="md" color="green.600">{formatCRC(totalSimuladoAguinaldo)}</Heading>
                          </Box>
                          <Box>
                            <Text textStyle="xs" color="fg.muted">Revisadas</Text>
                            <Heading size="md">{reviewedSimulationsCount}/{simulacion.length}</Heading>
                          </Box>
                          <Box>
                            <Text textStyle="xs" color="fg.muted">Calculadas</Text>
                            <Heading size="md">{generatedSimulationsCount}/{simulacion.length}</Heading>
                          </Box>
                        </SimpleGrid>
                      </Card.Body>
                    </Card.Root>
                  )}
                </Stack>
              )}
            </Stack>
          </Stack>
        </Form>

        <Card.Root>
          <Card.Header>
            <Card.Title>Tabla de revisión de aguinaldos</Card.Title>
            <Card.Description>
              Visualiza en una sola tabla los cálculos simulados y los aguinaldos generados para este periodo.
            </Card.Description>
          </Card.Header>

          <Card.Body p="0">
            <DataTable<ReviewTableRow>
              columns={reviewTableColumns}
              data={paginatedReviewTableRows}
              isDataLoading={loadingRecords || (isSimulating && reviewTableRows.length === 0)}
              actionColumn={{
                header: "Acciones",
                w: "440px",
                cell: (row) => {
                  const recordId = row.idAguinaldo;

                  if (row.kind === "generated" && typeof recordId === "number") {
                    return (
                      <HStack justify="flex-end" gap="2" wrap="nowrap">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          colorPalette="blue"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenDetail(recordId);
                          }}
                        >
                          <FiEye />
                          Ver
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          colorPalette="orange"
                          loading={isRecalculating && recalculatingRecordId === recordId}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRecalcularRecord(recordId);
                          }}
                        >
                          <FiRefreshCw />
                          Recalcular
                        </Button>
                      </HStack>
                    );
                  }

                  const simulationItem = row.simulationItem;
                  if (!simulationItem) return null;

                  const rowState = simulationRowsState[simulationItem.id_colaborador];

                  return (
                    <Flex justify="flex-end" gap="2" wrap="wrap">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          markSimulationReviewed(simulationItem);
                        }}
                      >
                        <FiEye />
                        Ver
                      </Button>

                      <Button
                        type="button"
                        size="sm"
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
                          handleCrearIndividual(simulationItem.id_colaborador);
                        }}
                      >
                        Calcular
                      </Button>
                    </Flex>
                  );
                },
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

      <Modal
        title={selectedSimulationItem ? `Precalculo de ${toTitleCase(selectedSimulationItem.nombre_completo)}` : "Precalculo de aguinaldo"}
        size="xl"
        isOpen={Boolean(selectedSimulationItem)}
        onOpenChange={(event) => {
          if (!event.open) setSelectedSimulationItem(null);
        }}
        footerContent={(
          <Button type="button" variant="outline" onClick={() => setSelectedSimulationItem(null)}>
            Cerrar
          </Button>
        )}
      >
        {!selectedSimulationItem ? null : (
          <Stack gap="4">
            <Card.Root>
              <Card.Header pb="2">
                <Card.Title fontSize="md">Datos del colaborador</Card.Title>
              </Card.Header>
              <Card.Body pt="0">
                <Stack gap="1">
                  <Text fontWeight="semibold">{toTitleCase(selectedSimulationItem.nombre_completo)}</Text>
                  <Text color="fg.muted">Identificacion: {selectedSimulationItem.identificacion ?? "N/D"}</Text>
                  <Text color="fg.muted">Periodo: {periodLabel}</Text>
                </Stack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <Card.Title fontSize="md">Detalle mensual bruto (simulación)</Card.Title>
              </Card.Header>
              <Card.Body p="0">
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Mes</Table.ColumnHeader>
                      <Table.ColumnHeader>Anio</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">Bruto mensual</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {selectedSimulationItem.desglose.length > 0 ? (
                      selectedSimulationItem.desglose.map((item) => (
                        <Table.Row key={`${item.anio}-${item.mes}`}>
                          <Table.Cell>{getMonthName(item.mes)}</Table.Cell>
                          <Table.Cell>{item.anio}</Table.Cell>
                          <Table.Cell textAlign="right">{formatCRC(item.total)}</Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={3}>
                          <Text color="fg.muted">Sin salarios en planilla para el periodo seleccionado.</Text>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Root>
              </Card.Body>
            </Card.Root>

            <SimpleGrid columns={{ base: 1 }} gap="4">
              <Card.Root>
                <Card.Body>
                  <Text textStyle="sm" color="fg.muted">Aguinaldo estimado</Text>
                  <Heading size="md" color="green.600">{formatCRC(selectedSimulationItem.monto_aguinaldo)}</Heading>
                </Card.Body>
              </Card.Root>
            </SimpleGrid>
          </Stack>
        )}
      </Modal>

      <Modal
        title={selectedRecordDetail ? `Detalle de aguinaldo #${selectedRecordDetail.id_aguinaldo}` : "Detalle de aguinaldo"}
        size="xl"
        isOpen={isDetailOpen}
        onOpenChange={(event) => {
          if (!event.open) setIsDetailOpen(false);
        }}
        footerContent={(
          <HStack w="full" justify="space-between" gap="3">
            <Button type="button" variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cerrar
            </Button>
            <Button
              type="button"
              colorPalette="blue"
              loading={isDownloadingDetailPdf}
              onClick={handleDownloadDetailPdf}
              disabled={!selectedRecordDetail || isDetailLoading}
            >
              <FiDownload />
              Descargar PDF
            </Button>
          </HStack>
        )}
      >
        {isDetailLoading ? (
          <Stack align="center" py="10" gap="3">
            <Spinner size="lg" />
            <Text color="fg.muted">Cargando detalle...</Text>
          </Stack>
        ) : !selectedRecordDetail ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Title>No hay detalle disponible</EmptyState.Title>
              <EmptyState.Description>
                No fue posible obtener los datos del registro seleccionado.
              </EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Stack gap="4">

            <Card.Root>
              <Card.Header pb="2">
                <Card.Title fontSize="md">Datos del colaborador</Card.Title>
              </Card.Header>
              <Card.Body pt="0">
                <Stack gap="1">
                  <Text fontWeight="semibold">{toTitleCase(selectedRecordDetail.nombre_completo)}</Text>
                  <Text color="fg.muted">Identificacion: {selectedRecordDetail.identificacion ?? "N/D"}</Text>
                  <Text color="fg.muted">
                    Periodo: {formatDateUiCompact(selectedRecordDetail.periodo_desde)} - {" "}
                    {formatDateUiCompact(selectedRecordDetail.periodo_hasta)}
                  </Text>
                  <Text color="fg.muted">Fecha pago: {formatDateUiCompact(selectedRecordDetail.fecha_pago)}</Text>
                  <Text color="fg.muted">
                    Registrado por: {toTitleCase(selectedRecordDetail.registrado_por?.nombre_completo ?? "N/D")}
                  </Text>
                </Stack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <Card.Title fontSize="md">Detalle mensual bruto</Card.Title>
              </Card.Header>
              <Card.Body p="0">
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Mes</Table.ColumnHeader>
                      <Table.ColumnHeader>Anio</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">Bruto mensual</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {selectedRecordDetail.desglose_mensual_bruto.length > 0 ? (
                      selectedRecordDetail.desglose_mensual_bruto.map((item) => (
                        <Table.Row key={`${item.anio}-${item.mes}`}>
                          <Table.Cell>{getMonthName(item.mes)}</Table.Cell>
                          <Table.Cell>{item.anio}</Table.Cell>
                          <Table.Cell textAlign="right">{formatCRC(item.total)}</Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={3}>
                          <Text color="fg.muted">Sin salarios en planilla para el periodo guardado.</Text>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Root>
              </Card.Body>
            </Card.Root>
          </Stack>
        )}
      </Modal>
    </Layout>
  );
};

const SelectedCollaboratorsBadges = ({
  collaborators,
  defaultCollaboratorIds,
  isLoading,
}: {
  collaborators: AguinaldoElegiblesResponse["colaboradores"];
  defaultCollaboratorIds: string[];
  isLoading: boolean;
}) => {
  const hasInitializedRef = useRef(false);
  const { control, setValue } = useFormContext<CalcularFormValues>();
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

  const handleRemove = (idToRemove: string | number) => {
    const idKey = String(idToRemove);
    const currentSelection = Array.isArray(selected) ? selected.map(String) : [];
    setValue(
      "colaboradores",
      currentSelection.filter((id) => id !== idKey),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
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
        const label = collaboratorNameMap.get(numericId) ?? `Colaborador #${numericId}`;

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
                handleRemove(value);
              }}
            />
          </Badge>
        );
      })}
    </Stack>
  );
};

const SubmitButtons = ({
  isSimulating,
  isGeneratingAll,
  hasSimulacion,
  allSimulationsReviewed,
  pendingCount,
  disabled,
  onCrearTodas,
}: {
  isSimulating: boolean;
  isGeneratingAll: boolean;
  hasSimulacion: boolean;
  allSimulationsReviewed: boolean;
  pendingCount: number;
  disabled: boolean;
  // eslint-disable-next-line no-unused-vars
  onCrearTodas: () => Promise<void>;
}) => {
  return (
    <>
      <Button
        type="submit"
        colorPalette="blue"
        variant="outline"
        loading={isSimulating}
        disabled={disabled || isSimulating || isGeneratingAll}
      >
        Pre cálculo
      </Button>

      {hasSimulacion && (
        <Button
          type="button"
          colorPalette="green"
          loading={isGeneratingAll}
          disabled={
            disabled
            || isGeneratingAll
            || pendingCount === 0
            || !allSimulationsReviewed
          }
          onClick={() => {
            void onCrearTodas();
          }}
        >
          Calcular todas ({pendingCount})
        </Button>
      )}
    </>
  );
};
