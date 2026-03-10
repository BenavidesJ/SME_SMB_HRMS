import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  GridItem,
  HStack,
  Input,
  Separator,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { Document, Image, Page, StyleSheet, Text as PdfText, View, pdf } from "@react-pdf/renderer";
import { FiArrowDown, FiArrowUp, FiDownload, FiEye, FiSearch } from "react-icons/fi";
import logoColor from "../../../assets/LogoColor.svg";
import logoPdf from "../../../assets/logo.jpg";
import { Layout } from "../../../components/layout";
import { Modal } from "../../../components/general/modal/Modal";
import { DataTable } from "../../../components/general/table/DataTable";
import type { DataTableColumn } from "../../../components/general/table/types";
import { useApiQuery } from "../../../hooks/useApiQuery";
import {
  buildMyPayrollsUrl,
  type PayrollListItem,
  type PayrollListQuery,
  type PayrollListResponse,
  type PayrollReceiptResponse,
  getMyPayrollReceipt,
} from "../../../services/api/planillas";
import { formatSpanishLongDate } from "../../../utils";
import { formatCRC } from "../../../utils/money";

const COMPANY_NAME = "BioAlquimia";

const pdfStyles = StyleSheet.create({
  page: {
    padding: 26,
    fontSize: 10,
    fontFamily: "Helvetica",
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

type SortDir = "asc" | "desc";

function formatDateRange(start?: string | null, end?: string | null) {
  const from = formatSpanishLongDate(start);
  const to = formatSpanishLongDate(end);
  if (!start && !end) return "—";
  return `${from} al ${to}`;
}

function buildPdfFileName(receipt: PayrollReceiptResponse) {
  const fechaPago = receipt.periodo.fecha_pago ?? new Date().toISOString().slice(0, 10);
  return `comprobante-planilla-${receipt.periodo.id_periodo}-${String(fechaPago).slice(0, 10)}.pdf`;
}

function PayrollReceiptPdfDocument({ receipt }: { receipt: PayrollReceiptResponse }) {
  const { comprobante, colaborador, periodo, empresa, generado_en } = receipt;

  const devengos = [
    { label: "Salario quincenal base", cantidad: "—", monto: comprobante.salario_quincenal },
    { label: "Horas ordinarias", cantidad: comprobante.horas_ordinarias.cantidad, monto: comprobante.horas_ordinarias.monto },
    { label: "Horas extra", cantidad: comprobante.horas_extra.cantidad, monto: comprobante.horas_extra.monto },
    { label: "Horas nocturnas", cantidad: comprobante.horas_nocturnas.cantidad, monto: comprobante.horas_nocturnas.monto },
    { label: "Horas feriado", cantidad: comprobante.horas_feriado.cantidad, monto: comprobante.horas_feriado.monto },
  ];

  const deducciones = [
    ...comprobante.deducciones.map((item) => ({ label: item.nombre, porcentaje: item.porcentaje, monto: item.monto })),
    {
      label: "Impuesto sobre la renta",
      porcentaje: null,
      monto: comprobante.renta.monto_quincenal,
    },
  ];

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.topBar}>
          <PdfText style={pdfStyles.companyName}>{empresa.nombre || COMPANY_NAME}</PdfText>
          <PdfText>{formatSpanishLongDate(generado_en)}</PdfText>
        </View>

        <Image src={logoPdf} style={pdfStyles.logo} />
        <PdfText style={pdfStyles.title}>Comprobante de pago</PdfText>

        <View style={pdfStyles.infoGrid}>
          <View style={pdfStyles.infoCard}>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Colaborador</PdfText>
              <PdfText style={pdfStyles.value}>{colaborador.nombre_completo || "N/D"}</PdfText>
            </View>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Identificación</PdfText>
              <PdfText style={pdfStyles.value}>{String(colaborador.identificacion ?? "N/D")}</PdfText>
            </View>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Puesto</PdfText>
              <PdfText style={pdfStyles.value}>{colaborador.puesto || "N/D"}</PdfText>
            </View>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Departamento</PdfText>
              <PdfText style={pdfStyles.value}>{colaborador.departamento || "N/D"}</PdfText>
            </View>
          </View>

          <View style={pdfStyles.infoCard}>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Periodo</PdfText>
              <PdfText style={pdfStyles.value}>{formatDateRange(periodo.fecha_inicio, periodo.fecha_fin)}</PdfText>
            </View>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Fecha de pago</PdfText>
              <PdfText style={pdfStyles.value}>{formatSpanishLongDate(periodo.fecha_pago)}</PdfText>
            </View>
          </View>
        </View>

        <PdfText style={pdfStyles.sectionTitle}>Devengos</PdfText>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <PdfText style={pdfStyles.headerCell}>Concepto</PdfText>
            <PdfText style={pdfStyles.headerCell}>Cantidad</PdfText>
            <PdfText style={pdfStyles.headerCell}>Monto</PdfText>
          </View>
          {devengos.map((item) => (
            <View key={item.label} style={pdfStyles.tableRow}>
              <PdfText style={pdfStyles.bodyCell}>{item.label}</PdfText>
              <PdfText style={pdfStyles.bodyCell}>{String(item.cantidad)}</PdfText>
              <PdfText style={pdfStyles.bodyCell}>{formatCRC(item.monto)}</PdfText>
            </View>
          ))}
        </View>

        <PdfText style={pdfStyles.sectionTitle}>Deducciones</PdfText>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <PdfText style={pdfStyles.headerCell}>Concepto</PdfText>
            <PdfText style={pdfStyles.headerCell}>Porcentaje</PdfText>
            <PdfText style={pdfStyles.headerCell}>Monto</PdfText>
          </View>
          {deducciones.map((item) => (
            <View key={`${item.label}-${item.monto}`} style={pdfStyles.tableRow}>
              <PdfText style={pdfStyles.bodyCell}>{item.label}</PdfText>
              <PdfText style={pdfStyles.bodyCell}>{item.porcentaje == null ? "—" : `${item.porcentaje}%`}</PdfText>
              <PdfText style={pdfStyles.bodyCell}>{formatCRC(item.monto)}</PdfText>
            </View>
          ))}
        </View>

        <View style={pdfStyles.totalsBox}>
          <View style={pdfStyles.totalRow}>
            <PdfText style={pdfStyles.label}>Salario devengado</PdfText>
            <PdfText style={pdfStyles.value}>{formatCRC(comprobante.salario_devengado)}</PdfText>
          </View>
          <View style={pdfStyles.totalRow}>
            <PdfText style={pdfStyles.label}>Total deducciones</PdfText>
            <PdfText style={pdfStyles.value}>{formatCRC(comprobante.total_deducciones)}</PdfText>
          </View>

          <View style={pdfStyles.netHighlight}>
            <View style={pdfStyles.totalRow}>
              <PdfText style={pdfStyles.value}>Neto a recibir</PdfText>
              <PdfText style={pdfStyles.value}>{formatCRC(comprobante.salario_neto)}</PdfText>
            </View>
          </View>
        </View>

        <PdfText style={pdfStyles.footer}>Generado por BioAlquimia para consulta y reclamos del período.</PdfText>
      </Page>
    </Document>
  );
}

function SortHeader({
  label,
  field,
  currentSortBy,
  currentSortDir,
  onChange,
}: {
  label: string;
  field: NonNullable<PayrollListQuery["sortBy"]>;
  currentSortBy?: PayrollListQuery["sortBy"];
  currentSortDir: SortDir;
  // eslint-disable-next-line no-unused-vars
  onChange(field: NonNullable<PayrollListQuery["sortBy"]>): void;
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

export const MiPlanilla = () => {
  const [query, setQuery] = useState<PayrollListQuery>({
    page: 1,
    limit: 10,
    sortBy: "fecha_fin",
    sortDir: "desc",
  });
  const [searchInput, setSearchInput] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<number | null>(null);
  const [receiptCache, setReceiptCache] = useState<Record<number, PayrollReceiptResponse>>({});
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const listUrl = useMemo(() => buildMyPayrollsUrl(query), [query]);

  const { data, isLoading } = useApiQuery<PayrollListResponse>({
    url: listUrl,
    initialData: {
      items: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 1 },
      summary: { total_bruto: 0, total_neto: 0, total_periodos: 0 },
    },
  });

  const selectedReceipt = selectedPayrollId ? receiptCache[selectedPayrollId] ?? null : null;

  const handleSortChange = (field: NonNullable<PayrollListQuery["sortBy"]>) => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageChange = (nextPage: number) => {
    setQuery((prev) => ({ ...prev, page: nextPage }));
  };

  const handleApplySearch = () => {
    setQuery((prev) => ({ ...prev, page: 1, search: searchInput.trim() || undefined }));
  };

  const loadReceipt = async (idDetalle: number) => {
    const cached = receiptCache[idDetalle];
    if (cached) return cached;

    setIsReceiptLoading(true);
    try {
      const response = await getMyPayrollReceipt(idDetalle);

      setReceiptCache((prev) => ({ ...prev, [idDetalle]: response }));
      return response;
    } finally {
      setIsReceiptLoading(false);
    }
  };

  const handleOpenDetail = async (row: PayrollListItem) => {
    setSelectedPayrollId(row.id_detalle);
    setIsDetailOpen(true);
    await loadReceipt(row.id_detalle);
  };

  const handleDownloadReceipt = async (row: PayrollListItem) => {
    setDownloadingId(row.id_detalle);
    try {
      const receipt = await loadReceipt(row.id_detalle);
      const blob = await pdf(<PayrollReceiptPdfDocument receipt={receipt} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildPdfFileName(receipt);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  };

  const tableColumns = useMemo<DataTableColumn<PayrollListItem>[]>(
    () => [
      {
        id: "periodo",
        header: (
          <SortHeader
            label="Periodo"
            field="fecha_fin"
            currentSortBy={query.sortBy}
            currentSortDir={query.sortDir ?? "desc"}
            onChange={handleSortChange}
          />
        ),
        minW: "280px",
        cell: (row) => (
          <Stack gap="0">
            <Text fontWeight="semibold">Periodo #{row.id_periodo}</Text>
            <Text color="fg.muted" fontSize="sm">{formatDateRange(row.fecha_inicio, row.fecha_fin)}</Text>
          </Stack>
        ),
      },
      {
        id: "fecha_pago",
        header: (
          <SortHeader
            label="Fecha de pago"
            field="fecha_pago"
            currentSortBy={query.sortBy}
            currentSortDir={query.sortDir ?? "desc"}
            onChange={handleSortChange}
          />
        ),
        minW: "180px",
        cell: (row) => formatSpanishLongDate(row.fecha_pago),
      },
      {
        id: "bruto",
        header: (
          <SortHeader
            label="Bruto"
            field="bruto"
            currentSortBy={query.sortBy}
            currentSortDir={query.sortDir ?? "desc"}
            onChange={handleSortChange}
          />
        ),
        minW: "150px",
        cell: (row) => formatCRC(row.bruto),
      },
      {
        id: "deducciones",
        header: (
          <SortHeader
            label="Deducciones"
            field="deducciones"
            currentSortBy={query.sortBy}
            currentSortDir={query.sortDir ?? "desc"}
            onChange={handleSortChange}
          />
        ),
        minW: "160px",
        cell: (row) => formatCRC(row.deducciones),
      },
      {
        id: "neto",
        header: (
          <SortHeader
            label="Neto"
            field="neto"
            currentSortBy={query.sortBy}
            currentSortDir={query.sortDir ?? "desc"}
            onChange={handleSortChange}
          />
        ),
        minW: "160px",
        cell: (row) => <Text fontWeight="bold">{formatCRC(row.neto)}</Text>,
      },
    ],
    [query.sortBy, query.sortDir],
  );

  const detailContent = (() => {
    if (isReceiptLoading && !selectedReceipt) {
      return (
        <Stack align="center" py="20">
          <Spinner size="lg" />
          <Text color="fg.muted">Cargando comprobante...</Text>
        </Stack>
      );
    }

    if (!selectedReceipt) {
      return (
        <Stack align="center" py="20">
          <Text color="fg.muted">No se pudo cargar el comprobante.</Text>
        </Stack>
      );
    }

    const { comprobante, colaborador, periodo, empresa } = selectedReceipt;
    const deducciones = [
      ...comprobante.deducciones,
      {
        id_deduccion: -1,
        nombre: "Impuesto sobre la renta",
        porcentaje: 0,
        monto: comprobante.renta.monto_quincenal,
      },
    ];

    return (
      <Stack gap="6" maxW="1100px" mx="auto" w="full">
        <HStack justify="space-between" align="start" wrap="wrap">
          <Stack gap="1">
            <Text fontWeight="bold" color="brand.blue.700" fontSize="xl">{empresa.nombre}</Text>
            <Text color="fg.muted">Comprobante de planilla del colaborador</Text>
          </Stack>
          <Badge colorPalette="blue" variant="subtle">
            Consultado: {formatSpanishLongDate(selectedReceipt.generado_en)}
          </Badge>
        </HStack>

        <Card.Root>
          <Card.Body>
            <Stack align="center" gap="2" textAlign="center">
              <img src={logoColor} alt="BioAlquimia" style={{ height: "72px", objectFit: "contain" }} />
              <Text fontSize="2xl" fontWeight="bold" color="brand.blue.700">
                {empresa.nombre || COMPANY_NAME}
              </Text>
              <Text color="fg.muted">Comprobante de planilla del colaborador</Text>
              <Text fontSize="sm" color="fg.muted">
                Período {formatDateRange(periodo.fecha_inicio, periodo.fecha_fin)}
              </Text>
            </Stack>
          </Card.Body>
        </Card.Root>

        <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} gap="4">
          <GridItem>
            <Card.Root>
              <Card.Header>
                <Card.Title>Información del colaborador</Card.Title>
              </Card.Header>
              <Card.Body>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                  <DetailInfoItem label="Nombre" value={colaborador.nombre_completo || "N/D"} />
                  <DetailInfoItem label="Identificación" value={String(colaborador.identificacion ?? "N/D")} />
                  <DetailInfoItem label="Puesto" value={colaborador.puesto || "N/D"} />
                  <DetailInfoItem label="Departamento" value={colaborador.departamento || "N/D"} />
                </SimpleGrid>
              </Card.Body>
            </Card.Root>
          </GridItem>

          <GridItem>
            <Card.Root>
              <Card.Header>
                <Card.Title>Información del período</Card.Title>
              </Card.Header>
              <Card.Body>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                  <DetailInfoItem label="Rango" value={formatDateRange(periodo.fecha_inicio, periodo.fecha_fin)} />
                  <DetailInfoItem label="Fecha de pago" value={formatSpanishLongDate(periodo.fecha_pago)} />
                </SimpleGrid>
              </Card.Body>
            </Card.Root>
          </GridItem>
        </Grid>

        <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} gap="4">
          <GridItem>
            <Card.Root>
              <Card.Header>
                <Card.Title>Devengos</Card.Title>
                <Card.Description>Desglose estimado del salario y recargos del período.</Card.Description>
              </Card.Header>
              <Card.Body>
                <Stack gap="3">
                  <HStack justify="space-between"><Text>Salario quincenal base</Text><Text fontWeight="semibold">{formatCRC(comprobante.salario_quincenal)}</Text></HStack>
                  <HStack justify="space-between"><Text>Horas ordinarias ({comprobante.horas_ordinarias.cantidad})</Text><Text fontWeight="semibold">{formatCRC(comprobante.horas_ordinarias.monto)}</Text></HStack>
                  <HStack justify="space-between"><Text>Horas extra ({comprobante.horas_extra.cantidad})</Text><Text fontWeight="semibold">{formatCRC(comprobante.horas_extra.monto)}</Text></HStack>
                  <HStack justify="space-between"><Text>Horas nocturnas ({comprobante.horas_nocturnas.cantidad})</Text><Text fontWeight="semibold">{formatCRC(comprobante.horas_nocturnas.monto)}</Text></HStack>
                  <HStack justify="space-between"><Text>Horas feriado ({comprobante.horas_feriado.cantidad})</Text><Text fontWeight="semibold">{formatCRC(comprobante.horas_feriado.monto)}</Text></HStack>
                  <Separator />
                  <HStack justify="space-between"><Text fontWeight="bold">Salario devengado</Text><Text fontWeight="bold" color="brand.blue.700">{formatCRC(comprobante.salario_devengado)}</Text></HStack>
                </Stack>
              </Card.Body>
            </Card.Root>
          </GridItem>

          <GridItem>
            <Card.Root>
              <Card.Header>
                <Card.Title>Deducciones</Card.Title>
                <Card.Description>Deducciones aplicadas al período de pago.</Card.Description>
              </Card.Header>
              <Card.Body>
                <Stack gap="3">
                  {deducciones.map((item) => (
                    <HStack key={`${item.id_deduccion}-${item.nombre}`} justify="space-between" align="start">
                      <Stack gap="0">
                        <Text>{item.nombre}</Text>
                        {item.porcentaje > 0 && (
                          <Text fontSize="xs" color="fg.muted">{item.porcentaje}%</Text>
                        )}
                      </Stack>
                      <Text fontWeight="semibold">{formatCRC(item.monto)}</Text>
                    </HStack>
                  ))}
                  <Separator />
                  <HStack justify="space-between"><Text fontWeight="bold">Total deducciones</Text><Text fontWeight="bold" color="red.600">{formatCRC(comprobante.total_deducciones)}</Text></HStack>
                </Stack>
              </Card.Body>
            </Card.Root>
          </GridItem>
        </Grid>

        <Card.Root borderColor="green.300" bg="green.50">
          <Card.Body>
            <HStack justify="space-between" wrap="wrap">
              <Stack gap="0">
                <Text fontSize="sm" color="fg.muted">Monto neto a recibir</Text>
                <Text fontSize="3xl" fontWeight="bold" color="green.700">{formatCRC(comprobante.salario_neto)}</Text>
              </Stack>
              <Stack gap="0" textAlign={{ base: "left", md: "right" }}>
                <Text fontSize="sm" color="fg.muted">Tarifa por hora</Text>
                <Text fontWeight="semibold">{formatCRC(comprobante.tarifa_hora)}</Text>
              </Stack>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Detalle tabular</Card.Title>
          </Card.Header>
          <Card.Body>
            <Table.ScrollArea borderWidth="1px" rounded="md" maxW="full">
              <Table.Root size="sm" variant="outline">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Concepto</Table.ColumnHeader>
                    <Table.ColumnHeader>Cantidad</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">Monto</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell>Salario quincenal base</Table.Cell>
                    <Table.Cell>—</Table.Cell>
                    <Table.Cell textAlign="end">{formatCRC(comprobante.salario_quincenal)}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Horas ordinarias</Table.Cell>
                    <Table.Cell>{comprobante.horas_ordinarias.cantidad}</Table.Cell>
                    <Table.Cell textAlign="end">{formatCRC(comprobante.horas_ordinarias.monto)}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Horas extra</Table.Cell>
                    <Table.Cell>{comprobante.horas_extra.cantidad}</Table.Cell>
                    <Table.Cell textAlign="end">{formatCRC(comprobante.horas_extra.monto)}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Horas nocturnas</Table.Cell>
                    <Table.Cell>{comprobante.horas_nocturnas.cantidad}</Table.Cell>
                    <Table.Cell textAlign="end">{formatCRC(comprobante.horas_nocturnas.monto)}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Horas feriado</Table.Cell>
                    <Table.Cell>{comprobante.horas_feriado.cantidad}</Table.Cell>
                    <Table.Cell textAlign="end">{formatCRC(comprobante.horas_feriado.monto)}</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>
          </Card.Body>
        </Card.Root>
      </Stack>
    );
  })();

  return (
    <Layout pageTitle="Mi planilla">
      <Stack gap="6" py="6">
        <Card.Root>
          <Card.Header>
            <HStack justify="space-between" align="start" wrap="wrap" gap="4">
              <Stack gap="1">
                <Text fontWeight="bold" color="brand.blue.700" fontSize="xl">{COMPANY_NAME}</Text>
                <Card.Title>Consulta de comprobantes de planilla</Card.Title>
                <Card.Description>
                  Revise lo que se le va a pagar o lo que se le pagó por período, con acceso al detalle y descarga del comprobante.
                </Card.Description>
              </Stack>
              <Badge colorPalette="blue" variant="subtle">
                {formatSpanishLongDate(new Date().toISOString())}
              </Badge>
            </HStack>
          </Card.Header>
          <Card.Body>
            <HStack gap="3" align="end" wrap="wrap">
              <Box minW={{ base: "full", md: "360px" }}>
                <Text fontSize="sm" color="fg.muted" mb="1">Buscar por período o fecha</Text>
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Ejemplo: 2026, 15 de Marzo"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleApplySearch();
                    }
                  }}
                />
              </Box>
              <Button colorPalette="blue" onClick={handleApplySearch}>
                <FiSearch /> Buscar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  setQuery((prev) => ({ ...prev, page: 1, search: undefined }));
                }}
              >
                Limpiar
              </Button>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <HStack justify="space-between" align="center" wrap="wrap">
              <Stack gap="0">
                <Card.Title>Historial de planillas</Card.Title>
                <Card.Description>
                  Página {data?.pagination.page ?? 1} de {data?.pagination.pages ?? 1} • {data?.pagination.total ?? 0} comprobantes
                </Card.Description>
              </Stack>
              <Badge colorPalette="purple" variant="subtle">
                Orden actual: {query.sortBy ?? "fecha_fin"} ({query.sortDir ?? "desc"})
              </Badge>
            </HStack>
          </Card.Header>
          <Card.Body>
            <DataTable<PayrollListItem>
              data={isLoading ? [] : data?.items ?? []}
              columns={tableColumns}
              isDataLoading={isLoading}
              size="sm"
              actionColumn={{
                header: "Acciones",
                w: "190px",
                cell: (row) => (
                  <HStack justify="flex-end" gap="2">
                    <Button size="sm" variant="outline" colorPalette="blue" onClick={() => void handleOpenDetail(row)}>
                      <FiEye /> Ver
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="blue"
                      loading={downloadingId === row.id_detalle}
                      onClick={() => void handleDownloadReceipt(row)}
                    >
                      <FiDownload /> Descargar
                    </Button>
                  </HStack>
                ),
              }}
              pagination={{
                enabled: true,
                page: data?.pagination.page ?? 1,
                pageSize: data?.pagination.limit ?? 10,
                totalCount: data?.pagination.total ?? 0,
                onPageChange: handlePageChange,
              }}
            />
          </Card.Body>
        </Card.Root>
      </Stack>

      <Modal
        title="Detalle de planilla"
        size="full"
        isOpen={isDetailOpen}
        onOpenChange={(event) => setIsDetailOpen(event.open)}
        footerContent={
          <HStack w="full" justify="space-between" wrap="wrap">
            <Text fontSize="sm" color="fg.muted">
              Utilice este comprobante para revisión o reclamos del período.
            </Text>
            <HStack>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Cerrar
              </Button>
              <Button
                colorPalette="blue"
                loading={selectedPayrollId != null && downloadingId === selectedPayrollId}
                disabled={!selectedPayrollId}
                onClick={() => {
                  const row = data?.items.find((item) => item.id_detalle === selectedPayrollId);
                  if (row) {
                    void handleDownloadReceipt(row);
                  }
                }}
              >
                <FiDownload /> Descargar PDF
              </Button>
            </HStack>
          </HStack>
        }
        content={detailContent}
      />
    </Layout>
  );
};