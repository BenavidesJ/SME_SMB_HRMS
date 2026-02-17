import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  Input,
  Separator,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { FiDownload, FiEye } from "react-icons/fi";
import { Document, Image, Page, StyleSheet, Text as PdfText, View, pdf } from "@react-pdf/renderer";

import { Layout } from "../../../components/layout";
import { Form } from "../../../components/forms/Form/Form";
import { InputField, type SelectOption } from "../../../components/forms/InputField/InputField";
import { DataTable } from "../../../components/general/table/DataTable";
import type { DataTableColumn } from "../../../components/general/table/types";
import { Modal } from "../../../components/general";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { apiRequest } from "../../../services/api/request";
import {
  REPORTES_CATALOGO_URL,
  buildReporteDataUrl,
  type ReporteCatalogItem,
  type ReporteColumn,
  type ReporteDataResponse,
  type ReporteQueryParams,
} from "../../../services/api/reportes";

import logoColor from "../../../assets/LogoColor.svg";
import logoPdf from "../../../assets/logo.jpg";

type ReporteFiltroForm = {
  reportKey: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  limit: string;
  columnsCsv: string;
  idPeriodo: string;
  idColaborador: string;
  idDepartamento: string;
};

const INITIAL_REPORTE_DATA: ReporteDataResponse = {
  key: "",
  label: "",
  generatedAt: "",
  columns: [],
  selectedColumns: [],
  rows: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  },
  notes: [],
  summary: {},
};

const COMPANY_NAME = "BioAlquimia";

const MONEY_COLUMN_HINTS = [
  "total",
  "monto",
  "neto",
  "bruto",
  "deduccion",
  "deducciones",
  "aporte",
  "costo",
  "provision",
  "salario",
  "importe",
];

const DATE_COLUMN_HINTS = ["fecha", "date", "mes", "periodo"];

const crcFormatter = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pdfStyles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 12,
    objectFit: "contain",
  },
  title: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: 700,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderColor: "#1f3c73",
    borderWidth: 1,
  },
  tableRow: {
    flexDirection: "row",
  },
  headerCell: {
    backgroundColor: "#1f3c73",
    color: "#FFFFFF",
    borderStyle: "solid",
    borderColor: "#1f3c73",
    borderWidth: 1,
    padding: 4,
    fontSize: 9,
    flexGrow: 1,
    flexBasis: 0,
  },
  bodyCell: {
    borderStyle: "solid",
    borderColor: "#B6C2D9",
    borderWidth: 1,
    padding: 4,
    fontSize: 8,
    flexGrow: 1,
    flexBasis: 0,
  },
  footer: {
    marginTop: 10,
    textAlign: "right",
    fontSize: 8,
    color: "#4A5568",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 9,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 700,
    color: "#14204a",
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    padding: 4,
    backgroundColor: "#105cc7",
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: 700,
  },
});

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function tryParseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;

  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T/;

  if (!dateOnlyRegex.test(value) && !dateTimeRegex.test(value)) return null;

  const candidate = dateOnlyRegex.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function formatLongDate(value: unknown) {
  const parsed = tryParseDate(value);
  if (!parsed) return null;

  const parts = new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).formatToParts(parsed);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  if (!weekday || !day || !month || !year) return null;
  return `${capitalize(weekday)} ${day} de ${capitalize(month)}, ${year}`;
}

function isMoneyColumn(columnKey: string) {
  const normalized = columnKey.toLowerCase();
  return MONEY_COLUMN_HINTS.some((hint) => normalized.includes(hint));
}

function isDateColumn(columnKey: string) {
  const normalized = columnKey.toLowerCase();
  return DATE_COLUMN_HINTS.some((hint) => normalized.includes(hint));
}

function formatReportValue(columnKey: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "N/D";

  const maybeDate = formatLongDate(value);
  if (maybeDate && (isDateColumn(columnKey) || typeof value === "string")) return maybeDate;

  if (typeof value === "number") {
    if (isMoneyColumn(columnKey)) return crcFormatter.format(value);
    return Number(value.toFixed(2)).toLocaleString("es-CR");
  }

  const parsedNumber = Number(value);
  if (!Number.isNaN(parsedNumber) && isMoneyColumn(columnKey)) {
    return crcFormatter.format(parsedNumber);
  }

  return String(value);
}

