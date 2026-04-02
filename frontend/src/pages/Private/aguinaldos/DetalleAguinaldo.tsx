/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Badge,
  Box,
  Button,
  Card,
  CloseButton,
  EmptyState,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { Document, Font, Image, Page, StyleSheet, Text as PdfText, View, pdf } from "@react-pdf/renderer";
import { useEffect, useMemo, useState } from "react";
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
  statusLabel: string;
  statusColor: "green" | "cyan" | "yellow" | "red";
  statusOrder: number;
  error: string | null;
};

type CalcularFormValues = {
  colaboradores: (string | number)[];
};

function getDefaultPeriodo() {
  const now = new Date();
  const currentYear = now.getFullYear();

  return {
    periodo_desde: `${currentYear - 1}-12-01`,
    periodo_hasta: `${currentYear}-11-30`,
    anio: currentYear,
  };
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
  infoBox: {
    borderWidth: 1,
    borderColor: "#D7E0F1",
    padding: 10,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    width: 240,
    borderWidth: 1,
    borderColor: "#123B7A",
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

  return (
    <Document>
      <Page size="A4" style={aguinaldoPdfStyles.page}>
        <View style={aguinaldoPdfStyles.topBar}>
          <PdfText style={aguinaldoPdfStyles.companyName}>{companyName}</PdfText>
          <PdfText>{formatDateUiCompact(detail.generado_en ?? new Date().toISOString())}</PdfText>
        </View>

        <Image src={logoPdf} style={aguinaldoPdfStyles.logo} />
        <PdfText style={aguinaldoPdfStyles.title}>Detalle de aguinaldo</PdfText>

        <PdfText style={aguinaldoPdfStyles.sectionTitle}>Informacion de la empresa</PdfText>
        <View style={aguinaldoPdfStyles.infoBox}>
          <View style={aguinaldoPdfStyles.infoRow}>
            <PdfText style={aguinaldoPdfStyles.label}>Empresa</PdfText>
            <PdfText style={aguinaldoPdfStyles.value}>{companyName}</PdfText>
          </View>
          <View style={aguinaldoPdfStyles.infoRow}>
            <PdfText style={aguinaldoPdfStyles.label}>Documento</PdfText>
            <PdfText style={aguinaldoPdfStyles.value}>Detalle de aguinaldo</PdfText>
          </View>
          <View style={aguinaldoPdfStyles.infoRow}>
            <PdfText style={aguinaldoPdfStyles.label}>Generado en</PdfText>
            <PdfText style={aguinaldoPdfStyles.value}>{formatDateUiCompact(detail.generado_en ?? new Date().toISOString())}</PdfText>
          </View>
        </View>

        <PdfText style={aguinaldoPdfStyles.sectionTitle}>Informacion general</PdfText>
        <View style={aguinaldoPdfStyles.infoBox}>
          <View style={aguinaldoPdfStyles.infoRow}>
            <PdfText style={aguinaldoPdfStyles.label}>Colaborador</PdfText>
            <PdfText style={aguinaldoPdfStyles.value}>{detail.nombre_completo}</PdfText>
          </View>
          <View style={aguinaldoPdfStyles.infoRow}>
            <PdfText style={aguinaldoPdfStyles.label}>Identificacion</PdfText>
            <PdfText style={aguinaldoPdfStyles.value}>{String(detail.identificacion ?? "N/D")}</PdfText>
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
          <View style={aguinaldoPdfStyles.infoRow}>
            <PdfText style={aguinaldoPdfStyles.label}>Registrado por</PdfText>
            <PdfText style={aguinaldoPdfStyles.value}>{detail.registrado_por?.nombre_completo ?? "N/D"}</PdfText>
          </View>
        </View>

        <PdfText style={aguinaldoPdfStyles.sectionTitle}>Desglose mensual bruto</PdfText>
        <View style={aguinaldoPdfStyles.table}>
          <View style={aguinaldoPdfStyles.tableRow}>
            <PdfText style={aguinaldoPdfStyles.headerCell}>Mes</PdfText>
            <PdfText style={aguinaldoPdfStyles.headerCell}>Anio</PdfText>
            <PdfText style={aguinaldoPdfStyles.headerCell}>Bruto mensual</PdfText>
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
          <View style={aguinaldoPdfStyles.infoRow}>
            <PdfText style={aguinaldoPdfStyles.label}>Total bruto periodo</PdfText>
            <PdfText style={aguinaldoPdfStyles.value}>{formatPdfCRC(detail.total_bruto_periodo)}</PdfText>
          </View>
          <View style={aguinaldoPdfStyles.infoRow}>
            <PdfText style={aguinaldoPdfStyles.label}>Aguinaldo registrado</PdfText>
            <PdfText style={aguinaldoPdfStyles.value}>{formatPdfCRC(detail.monto_registrado)}</PdfText>
          </View>
          <View style={aguinaldoPdfStyles.infoRow}>
            <PdfText style={aguinaldoPdfStyles.label}>Aguinaldo recalculado actual</PdfText>
            <PdfText style={aguinaldoPdfStyles.value}>{formatPdfCRC(detail.monto_calculado_actual)}</PdfText>
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
    const fallbackFromQuery = {
      anio: Number.isInteger(yearFromQuery) && yearFromQuery > 0 ? yearFromQuery : defaults.anio,
      periodo_desde: searchParams.get("periodo_desde") ?? defaults.periodo_desde,
      periodo_hasta: searchParams.get("periodo_hasta") ?? defaults.periodo_hasta,
      fecha_pago: searchParams.get("fecha_pago") ?? `${defaults.anio}-12-15`,
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
  } = useApiQuery<AguinaldoElegiblesResponse | null>({
    url: elegiblesUrl,
    enabled: Boolean(elegiblesUrl),
  });

  const eligibleCollaborators = useMemo(
    () => eligibleData?.colaboradores ?? [],
    [eligibleData],
  );

  const options = useMemo<SelectOption[]>(
    () => eligibleCollaborators.map((collaborator) => ({
      label: collaborator.tiene_aguinaldo
        ? `${toTitleCase(collaborator.nombre_completo)} (ya registrado)`
        : toTitleCase(collaborator.nombre_completo),
      value: String(collaborator.id_colaborador),
    })),
    [eligibleCollaborators],
  );

  const collaboratorNameMap = useMemo(() => {
    const map = new Map<number, string>();
    eligibleCollaborators.forEach((collaborator) => {
      map.set(Number(collaborator.id_colaborador), toTitleCase(collaborator.nombre_completo));
    });
    return map;
  }, [eligibleCollaborators]);

  const hasEligibleCollaborators = options.length > 0;

  const {
    mutate: simularCalculo,
    isLoading: isSimulating,
  } = useApiMutation<
    { colaboradores: number[]; periodo_desde: string; periodo_hasta: string },
    AguinaldoSimulacionResponse
  >({ url: "aguinaldos/calcular-lote", method: "POST" });

  const [simulacion, setSimulacion] = useState<AguinaldoSimulacion[]>([]);

  const {
    mutate: crearLote,
    isLoading: isCreating,
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

      setSimulacion(data);

      return true;
    } catch {
      setSimulacion([]);
      return false;
    }
  };

  const handleCrear = async (values: CalcularFormValues) => {
    const collaboratorIds = (values.colaboradores ?? [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (collaboratorIds.length === 0) {
      showToast("Seleccione al menos un colaborador.", "error");
      return;
    }

    if (!user?.id) {
      showToast("No se pudo identificar al usuario autenticado.", "error");
      return;
    }

    const anio = parseUiDateSafe(resolvedPeriod.periodo_hasta)?.getFullYear() ?? Number(resolvedPeriod.anio);

    try {
      await crearLote({
        colaboradores: collaboratorIds,
        periodo_desde: resolvedPeriod.periodo_desde,
        periodo_hasta: resolvedPeriod.periodo_hasta,
        anio,
        fecha_pago: resolvedPeriod.fecha_pago,
        registrado_por: Number(user.id),
      });

      setSimulacion([]);

      if (isNewPeriod) {
        const createdPeriodoKey = buildAguinaldoPeriodoKey({
          anio,
          periodo_desde: resolvedPeriod.periodo_desde,
          periodo_hasta: resolvedPeriod.periodo_hasta,
          fecha_pago: resolvedPeriod.fecha_pago,
        });

        navigate(`/aguinaldos/${encodeURIComponent(createdPeriodoKey)}`);
      } else {
        refetchRecords();
      }
    } catch (error: any) {
      if (error?.status === 409 || error?.response?.status === 409) {
        showToast(
          "Algunos colaboradores ya tienen aguinaldo para este periodo. Use la opcion de recalcular en la tabla de registros.",
          "warning",
        );
        refetchRecords();
      }
    }
  };

  const handleRecalcularRecord = async (idAguinaldo: number) => {
    setRecalculatingRecordId(idAguinaldo);

    try {
      await recalcular({ ids: [idAguinaldo] });
      refetchRecords();
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
        statusLabel: "Generado",
        statusColor: "green",
        statusOrder: 3,
        error: null,
      });
    });

    simulacion.forEach((item) => {
      if (rowsByCollaborator.has(item.id_colaborador)) return;

      const hasError = Boolean(item.error);
      const hasMonto = Number(item.monto_aguinaldo ?? 0) > 0;

      rowsByCollaborator.set(item.id_colaborador, {
        kind: "simulation",
        key: `s-${item.id_colaborador}`,
        idAguinaldo: null,
        collaboratorId: item.id_colaborador,
        fullName: toTitleCase(item.nombre_completo),
        identification: item.identificacion,
        aguinaldo: Number(item.monto_aguinaldo ?? 0),
        statusLabel: hasError ? "Error" : hasMonto ? "Listo para crear" : "Sin datos",
        statusColor: hasError ? "red" : hasMonto ? "cyan" : "yellow",
        statusOrder: hasError ? 0 : hasMonto ? 2 : 1,
        error: item.error ?? null,
      });
    });

    return Array.from(rowsByCollaborator.values());
  }, [existingRecords, simulacion]);

  const sortedReviewTableRows = useMemo(() => {
    const direction = reviewTableQuery.sortDir === "asc" ? 1 : -1;

    return [...reviewTableRows].sort((left, right) => {
      if (reviewTableQuery.sortBy === "fullName") {
        return direction * left.fullName.localeCompare(right.fullName, "es-CR");
      }

      if (reviewTableQuery.sortBy === "estado") {
        return direction * (left.statusOrder - right.statusOrder);
      }

      return direction * (left.aguinaldo - right.aguinaldo);
    });
  }, [reviewTableQuery.sortBy, reviewTableQuery.sortDir, reviewTableRows]);

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
        cell: (row) => (
          <Stack gap="1">
            <Badge colorPalette={row.statusColor} variant="subtle">
              {row.statusLabel}
            </Badge>
            {row.error ? (
              <Text textStyle="xs" color="red.600">{row.error}</Text>
            ) : null}
          </Stack>
        ),
      },
    ],
    [reviewTableQuery.sortBy, reviewTableQuery.sortDir],
  );

  return (
    <Layout pageTitle={isNewPeriod ? "Nuevo periodo de aguinaldo" : `Detalle de periodo ${periodLabel}`}>
      <Stack gap="8" marginBottom="5rem">
        <Form<CalcularFormValues>
          key={`detalle-aguinaldo-${periodoKey ?? "nuevo"}-${resolvedPeriod.periodo_desde}-${resolvedPeriod.fecha_pago}`}
          onSubmit={handlePrecalculo}
          defaultValues={{
            colaboradores: [],
          }}
        >
          <Card.Root as="section">
            <Card.Header>
              <Card.Title>{isNewPeriod ? "Calcular aguinaldos" : "Gestionar aguinaldos del periodo"}</Card.Title>
              <Card.Description>
                El periodo y fecha de pago se toman de la vista anterior.
              </Card.Description>
            </Card.Header>

            <Card.Body>
              <Stack gap="4">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
                  <Stack gap="0.5">
                    <Text textStyle="xs" color="fg.muted">Periodo</Text>
                    <Text fontWeight="semibold">{periodLabel}</Text>
                  </Stack>
                  <Stack gap="0.5">
                    <Text textStyle="xs" color="fg.muted">Fecha de pago</Text>
                    <Text fontWeight="semibold">{formatDateUiCompact(resolvedPeriod.fecha_pago)}</Text>
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
                        ? "Sin colaboradores elegibles"
                        : "Seleccione uno o varios"
                  }
                  selectRootProps={{
                    multiple: true,
                    disabled: eligibleLoading || !hasEligibleCollaborators,
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

                <SelectedCollaboratorsBadges collaboratorNameMap={collaboratorNameMap} />

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
                isCreating={isCreating}
                hasSimulacion={simulacion.length > 0}
                disabled={eligibleLoading || !hasEligibleCollaborators}
                onCrear={handleCrear}
              />
            </Card.Footer>
          </Card.Root>
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
              isDataLoading={loadingRecords || isSimulating}
              actionColumn={{
                header: "Acciones",
                w: "440px",
                cell: (row) => {
                  if (row.kind !== "generated" || !row.idAguinaldo) {
                    return (
                      <Text textStyle="sm" color="fg.muted">
                        Pendiente de generar
                      </Text>
                    );
                  }

                  return (
                    <HStack justify="flex-end" gap="2" wrap="nowrap">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        colorPalette="blue"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenDetail(row.idAguinaldo!);
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
                        loading={isRecalculating && recalculatingRecordId === row.idAguinaldo}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRecalcularRecord(row.idAguinaldo!);
                        }}
                      >
                        <FiRefreshCw />
                        Recalcular
                      </Button>
                    </HStack>
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
  collaboratorNameMap,
}: {
  collaboratorNameMap: Map<number, string>;
}) => {
  const { control, setValue } = useFormContext<CalcularFormValues>();
  const selected = useWatch({ control, name: "colaboradores" });

  if (!Array.isArray(selected) || selected.length === 0) {
    return (
      <Text textStyle="sm" color="fg.muted">
        No hay colaboradores seleccionados actualmente.
      </Text>
    );
  }

  const handleRemove = (idToRemove: string) => {
    const nextValues = selected
      .map((value) => String(value))
      .filter((id) => id !== idToRemove);

    setValue("colaboradores", nextValues, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

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
                handleRemove(String(value));
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
  isCreating,
  hasSimulacion,
  disabled,
  onCrear,
}: {
  isSimulating: boolean;
  isCreating: boolean;
  hasSimulacion: boolean;
  disabled: boolean;
  // eslint-disable-next-line no-unused-vars
  onCrear: (values: CalcularFormValues) => Promise<void>;
}) => {
  const { getValues } = useFormContext<CalcularFormValues>();

  return (
    <>
      <Button
        type="submit"
        colorPalette="blue"
        variant="outline"
        loading={isSimulating}
        disabled={disabled || isSimulating}
      >
        Precalculo
      </Button>

      {hasSimulacion && (
        <Button
          type="button"
          colorPalette="green"
          loading={isCreating}
          disabled={disabled || isCreating}
          onClick={() => onCrear(getValues())}
        >
          Crear aguinaldos
        </Button>
      )}
    </>
  );
};
