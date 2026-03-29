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
  Separator,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { Document, Font, Image, Page, StyleSheet, Text as PdfText, View, pdf } from "@react-pdf/renderer";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  FiArrowDown,
  FiArrowUp,
  FiDollarSign,
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
type RegistroSortField = "nombre" | "anio" | "periodo" | "monto" | "fecha_pago" | "registrado_por";

type CalcularFormValues = {
  colaboradores: (string | number)[];
  periodo_desde: string;
  periodo_hasta: string;
  fecha_pago: string;
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

export const Aguinaldos = () => {
  const { user } = useAuth();
  const defaults = useMemo(() => getDefaultPeriodo(), []);
  const existentesRef = useRef<HTMLDivElement>(null);

  const [periodoElegibles, setPeriodoElegibles] = useState({
    periodo_desde: defaults.periodo_desde,
    periodo_hasta: defaults.periodo_hasta,
  });

  const elegiblesUrl = useMemo(() => {
    if (!periodoElegibles.periodo_desde || !periodoElegibles.periodo_hasta) return "";

    const params = new URLSearchParams({
      periodo_desde: periodoElegibles.periodo_desde,
      periodo_hasta: periodoElegibles.periodo_hasta,
    });

    return `aguinaldos/elegibles?${params.toString()}`;
  }, [periodoElegibles.periodo_desde, periodoElegibles.periodo_hasta]);

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

  const pendingEligibleCollaboratorIds = useMemo(
    () => eligibleCollaborators
      .filter((item) => !item.tiene_aguinaldo)
      .map((item) => item.id_colaborador),
    [eligibleCollaborators],
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
  const [simulacionMeta, setSimulacionMeta] = useState<{
    periodo_desde: string;
    periodo_hasta: string;
  } | null>(null);

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

  const {
    data: existingRecords = [],
    isLoading: loadingRecords,
    refetch: refetchRecords,
  } = useApiQuery<AguinaldoRegistro[]>({ url: "aguinaldos" });

  const [selectedRecordKeys, setSelectedRecordKeys] = useState<string[]>([]);
  const [recordsSortBy, setRecordsSortBy] = useState<RegistroSortField>("anio");
  const [recordsSortDir, setRecordsSortDir] = useState<SortDir>("desc");

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<number | null>(null);
  const [isDownloadingDetailPdf, setIsDownloadingDetailPdf] = useState(false);

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

  useEffect(() => {
    if (existingRecords.length === 0) {
      setSelectedRecordKeys((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    const validKeys = new Set(existingRecords.map((record) => String(record.id_aguinaldo)));

    setSelectedRecordKeys((prev) => {
      const next = prev.filter((key) => validKeys.has(key));
      const hasSameOrder = next.length === prev.length && next.every((key, index) => key === prev[index]);
      return hasSameOrder ? prev : next;
    });
  }, [existingRecords]);

  const selectedRecordIds = useMemo(
    () => selectedRecordKeys
      .map((key) => Number(key))
      .filter((id) => Number.isInteger(id) && id > 0),
    [selectedRecordKeys],
  );

  const sortedExistingRecords = useMemo(() => {
    const rows = [...existingRecords];

    rows.sort((left, right) => {
      let result = 0;

      if (recordsSortBy === "nombre") {
        result = String(left.nombre_completo ?? "").localeCompare(String(right.nombre_completo ?? ""), "es", {
          sensitivity: "base",
        });
      } else if (recordsSortBy === "anio") {
        result = Number(left.anio) - Number(right.anio);
      } else if (recordsSortBy === "periodo") {
        result = String(left.periodo_desde).localeCompare(String(right.periodo_desde));
      } else if (recordsSortBy === "monto") {
        result = Number(left.monto_calculado) - Number(right.monto_calculado);
      } else if (recordsSortBy === "fecha_pago") {
        result = String(left.fecha_pago).localeCompare(String(right.fecha_pago));
      } else {
        result = String(left.registrado_por_nombre ?? "").localeCompare(String(right.registrado_por_nombre ?? ""), "es", {
          sensitivity: "base",
        });
      }

      if (result === 0) {
        result = Number(right.id_aguinaldo) - Number(left.id_aguinaldo);
      }

      return recordsSortDir === "asc" ? result : -result;
    });

    return rows;
  }, [existingRecords, recordsSortBy, recordsSortDir]);

  const handleRecordsSortChange = (field: RegistroSortField) => {
    setRecordsSortBy((prevSortBy) => {
      if (prevSortBy === field) {
        setRecordsSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevSortBy;
      }

      setRecordsSortDir("asc");
      return field;
    });
  };

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
        periodo_desde: values.periodo_desde,
        periodo_hasta: values.periodo_hasta,
      });

      const data = (response as any)?.resultados ?? (response as any)?.data?.resultados ?? [];

      setSimulacion(data);
      setSimulacionMeta({
        periodo_desde: values.periodo_desde,
        periodo_hasta: values.periodo_hasta,
      });

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

    const anio = parseUiDateSafe(values.periodo_hasta)?.getFullYear() ?? Number(defaults.anio);

    try {
      await crearLote({
        colaboradores: collaboratorIds,
        periodo_desde: values.periodo_desde,
        periodo_hasta: values.periodo_hasta,
        anio,
        fecha_pago: values.fecha_pago,
        registrado_por: Number(user.id),
      });

      setSimulacion([]);
      setSimulacionMeta(null);
      refetchRecords();
    } catch (error: any) {
      if (error?.status === 409 || error?.response?.status === 409) {
        showToast(
          "Algunos colaboradores ya tienen aguinaldo para este periodo. Use la opcion de recalcular en la tabla de registros.",
          "warning",
        );
        setTimeout(() => {
          existentesRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
        refetchRecords();
      }
    }
  };

  const handleRecalcular = async () => {
    if (selectedRecordIds.length === 0) {
      showToast("Seleccione al menos un registro para recalcular.", "info");
      return;
    }

    try {
      await recalcular({ ids: selectedRecordIds });
      setSelectedRecordKeys([]);
      refetchRecords();
    } catch {
      // Global API toast handles visible error
    }
  };

  const totalSimulado = useMemo(
    () => simulacion.reduce((acc, row) => acc + (row.monto_aguinaldo ?? 0), 0),
    [simulacion],
  );

  const existingRecordsColumns = useMemo<DataTableColumn<AguinaldoRegistro>[]>(
    () => [
      {
        id: "colaborador",
        minW: "240px",
        header: (
          <SortHeader
            label="Colaborador"
            field="nombre"
            currentSortBy={recordsSortBy}
            currentSortDir={recordsSortDir}
            onChange={handleRecordsSortChange}
          />
        ),
        cell: (row) => toTitleCase(row.nombre_completo),
      },
      {
        id: "anio",
        minW: "100px",
        header: (
          <SortHeader
            label="Anio"
            field="anio"
            currentSortBy={recordsSortBy}
            currentSortDir={recordsSortDir}
            onChange={handleRecordsSortChange}
          />
        ),
        cell: (row) => row.anio,
      },
      {
        id: "periodo",
        minW: "230px",
        header: (
          <SortHeader
            label="Periodo"
            field="periodo"
            currentSortBy={recordsSortBy}
            currentSortDir={recordsSortDir}
            onChange={handleRecordsSortChange}
          />
        ),
        cell: (row) => `${formatDateUiCompact(row.periodo_desde)} - ${formatDateUiCompact(row.periodo_hasta)}`,
      },
      {
        id: "monto",
        minW: "150px",
        textAlign: "end",
        header: (
          <SortHeader
            label="Monto"
            field="monto"
            currentSortBy={recordsSortBy}
            currentSortDir={recordsSortDir}
            onChange={handleRecordsSortChange}
          />
        ),
        cell: (row) => (
          <Text fontWeight="semibold" color="green.600">{formatCRC(row.monto_calculado)}</Text>
        ),
      },
      {
        id: "fecha_pago",
        minW: "170px",
        header: (
          <SortHeader
            label="Fecha pago"
            field="fecha_pago"
            currentSortBy={recordsSortBy}
            currentSortDir={recordsSortDir}
            onChange={handleRecordsSortChange}
          />
        ),
        cell: (row) => formatDateUiCompact(row.fecha_pago),
      },
      {
        id: "registrado_por",
        minW: "220px",
        header: (
          <SortHeader
            label="Registrado por"
            field="registrado_por"
            currentSortBy={recordsSortBy}
            currentSortDir={recordsSortDir}
            onChange={handleRecordsSortChange}
          />
        ),
        cell: (row) => toTitleCase(row.registrado_por_nombre),
      },
    ],
    [recordsSortBy, recordsSortDir],
  );

  return (
    <Layout pageTitle="Aguinaldos">
      <Stack gap="8" marginBottom="5rem">
        <Form<CalcularFormValues>
          onSubmit={handlePrecalculo}
          defaultValues={{
            colaboradores: [],
            periodo_desde: defaults.periodo_desde,
            periodo_hasta: defaults.periodo_hasta,
            fecha_pago: `${defaults.anio}-12-15`,
          }}
        >
          <EligiblePeriodWatcher onPeriodChange={setPeriodoElegibles} />
          <SyncEligibleCollaboratorSelection
            isLoading={eligibleLoading}
            periodoKey={`${periodoElegibles.periodo_desde}|${periodoElegibles.periodo_hasta}`}
            pendingIds={pendingEligibleCollaboratorIds}
          />

          <Stack direction={{ base: "column", xl: "row" }} align="flex-start" gap="6">
            <Card.Root as="section" w={{ base: "full", xl: "560px" }} flexShrink={0}>
              <Card.Header>
                <Card.Title>Calcular aguinaldos</Card.Title>
                <Card.Description>
                  Se preseleccionan colaboradores elegibles pendientes para el periodo indicado.
                  Puede retirar cualquiera con la X antes de ejecutar el precalculo.
                </Card.Description>
              </Card.Header>

              <Card.Body>
                <Stack gap="4">
                  <SimpleGrid columns={2} gap="3">
                    <InputField
                      fieldType="date"
                      name="periodo_desde"
                      label="Periodo desde"
                      required
                    />
                    <InputField
                      fieldType="date"
                      name="periodo_hasta"
                      label="Periodo hasta"
                      required
                    />
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

                  {eligibleData && (
                    <HStack justify="space-between" fontSize="sm" color="fg.muted">
                      <Text>Elegibles: {eligibleData.total_elegibles}</Text>
                      <Text>Pendientes: {eligibleData.total_pendientes}</Text>
                      <Text>Registrados: {eligibleData.total_generados}</Text>
                    </HStack>
                  )}

                  <InputField
                    fieldType="date"
                    name="fecha_pago"
                    label="Fecha de pago"
                    required
                  />
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

            <Stack flex="1" gap="4" w="full">
              {isSimulating ? (
                <Stack align="center" py="10" gap="3">
                  <Spinner size="lg" />
                  <Text color="fg.muted">Generando precalculo...</Text>
                </Stack>
              ) : simulacion.length > 0 ? (
                <Stack gap="4">
                  <Card.Root>
                    <Card.Body>
                      <SimpleGrid columns={{ base: 2, md: 3 }} gap="4">
                        <Box>
                          <Text textStyle="xs" color="fg.muted">Colaboradores</Text>
                          <Heading size="md">{simulacion.length}</Heading>
                        </Box>
                        <Box>
                          <Text textStyle="xs" color="fg.muted">Periodo</Text>
                          <Text fontWeight="semibold">
                            {formatDateUiCompact(simulacionMeta?.periodo_desde)} - {" "}
                            {formatDateUiCompact(simulacionMeta?.periodo_hasta)}
                          </Text>
                        </Box>
                        <Box>
                          <Text textStyle="xs" color="fg.muted">Total aguinaldos</Text>
                          <Heading size="md" color="green.600">{formatCRC(totalSimulado)}</Heading>
                        </Box>
                      </SimpleGrid>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root>
                    <Card.Header>
                      <Card.Title>Vista previa del precalculo</Card.Title>
                    </Card.Header>
                    <Card.Body p="0">
                      <Table.Root size="sm" variant="outline">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>Colaborador</Table.ColumnHeader>
                            <Table.ColumnHeader>Identificacion</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">Total bruto</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">Aguinaldo</Table.ColumnHeader>
                            <Table.ColumnHeader>Estado</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {simulacion.map((item) => (
                            <Table.Row key={item.id_colaborador}>
                              <Table.Cell>{toTitleCase(item.nombre_completo)}</Table.Cell>
                              <Table.Cell>{item.identificacion ?? "N/D"}</Table.Cell>
                              <Table.Cell textAlign="right">{formatCRC(item.total_bruto)}</Table.Cell>
                              <Table.Cell textAlign="right">
                                <Text fontWeight="bold" color="green.600">{formatCRC(item.monto_aguinaldo)}</Text>
                              </Table.Cell>
                              <Table.Cell>
                                {item.error ? (
                                  <Badge colorPalette="red" variant="subtle">Error</Badge>
                                ) : item.monto_aguinaldo > 0 ? (
                                  <Badge colorPalette="green" variant="subtle">OK</Badge>
                                ) : (
                                  <Badge colorPalette="yellow" variant="subtle">Sin datos</Badge>
                                )}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Card.Body>
                  </Card.Root>
                </Stack>
              ) : (
                <EmptyState.Root colorPalette="blue" border="0.15rem dashed" borderColor="blue.600" py="12">
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <FiDollarSign />
                    </EmptyState.Indicator>
                    <EmptyState.Title>Ejecute el precalculo de aguinaldos</EmptyState.Title>
                    <EmptyState.Description>
                      Seleccione colaboradores y periodo, luego presione "Precalculo" para ver el resultado antes de crear registros.
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Stack>
          </Stack>
        </Form>

        <Separator />
        <div ref={existentesRef}>
          <Card.Root>
            <Card.Header>
              <Flex justify="space-between" align="center" wrap="wrap" gap="3">
                <Box>
                  <Card.Title>Aguinaldos registrados</Card.Title>
                  <Card.Description>
                    Seleccione uno o varios para recalcular, y use "Ver" para abrir detalle mensual bruto.
                  </Card.Description>
                </Box>
                <Button
                  colorPalette="orange"
                  variant="outline"
                  size="sm"
                  onClick={handleRecalcular}
                  loading={isRecalculating}
                  disabled={selectedRecordIds.length === 0 || isRecalculating}
                >
                  <FiRefreshCw />
                  Recalcular seleccionados ({selectedRecordIds.length})
                </Button>
              </Flex>
            </Card.Header>

            <Card.Body p="0">
              {loadingRecords ? (
                <Stack align="center" py="10" gap="3">
                  <Spinner size="lg" />
                  <Text color="fg.muted">Cargando registros...</Text>
                </Stack>
              ) : (
                <DataTable<AguinaldoRegistro>
                  isDataLoading={loadingRecords}
                  data={sortedExistingRecords}
                  columns={existingRecordsColumns}
                  selection={{
                    enabled: true,
                    selectedKeys: selectedRecordKeys,
                    onChange: setSelectedRecordKeys,
                    getRowKey: (row) => String(row.id_aguinaldo),
                  }}
                  actionColumn={{
                    header: "Acciones",
                    w: "200px",
                    textAlign: "end",
                    cell: (row) => (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        colorPalette="blue"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenDetail(row.id_aguinaldo);
                        }}
                      >
                        <FiEye />
                        Ver
                      </Button>
                    ),
                  }}
                />
              )}
            </Card.Body>
          </Card.Root>
        </div>
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

const EligiblePeriodWatcher = ({
  onPeriodChange,
}: {
  // eslint-disable-next-line no-unused-vars
  onPeriodChange: (periodo: { periodo_desde: string; periodo_hasta: string }) => void;
}) => {
  const { control } = useFormContext<CalcularFormValues>();
  const periodoDesde = useWatch({ control, name: "periodo_desde" });
  const periodoHasta = useWatch({ control, name: "periodo_hasta" });

  useEffect(() => {
    if (!periodoDesde || !periodoHasta) return;
    onPeriodChange({ periodo_desde: periodoDesde, periodo_hasta: periodoHasta });
  }, [onPeriodChange, periodoDesde, periodoHasta]);

  return null;
};

const SyncEligibleCollaboratorSelection = ({
  pendingIds,
  periodoKey,
  isLoading,
}: {
  pendingIds: number[];
  periodoKey: string;
  isLoading: boolean;
}) => {
  const { setValue } = useFormContext<CalcularFormValues>();
  const lastSyncedPeriodoRef = useRef<string>("");

  useEffect(() => {
    if (!periodoKey || isLoading) return;
    if (lastSyncedPeriodoRef.current === periodoKey) return;

    setValue(
      "colaboradores",
      pendingIds.map((id) => String(id)),
      { shouldDirty: false, shouldValidate: true },
    );

    lastSyncedPeriodoRef.current = periodoKey;
  }, [isLoading, pendingIds, periodoKey, setValue]);

  return null;
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