function buildPdfTitle(reportLabel: string, dateFrom?: string, dateTo?: string) {
  const fromText = formatLongDate(dateFrom) ?? "Inicio";
  const toText = formatLongDate(dateTo) ?? "Actual";
  const periodo = dateFrom || dateTo ? ` - período ${fromText} a ${toText}` : "";
  return `${reportLabel}${periodo}`;
}

function ReportPdfDocument(props: {
  companyName: string;
  title: string;
  generatedAt: string;
  columns: ReporteColumn[];
  rows: Array<Record<string, string | number | null>>;
}) {
  const { companyName, title, generatedAt, columns, rows } = props;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.topBar}>
          <PdfText style={pdfStyles.companyName}>{companyName}</PdfText>
          <PdfText>{formatLongDate(generatedAt) ?? generatedAt}</PdfText>
        </View>

        <Image src={logoPdf} style={pdfStyles.logo} />
        <PdfText style={pdfStyles.title}>{title}</PdfText>

        <PdfText style={pdfStyles.sectionTitle}>Datos del informe</PdfText>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            {columns.map((column) => (
              <PdfText key={`header-${column.key}`} style={pdfStyles.headerCell}>
                {column.label}
              </PdfText>
            ))}
          </View>

          {rows.map((row, index) => (
            <View key={`row-${index}`} style={pdfStyles.tableRow}>
              {columns.map((column) => (
                <PdfText key={`cell-${index}-${column.key}`} style={pdfStyles.bodyCell}>
                  {formatReportValue(column.key, row[column.key])}
                </PdfText>
              ))}
            </View>
          ))}
        </View>

        <PdfText style={pdfStyles.footer}>Generado por BioAlquimia</PdfText>
      </Page>
    </Document>
  );
}

export const Reportes = () => {
  const [selectedReportKey, setSelectedReportKey] = useState<string>("");
  const [query, setQuery] = useState<ReporteQueryParams>({
    page: 1,
    limit: 10,
    sortDir: "desc",
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [pdfPageStart, setPdfPageStart] = useState(1);
  const [pdfPageEnd, setPdfPageEnd] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewRows, setPreviewRows] = useState<Array<Record<string, string | number | null>>>([]);

  const { data: catalogo = [], isLoading: loadingCatalogo } = useApiQuery<ReporteCatalogItem[]>({
    url: REPORTES_CATALOGO_URL,
  });

  useEffect(() => {
    if (!selectedReportKey && catalogo.length > 0) {
      setSelectedReportKey(catalogo[0].key);
    }
  }, [catalogo, selectedReportKey]);

  const reporteDataUrl = useMemo(() => {
    if (!selectedReportKey) return "";
    return buildReporteDataUrl(selectedReportKey, query);
  }, [selectedReportKey, query]);

  const {
    data: reporteData,
    isLoading: loadingReporte,
  } = useApiQuery<ReporteDataResponse>({
    url: reporteDataUrl,
    enabled: Boolean(reporteDataUrl),
    initialData: INITIAL_REPORTE_DATA,
  });

  useEffect(() => {
    const pages = reporteData?.pagination?.pages ?? 1;
    const page = reporteData?.pagination?.page ?? 1;
    setPdfPageStart(page);
    setPdfPageEnd(pages >= page ? page : pages);
  }, [reporteData?.pagination?.page, reporteData?.pagination?.pages]);

  const reportTitle = useMemo(
    () => buildPdfTitle(reporteData?.label ?? "Reporte", query.dateFrom, query.dateTo),
    [reporteData?.label, query.dateFrom, query.dateTo],
  );

  const reportOptions = useMemo<SelectOption[]>(
    () => catalogo.map((report) => ({ value: report.key, label: report.label })),
    [catalogo],
  );

  const sortOptions = useMemo<SelectOption[]>(() => {
    const options = (reporteData?.columns ?? []).map((column) => ({
      value: column.key,
      label: column.label,
    }));

    return [{ value: "", label: "Sin orden" }, ...options];
  }, [reporteData?.columns]);

  const selectedColumns = reporteData?.selectedColumns ?? [];

  const visibleColumns = useMemo(() => {
    const columnMap = new Map((reporteData?.columns ?? []).map((column) => [column.key, column]));
    return selectedColumns
      .map((columnKey) => columnMap.get(columnKey))
      .filter((column): column is ReporteColumn => Boolean(column));
  }, [reporteData?.columns, selectedColumns]);

  const tableColumns = useMemo<DataTableColumn<Record<string, string | number | null>>[]>(
    () =>
      visibleColumns.map((column) => ({
        id: column.key,
        header: column.label,
        minW: "180px",
        cell: (row) => formatReportValue(column.key, row[column.key]),
      })),
    [visibleColumns],
  );

  const handleFiltroSubmit = async (values: ReporteFiltroForm) => {
    setSelectedReportKey(values.reportKey);
    setQuery({
      page: 1,
      limit: Number(values.limit) || 10,
      sortBy: values.sortBy || undefined,
      sortDir: values.sortDir || "desc",
      search: values.search || undefined,
      dateFrom: values.dateFrom || undefined,
      dateTo: values.dateTo || undefined,
      columns: values.columnsCsv
        ? values.columnsCsv.split(",").map((column) => column.trim()).filter(Boolean)
        : undefined,
      idPeriodo: values.idPeriodo ? Number(values.idPeriodo) : undefined,
      idColaborador: values.idColaborador ? Number(values.idColaborador) : undefined,
      idDepartamento: values.idDepartamento ? Number(values.idDepartamento) : undefined,
    });

    return true;
  };

  const handlePageChange = (nextPage: number) => {
    setQuery((prev) => ({ ...prev, page: nextPage }));
  };

  const fetchRowsByPageRange = async (startPage: number, endPage: number) => {
    const pages = reporteData?.pagination?.pages ?? 1;
    const safeStart = Math.max(1, Math.min(startPage, pages));
    const safeEnd = Math.max(safeStart, Math.min(endPage, pages));

    const rows: Array<Record<string, string | number | null>> = [];

    for (let page = safeStart; page <= safeEnd; page += 1) {
      const url = buildReporteDataUrl(selectedReportKey, { ...query, page });
      const data = await apiRequest<ReporteDataResponse>({ url, method: "GET" });
      rows.push(...(data.rows ?? []));
    }

    return rows;
  };

  const handleOpenPreview = async () => {
    if (!selectedReportKey || !reporteData) return;

    setIsPreviewLoading(true);
    try {
      const rows = await fetchRowsByPageRange(1, reporteData.pagination.pages);
      setPreviewRows(rows);
      setPdfPageStart(1);
      setPdfPageEnd(reporteData.pagination.pages);
      setIsPreviewOpen(true);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedReportKey || !reporteData) return;

    setIsDownloading(true);
    try {
      const rows = await fetchRowsByPageRange(pdfPageStart, pdfPageEnd);
      const columns = visibleColumns;
      const title = buildPdfTitle(reporteData.label, query.dateFrom, query.dateTo);

      const blob = await pdf(
        <ReportPdfDocument
          companyName={COMPANY_NAME}
          title={title}
          generatedAt={reporteData.generatedAt}
          columns={columns}
          rows={rows}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedReportKey}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Layout pageTitle="Reportes">
      <Stack py="6" gap="6">
        <Card.Root>
          <Card.Header>
            <HStack justify="space-between" align="start" wrap="wrap" gap="4">
              <Stack gap="1">
                <Text fontWeight="bold" color="brand.blue.600" fontSize="xl">{COMPANY_NAME}</Text>
                <Card.Title>Centro de reportes empresariales</Card.Title>
                <Card.Description>
                  Seleccione el reporte y aplique filtros para análisis financiero y operativo.
                </Card.Description>
              </Stack>
              <Badge colorPalette="blue" variant="subtle">
                {formatLongDate(new Date().toISOString())}
              </Badge>
            </HStack>
          </Card.Header>
          <Card.Body>
            <Form<ReporteFiltroForm>
              onSubmit={handleFiltroSubmit}
              defaultValues={{
                reportKey: selectedReportKey || "",
                search: "",
                dateFrom: "",
                dateTo: "",
                sortBy: "",
                sortDir: "desc",
                limit: String(query.limit ?? 10),
                columnsCsv: "",
                idPeriodo: "",
                idColaborador: "",
                idDepartamento: "",
              }}
              formOptions={{
                values: {
                  reportKey: selectedReportKey || "",
                  search: String(query.search ?? ""),
                  dateFrom: String(query.dateFrom ?? ""),
                  dateTo: String(query.dateTo ?? ""),
                  sortBy: String(query.sortBy ?? ""),
                  sortDir: query.sortDir ?? "desc",
                  limit: String(query.limit ?? 10),
                  columnsCsv: (query.columns ?? []).join(","),
                  idPeriodo: query.idPeriodo ? String(query.idPeriodo) : "",
                  idColaborador: query.idColaborador ? String(query.idColaborador) : "",
                  idDepartamento: query.idDepartamento ? String(query.idDepartamento) : "",
                }
              }}
            >
              <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
                <InputField
                  fieldType="select"
                  label="Reporte"
                  name="reportKey"
                  required
                  disableSelectPortal
                  options={reportOptions}
                  placeholder={loadingCatalogo ? "Cargando..." : "Seleccione un reporte"}
                />
                <InputField fieldType="text" label="Buscar colaborador" name="search" placeholder="Nombre o apellido" />
                <InputField fieldType="date" label="Fecha desde" name="dateFrom" />
                <InputField fieldType="date" label="Fecha hasta" name="dateTo" />
                <InputField
                  fieldType="select"
                  label="Ordenar por"
                  name="sortBy"
                  disableSelectPortal
                  options={sortOptions}
                />
                <InputField
                  fieldType="select"
                  label="Dirección"
                  name="sortDir"
                  disableSelectPortal
                  options={[
                    { value: "desc", label: "Descendente" },
                    { value: "asc", label: "Ascendente" },
                  ]}
                />
                <InputField
                  fieldType="select"
                  label="Registros por página"
                  name="limit"
                  disableSelectPortal
                  options={[
                    { value: "10", label: "10" },
                    { value: "25", label: "25" },
                    { value: "50", label: "50" },
                    { value: "100", label: "100" },
                  ]}
                />
              </SimpleGrid>

              <HStack mt="2" justify="flex-end">
                <Button type="submit" colorPalette="blue" loading={loadingReporte}>Aplicar filtros</Button>
              </HStack>
            </Form>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <HStack justify="space-between" align="center" wrap="wrap">
              <Stack gap="0">
                <Card.Title>{reporteData?.label || "Reporte"}</Card.Title>
                <Card.Description>
                  Página {reporteData?.pagination?.page ?? 1} de {reporteData?.pagination?.pages ?? 1} • {reporteData?.pagination?.total ?? 0} registros
                </Card.Description>
              </Stack>
              <HStack gap="2" wrap="wrap">
                <Badge colorPalette="blue" variant="subtle">
                  Generado: {reporteData?.generatedAt ? formatLongDate(reporteData.generatedAt) : "-"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="blue"
                  onClick={handleOpenPreview}
                  loading={isPreviewLoading}
                  disabled={loadingReporte || (reporteData?.pagination?.total ?? 0) === 0}
                >
                  <FiEye /> Ver reporte
                </Button>
                <Button
                  size="sm"
                  colorPalette="blue"
                  onClick={handleDownloadPdf}
                  loading={isDownloading}
                  disabled={loadingReporte || (reporteData?.pagination?.total ?? 0) === 0}
                >
                  <FiDownload /> Descargar PDF
                </Button>
              </HStack>
            </HStack>
          </Card.Header>
          <Card.Body>
            <DataTable<Record<string, string | number | null>>
              data={loadingReporte ? [] : reporteData?.rows ?? []}
              columns={tableColumns}
              isDataLoading={loadingReporte}
              size="sm"
              pagination={{
                enabled: true,
                page: reporteData?.pagination?.page ?? 1,
                pageSize: reporteData?.pagination?.limit ?? 10,
                totalCount: reporteData?.pagination?.total ?? 0,
                onPageChange: handlePageChange,
              }}
            />

            {(reporteData?.notes?.length ?? 0) > 0 && (
              <Stack mt="4" gap="1">
                {reporteData?.notes?.map((note, index) => (
                  <Text key={`note-${index}`} fontSize="sm" color="fg.muted">
                    {note}
                  </Text>
                ))}
              </Stack>
            )}
          </Card.Body>
        </Card.Root>
      </Stack>

      <Modal
        title="Vista previa del reporte"
        size="full"
        isOpen={isPreviewOpen}
        onOpenChange={(event) => setIsPreviewOpen(event.open)}
        footerContent={
          <HStack w="full" justify="space-between">
            <HStack>
              <Box>
                <Text fontSize="xs" color="fg.muted">Página inicial PDF</Text>
                <Input
                  type="number"
                  min={1}
                  max={reporteData?.pagination?.pages ?? 1}
                  value={pdfPageStart}
                  onChange={(event) => setPdfPageStart(Number(event.target.value) || 1)}
                  w="110px"
                  size="sm"
                />
              </Box>
              <Box>
                <Text fontSize="xs" color="fg.muted">Página final PDF</Text>
                <Input
                  type="number"
                  min={1}
                  max={reporteData?.pagination?.pages ?? 1}
                  value={pdfPageEnd}
                  onChange={(event) => setPdfPageEnd(Number(event.target.value) || 1)}
                  w="110px"
                  size="sm"
                />
              </Box>
            </HStack>
            <Button colorPalette="blue" onClick={handleDownloadPdf} loading={isDownloading}>
              <FiDownload /> Descargar PDF
            </Button>
          </HStack>
        }
        content={
          <Stack gap="4">
            <HStack justify="space-between" align="start" wrap="wrap">
              <Stack gap="0">
                <Text fontWeight="bold" color="brand.blue.600" fontSize="lg">{COMPANY_NAME}</Text>
                <Text color="fg.muted" fontSize="sm">Informe corporativo</Text>
              </Stack>
              <Text color="fg.muted" fontSize="sm">
                {reporteData?.generatedAt ? formatLongDate(reporteData.generatedAt) : "-"}
              </Text>
            </HStack>

            <HStack justify="center" pt="1">
              <img src={logoColor} alt="BioAlquimia" style={{ height: "52px" }} />
            </HStack>

            <Text textAlign="center" fontWeight="bold" fontSize="lg">
              {reportTitle}
            </Text>

            <Text textAlign="center" color="fg.muted" fontSize="sm">
              Incluye datos desde la página {pdfPageStart} hasta {pdfPageEnd}
            </Text>

            <Separator />

            {reporteData?.summary && Object.keys(reporteData.summary).length > 0 && (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                {Object.entries(reporteData.summary).map(([key, value]) => (
                  <Box key={key} borderWidth="1px" rounded="md" px="3" py="2" bg="brand.blue.25">
                    <Text fontSize="xs" color="fg.muted">
                      {key.replaceAll("_", " ")}
                    </Text>
                    <Text fontWeight="semibold">{formatReportValue(key, value)}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            )}

            <Table.ScrollArea borderWidth="1px" rounded="md" maxW="full">
              <Table.Root size="sm" variant="outline" stickyHeader>
                <Table.Header>
                  <Table.Row>
                    {visibleColumns.map((column) => (
                      <Table.ColumnHeader key={`preview-header-${column.key}`}>
                        {column.label}
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {(isPreviewLoading ? [] : previewRows).map((row, index) => (
                    <Table.Row key={`preview-row-${index}`}>
                      {visibleColumns.map((column) => (
                        <Table.Cell key={`preview-cell-${index}-${column.key}`}>
                          {formatReportValue(column.key, row[column.key])}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>
          </Stack>
        }
      />
    </Layout>
  );
};
