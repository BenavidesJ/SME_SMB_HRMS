/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Badge,
  Box,
  Button,
  Card,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { Document, Font, Image, Page, StyleSheet, Text as PdfText, View, pdf } from "@react-pdf/renderer";
import notoSans400 from "@fontsource/noto-sans/files/noto-sans-latin-ext-400-normal.woff";
import notoSans700 from "@fontsource/noto-sans/files/noto-sans-latin-ext-700-normal.woff";
import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FiDownload, FiEye, FiFilePlus } from "react-icons/fi";
import logoPdf from "../../../assets/logo.jpg";
import { Form } from "../../../components/forms/Form/Form";
import {
  InputField,
  type SelectOption,
} from "../../../components/forms/InputField/InputField";
import { Modal } from "../../../components/general";
import { DataTable } from "../../../components/general/table/DataTable";
import { SortHeader, type SortDir } from "../../../components/general/table/SortHeader";
import type {
  DataTableActionColumn,
  DataTableColumn,
} from "../../../components/general/table/types";
import { Layout } from "../../../components/layout";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { apiRequest } from "../../../services/api";
import { showToast } from "../../../services/toast/toastService";
import type { EmployeeRow } from "../../../types";
import { formatCRC, formatDateUiCompact, formatSpanishLongDate, toTitleCase } from "../../../utils";

const COMPANY_NAME = "BioAlquimia";
const PDF_COLON_SYMBOL = "\u20A1";

Font.register({
  family: "NotoSansPdf",
  fonts: [
    { src: notoSans400, fontWeight: 400 },
    { src: notoSans700, fontWeight: 700 },
  ],
});

const pdfStyles = StyleSheet.create({
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
    width: 240,
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

// ── Types ──

type SimularFormValues = {
  idColaborador: string;
  causaId: string;
  fechaTerminacion: string;
  realizo_preaviso: string;
};

type SimulacionData = {
  colaborador: { id: number; nombre: string; identificacion: number; fechaInicio: string };
  causa: string;
  fechaTerminacion: string;
  antiguedad: { diasTotales: number; meses: number; anios: number };
  componentes: {
    salarioDiario: { valor: number; origen: string };
    aguinaldoProporcional: { valor: number; detalles: any };
    vacacionesProporcionales: { valor: number; diasPendientes: number };
    cesantia: { valor: number; diasCalculados: number };
    preaviso: { valor: number; diasCalculados: number };
    salarioPendiente: { valor: number; diasPendientes: number };
  };
  totales: { totalBruto: number; deducciones: number; totalNeto: number };
  validaciones: { esValido: boolean; errores: string[]; advertencias: string[] };
};

type LiquidacionRegistro = {
  id_caso_termina: number;
  id_colaborador?: number;
  colaborador: string;
  identificacion?: string | number | null;
  causa: string;
  fechaIngresoContrato?: string | null;
  fechaTerminacion: string;
  montoTotal: number;
  aprobador: number;
  fechaAprobacion: string;
};

type CausaLiquidacion = {
  id: number;
  causa_liquidacion: string;
};

type LiquidacionDetalleApi = {
  id_caso_termina: number;
  id_colaborador: number;
  causa: number;
  realizo_preaviso: boolean;
  fecha_terminacion: string;
  promedio_base: number | string;
  aguinaldo_proporcional: number | string;
  monto_cesantia: number | string;
  monto_preaviso: number | string;
  otros_montos: number | string;
  id_aprobador: number;
  fecha_aprobacion: string;
  saldo_vacaciones: number;
  colaborador?: {
    id_colaborador: number;
    nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    identificacion?: number | string | null;
  };
  causaRef?: {
    id_causa_liquidacion: number;
    causa_liquidacion: string;
  };
};

type LiquidacionSortField =
  | "colaborador"
  | "causa"
  | "fechaIngreso"
  | "fechaTerminacion"
  | "montoTotal";

type LiquidacionDetalleView = {
  idCasoTermina: number;
  colaboradorNombre: string;
  identificacion: string;
  causa: string;
  fechaIngresoContrato: string | null;
  fechaTerminacion: string;
  fechaAprobacion: string;
  realizoPreaviso: boolean;
  salarioDiario: number;
  aguinaldo: number;
  cesantia: number;
  preaviso: number;
  otrosMontos: number;
  totalBruto: number;
};

function getCausaBadgeColor(causa: string | null | undefined) {
  const normalized = String(causa ?? "").trim().toLowerCase();
  if (normalized === "renuncia") return "yellow";
  if (normalized.includes("con responsabilidad")) return "red";
  return "gray";
}

function normalizarTexto(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function toNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toDateSortValue(dateValue: string | null | undefined) {
  if (!dateValue) return 0;
  const numeric = new Date(dateValue).getTime();
  return Number.isFinite(numeric) ? numeric : 0;
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

function buildLiquidacionPdfFileName(detalle: LiquidacionDetalleView) {
  const fecha = String(detalle.fechaAprobacion || new Date().toISOString().slice(0, 10)).slice(0, 10);
  return `liquidacion-${detalle.idCasoTermina}-${fecha}.pdf`;
}

function esDespidoSinResponsabilidad(
  causaId: string | number | null | undefined,
  causas: CausaLiquidacion[],
) {
  if (!causaId) return false;

  const causaSeleccionada = causas.find((c) => Number(c.id) === Number(causaId));
  return normalizarTexto(causaSeleccionada?.causa_liquidacion).includes("SIN RESPONSABILIDAD");
}

function esDespidoConResponsabilidad(
  causaId: string | number | null | undefined,
  causas: CausaLiquidacion[],
) {
  if (!causaId) return false;

  const causaSeleccionada = causas.find((c) => Number(c.id) === Number(causaId));
  const causaNormalizada = normalizarTexto(causaSeleccionada?.causa_liquidacion);

  return (
    causaNormalizada.includes("CON RESPONSABILIDAD")
    && !causaNormalizada.includes("SIN RESPONSABILIDAD")
  );
}

function LiquidacionPdfDocument({ detalle }: { detalle: LiquidacionDetalleView }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.topBar}>
          <PdfText style={pdfStyles.companyName}>{COMPANY_NAME}</PdfText>
          <PdfText>{formatSpanishLongDate(new Date().toISOString())}</PdfText>
        </View>

        <Image src={logoPdf} style={pdfStyles.logo} />
        <PdfText style={pdfStyles.title}>Detalle de liquidacion laboral</PdfText>

        <View style={pdfStyles.infoGrid}>
          <View style={pdfStyles.infoCard}>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Colaborador</PdfText>
              <PdfText style={pdfStyles.value}>{detalle.colaboradorNombre}</PdfText>
            </View>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Identificacion</PdfText>
              <PdfText style={pdfStyles.value}>{detalle.identificacion}</PdfText>
            </View>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Causa</PdfText>
              <PdfText style={pdfStyles.value}>{detalle.causa}</PdfText>
            </View>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Fecha ingreso contrato</PdfText>
              <PdfText style={pdfStyles.value}>{formatSpanishLongDate(detalle.fechaIngresoContrato)}</PdfText>
            </View>
          </View>

          <View style={pdfStyles.infoCard}>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Caso</PdfText>
              <PdfText style={pdfStyles.value}>#{detalle.idCasoTermina}</PdfText>
            </View>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Fecha terminacion</PdfText>
              <PdfText style={pdfStyles.value}>{formatSpanishLongDate(detalle.fechaTerminacion)}</PdfText>
            </View>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Fecha aprobacion</PdfText>
              <PdfText style={pdfStyles.value}>{formatSpanishLongDate(detalle.fechaAprobacion)}</PdfText>
            </View>
            <View style={pdfStyles.infoRow}>
              <PdfText style={pdfStyles.label}>Realizo preaviso</PdfText>
              <PdfText style={pdfStyles.value}>{detalle.realizoPreaviso ? "Si" : "No"}</PdfText>
            </View>
          </View>
        </View>

        <PdfText style={pdfStyles.sectionTitle}>Componentes de liquidacion</PdfText>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <PdfText style={pdfStyles.headerCell}>Componente</PdfText>
            <PdfText style={pdfStyles.headerCell}>Monto</PdfText>
          </View>
          <View style={pdfStyles.tableRow}>
            <PdfText style={pdfStyles.bodyCell}>Salario diario base</PdfText>
            <PdfText style={pdfStyles.bodyCell}>{formatPdfCRC(detalle.salarioDiario)}</PdfText>
          </View>
          <View style={pdfStyles.tableRow}>
            <PdfText style={pdfStyles.bodyCell}>Aguinaldo proporcional</PdfText>
            <PdfText style={pdfStyles.bodyCell}>{formatPdfCRC(detalle.aguinaldo)}</PdfText>
          </View>
          <View style={pdfStyles.tableRow}>
            <PdfText style={pdfStyles.bodyCell}>Cesantia</PdfText>
            <PdfText style={pdfStyles.bodyCell}>{formatPdfCRC(detalle.cesantia)}</PdfText>
          </View>
          <View style={pdfStyles.tableRow}>
            <PdfText style={pdfStyles.bodyCell}>Preaviso</PdfText>
            <PdfText style={pdfStyles.bodyCell}>{formatPdfCRC(detalle.preaviso)}</PdfText>
          </View>
          <View style={pdfStyles.tableRow}>
            <PdfText style={pdfStyles.bodyCell}>Otros montos</PdfText>
            <PdfText style={pdfStyles.bodyCell}>{formatPdfCRC(detalle.otrosMontos)}</PdfText>
          </View>
        </View>

        <View style={pdfStyles.totalsBox}>
          <View style={pdfStyles.netHighlight}>
            <View style={pdfStyles.totalRow}>
              <PdfText style={pdfStyles.value}>Total liquidacion</PdfText>
              <PdfText style={pdfStyles.value}>{formatPdfCRC(detalle.totalBruto)}</PdfText>
            </View>
          </View>
        </View>

        <PdfText style={pdfStyles.footer}>Generado por BioAlquimia para respaldo administrativo.</PdfText>
      </Page>
    </Document>
  );
}

export const Liquidaciones = () => {
  const { data: employees = [], isLoading: employeesLoading } =
    useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const options = useMemo<SelectOption[]>(
    () =>
      employees.map((emp) => ({
        label: toTitleCase(
          `${emp.nombre} ${emp.primer_apellido} ${emp.segundo_apellido}`.trim(),
        ),
        value: String(emp.id),
      })),
    [employees],
  );

  const { data: causasData = [], isLoading: causasLoading } =
    useApiQuery<CausaLiquidacion[]>({ url: "/mantenimientos/causas-liquidacion" });

  const causasOptions = useMemo<SelectOption[]>(
    () =>
      causasData.map((c) => ({
        label: c.causa_liquidacion,
        value: String(c.id),
      })),
    [causasData],
  );

  const {
    mutate: simularCalculo,
    isLoading: isSimulating,
  } = useApiMutation<
    {
      idColaborador: number;
      causaId: number;
      causa?: string;
      fechaTerminacion: string;
      realizo_preaviso: boolean;
    },
    any
  >({ url: "liquidaciones/simular", method: "POST" });

  const [simulacion, setSimulacion] = useState<SimulacionData | null>(null);

  const {
    mutate: crearLiquidacion,
    isLoading: isCreating,
  } = useApiMutation<{ datosLiquidacion: any }, any>({
    url: "liquidaciones",
    method: "POST",
  });

  const {
    data: existingRecords = [],
    isLoading: loadingRecords,
    refetch: refetchRecords,
  } = useApiQuery<LiquidacionRegistro[]>({ url: "liquidaciones?limit=5000" });

  const [showForm, setShowForm] = useState(false);
  const [tableQuery, setTableQuery] = useState<{
    page: number;
    limit: number;
    sortBy: LiquidacionSortField;
    sortDir: SortDir;
  }>({
    page: 1,
    limit: 10,
    sortBy: "fechaTerminacion",
    sortDir: "desc",
  });

  const [selectedLiquidacionRecord, setSelectedLiquidacionRecord] =
    useState<LiquidacionRegistro | null>(null);
  const [liquidacionDetalle, setLiquidacionDetalle] =
    useState<LiquidacionDetalleApi | null>(null);
  const [isDetalleLoading, setIsDetalleLoading] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  const CamposTerminacionYPreaviso = () => {
    const { control, setValue } = useFormContext<SimularFormValues>();
    const causaIdSeleccionada = useWatch({ control, name: "causaId" });

    const causaSinResponsabilidad = esDespidoSinResponsabilidad(causaIdSeleccionada, causasData);
    const causaConResponsabilidad = esDespidoConResponsabilidad(causaIdSeleccionada, causasData);
    const ocultarPreaviso = causaSinResponsabilidad || causaConResponsabilidad;

    useEffect(() => {
      if (causaSinResponsabilidad) {
        setValue("realizo_preaviso", "false", { shouldValidate: false, shouldDirty: true });
        return;
      }

      if (causaConResponsabilidad) {
        setValue("realizo_preaviso", "true", { shouldValidate: false, shouldDirty: true });
      }
    }, [causaConResponsabilidad, causaSinResponsabilidad, setValue]);

    return (
      <Stack gap="2">
        <SimpleGrid columns={{ base: 1, md: ocultarPreaviso ? 1 : 2 }} gap="3">
          <InputField
            fieldType="date"
            name="fechaTerminacion"
            label="Fecha de terminación"
            required
          />
          {!ocultarPreaviso && (
            <InputField
              fieldType="select"
              name="realizo_preaviso"
              label="¿Realizó preaviso?"
              disableSelectPortal
              required
              options={[
                { label: "No", value: "false" },
                { label: "Sí", value: "true" },
              ]}
            />
          )}
        </SimpleGrid>
      </Stack>
    );
  };

  const handleSimular = async (values: SimularFormValues) => {
    const idColaborador = Number(values.idColaborador);
    const causaId = Number(values.causaId);
    const causaSeleccionada = causasData.find((c) => Number(c.id) === causaId);
    const causaSinResponsabilidad = esDespidoSinResponsabilidad(causaId, causasData);
    const causaConResponsabilidad = esDespidoConResponsabilidad(causaId, causasData);

    if (!idColaborador || idColaborador <= 0) {
      showToast("Seleccione un colaborador.", "error");
      return false;
    }

    if (!causaId || causaId <= 0) {
      showToast("Seleccione una causa de liquidación.", "error");
      return false;
    }

    try {
      const response = await simularCalculo({
        idColaborador,
        causaId,
        ...(causaSeleccionada ? { causa: causaSeleccionada.causa_liquidacion } : {}),
        fechaTerminacion: values.fechaTerminacion,
        realizo_preaviso: causaSinResponsabilidad
          ? false
          : causaConResponsabilidad
            ? true
            : values.realizo_preaviso === "true",
      });

      const data = (response as any)?.data ?? (response as any) ?? null;
      setSimulacion(data);
      return true;
    } catch {
      setSimulacion(null);
      return false;
    }
  };

  const handleCrear = async () => {
    if (!simulacion) return;

    try {
      await crearLiquidacion({ datosLiquidacion: simulacion });
      setSimulacion(null);
      setShowForm(false);
      await refetchRecords();
      showToast("Liquidación creada exitosamente.", "success");
    } catch {
      // toast automático
    }
  };

  const handleStartCreate = () => {
    setShowForm((prev) => {
      const next = !prev;
      if (!next) {
        setSimulacion(null);
      }
      return next;
    });
  };

  const sortedRecords = useMemo(() => {
    const direction = tableQuery.sortDir === "asc" ? 1 : -1;

    return [...existingRecords].sort((left, right) => {
      if (tableQuery.sortBy === "colaborador") {
        const value = String(left.colaborador ?? "").localeCompare(String(right.colaborador ?? ""), "es", {
          sensitivity: "base",
        }) * direction;
        return value === 0 ? right.id_caso_termina - left.id_caso_termina : value;
      }

      if (tableQuery.sortBy === "causa") {
        const value = String(left.causa ?? "").localeCompare(String(right.causa ?? ""), "es", {
          sensitivity: "base",
        }) * direction;
        return value === 0 ? right.id_caso_termina - left.id_caso_termina : value;
      }

      if (tableQuery.sortBy === "fechaIngreso") {
        const value = (toDateSortValue(left.fechaIngresoContrato) - toDateSortValue(right.fechaIngresoContrato)) * direction;
        return value === 0 ? right.id_caso_termina - left.id_caso_termina : value;
      }

      if (tableQuery.sortBy === "fechaTerminacion") {
        const value = (toDateSortValue(left.fechaTerminacion) - toDateSortValue(right.fechaTerminacion)) * direction;
        return value === 0 ? right.id_caso_termina - left.id_caso_termina : value;
      }

      const value = (toNumber(left.montoTotal) - toNumber(right.montoTotal)) * direction;
      return value === 0 ? right.id_caso_termina - left.id_caso_termina : value;
    });
  }, [existingRecords, tableQuery.sortBy, tableQuery.sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / tableQuery.limit));

  useEffect(() => {
    if (tableQuery.page <= totalPages) return;
    setTableQuery((prev) => ({ ...prev, page: totalPages }));
  }, [tableQuery.page, totalPages]);

  const paginatedRecords = useMemo(() => {
    const start = (tableQuery.page - 1) * tableQuery.limit;
    return sortedRecords.slice(start, start + tableQuery.limit);
  }, [sortedRecords, tableQuery.page, tableQuery.limit]);

  const handleSortChange = (field: LiquidacionSortField) => {
    setTableQuery((prev) => ({
      ...prev,
      page: 1,
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const tableColumns = useMemo<Array<DataTableColumn<LiquidacionRegistro>>>(
    () => [
      {
        id: "colaborador",
        header: (
          <SortHeader
            label="Colaborador"
            field="colaborador"
            currentSortBy={tableQuery.sortBy}
            currentSortDir={tableQuery.sortDir}
            onChange={handleSortChange}
          />
        ),
        minW: "280px",
        cell: (row) => (
          <Stack gap="0">
            <Text fontWeight="semibold">{toTitleCase(row.colaborador)}</Text>
            <Text color="fg.muted" fontSize="sm">
              ID: {row.identificacion ?? "N/D"}
            </Text>
          </Stack>
        ),
      },
      {
        id: "causa",
        header: (
          <SortHeader
            label="Causa de liquidación"
            field="causa"
            currentSortBy={tableQuery.sortBy}
            currentSortDir={tableQuery.sortDir}
            onChange={handleSortChange}
          />
        ),
        minW: "220px",
        cell: (row) => (
          <Badge colorPalette={getCausaBadgeColor(row.causa)} variant="subtle">
            {row.causa}
          </Badge>
        ),
      },
      {
        id: "fechaIngreso",
        header: (
          <SortHeader
            label="Ingreso compañía"
            field="fechaIngreso"
            currentSortBy={tableQuery.sortBy}
            currentSortDir={tableQuery.sortDir}
            onChange={handleSortChange}
          />
        ),
        minW: "170px",
        cell: (row) => formatDateUiCompact(row.fechaIngresoContrato),
      },
      {
        id: "fechaTerminacion",
        header: (
          <SortHeader
            label="Fecha terminación"
            field="fechaTerminacion"
            currentSortBy={tableQuery.sortBy}
            currentSortDir={tableQuery.sortDir}
            onChange={handleSortChange}
          />
        ),
        minW: "170px",
        cell: (row) => formatDateUiCompact(row.fechaTerminacion),
      },
      {
        id: "montoTotal",
        header: (
          <SortHeader
            label="Monto total"
            field="montoTotal"
            currentSortBy={tableQuery.sortBy}
            currentSortDir={tableQuery.sortDir}
            onChange={handleSortChange}
          />
        ),
        minW: "170px",
        textAlign: "right",
        cell: (row) => (
          <Text fontWeight="bold" color="green.600">
            {formatCRC(row.montoTotal)}
          </Text>
        ),
      },
    ],
    [tableQuery.sortBy, tableQuery.sortDir],
  );

  const handleVerDetalle = async (record: LiquidacionRegistro) => {
    setSelectedLiquidacionRecord(record);
    setLiquidacionDetalle(null);
    setIsDetalleLoading(true);

    try {
      const detalle = await apiRequest<LiquidacionDetalleApi>({
        url: `liquidaciones/${record.id_caso_termina}`,
        method: "GET",
      });
      setLiquidacionDetalle(detalle);
    } catch {
      setLiquidacionDetalle(null);
    } finally {
      setIsDetalleLoading(false);
    }
  };

  const detalleActual = useMemo<LiquidacionDetalleView | null>(() => {
    if (!selectedLiquidacionRecord || !liquidacionDetalle) return null;

    const colaboradorNombre = [
      liquidacionDetalle.colaborador?.nombre,
      liquidacionDetalle.colaborador?.primer_apellido,
      liquidacionDetalle.colaborador?.segundo_apellido,
    ]
      .filter(Boolean)
      .join(" ") || selectedLiquidacionRecord.colaborador;

    const aguinaldo = toNumber(liquidacionDetalle.aguinaldo_proporcional);
    const cesantia = toNumber(liquidacionDetalle.monto_cesantia);
    const preaviso = toNumber(liquidacionDetalle.monto_preaviso);
    const otrosMontos = toNumber(liquidacionDetalle.otros_montos);

    return {
      idCasoTermina: liquidacionDetalle.id_caso_termina,
      colaboradorNombre,
      identificacion: String(
        liquidacionDetalle.colaborador?.identificacion
        ?? selectedLiquidacionRecord.identificacion
        ?? "N/D",
      ),
      causa: liquidacionDetalle.causaRef?.causa_liquidacion ?? selectedLiquidacionRecord.causa,
      fechaIngresoContrato: selectedLiquidacionRecord.fechaIngresoContrato ?? null,
      fechaTerminacion: liquidacionDetalle.fecha_terminacion,
      fechaAprobacion: liquidacionDetalle.fecha_aprobacion,
      realizoPreaviso: Boolean(liquidacionDetalle.realizo_preaviso),
      salarioDiario: toNumber(liquidacionDetalle.promedio_base),
      aguinaldo,
      cesantia,
      preaviso,
      otrosMontos,
      totalBruto: aguinaldo + cesantia + preaviso + otrosMontos,
    };
  }, [liquidacionDetalle, selectedLiquidacionRecord]);

  const handleDownloadDetallePdf = async () => {
    if (!detalleActual) return;

    setIsPdfDownloading(true);
    try {
      const blob = await pdf(<LiquidacionPdfDocument detalle={detalleActual} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildLiquidacionPdfFileName(detalleActual);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const actionColumn = useMemo<DataTableActionColumn<LiquidacionRegistro>>(
    () => ({
      header: "Acciones",
      w: "200px",
      sticky: true,
      textAlign: "left",
      cell: (row) => (
        <Button
          size="sm"
          variant="subtle"
          colorPalette="blue"
          onClick={(event) => {
            event.stopPropagation();
            void handleVerDetalle(row);
          }}
        >
          <FiEye />
          Ver detalles
        </Button>
      ),
    }),
    [],
  );

  return (
    <Layout pageTitle="Liquidaciones">
      <Stack gap="6">
        <Button
          colorPalette="blue"
          alignSelf="flex-start"
          onClick={handleStartCreate}
        >
          <FiFilePlus />
          {showForm ? " Cerrar formulario" : " Crear liquidación"}
        </Button>

        <Modal
          title="Nueva liquidación"
          isOpen={showForm}
          size="xl"
          onOpenChange={(e) => {
            setShowForm(e.open);
            if (!e.open) {
              setSimulacion(null);
            }
          }}
          content={
            showForm ? (
              <Form<SimularFormValues>
                key={simulacion ? `liquidacion-${simulacion.colaborador.id}` : "liquidacion-create"}
                onSubmit={handleSimular}
                defaultValues={{
                  idColaborador: "",
                  causaId: "",
                  fechaTerminacion: "",
                  realizo_preaviso: "false",
                }}
              >
                <Stack gap="6">
                  <Stack gap="4">
                    <InputField
                      fieldType="select"
                      name="idColaborador"
                      label="Colaborador"
                      required
                      disableSelectPortal
                      options={options}
                      placeholder={
                        employeesLoading
                          ? "Cargando colaboradores..."
                          : options.length === 0
                            ? "Sin colaboradores disponibles"
                            : "Seleccione un colaborador"
                      }
                      selectRootProps={{
                        disabled: employeesLoading || options.length === 0,
                      }}
                      rules={{
                        validate: (value: any) =>
                          value && Number(value) > 0
                            ? true
                            : "Seleccione un colaborador.",
                      }}
                    />

                    <InputField
                      fieldType="select"
                      name="causaId"
                      label="Causa de liquidación"
                      required
                      disableSelectPortal
                      options={causasOptions}
                      placeholder={
                        causasLoading
                          ? "Cargando causas..."
                          : causasOptions.length === 0
                            ? "Sin causas disponibles"
                            : "Seleccione la causa"
                      }
                      selectRootProps={{
                        disabled: causasLoading || causasOptions.length === 0,
                      }}
                    />

                    <CamposTerminacionYPreaviso />
                  </Stack>

                  <Stack direction="row" justifyContent="flex-end" gap="3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setSimulacion(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      colorPalette="blue"
                      variant="outline"
                      loading={isSimulating}
                      disabled={
                        employeesLoading
                        || causasLoading
                        || options.length === 0
                        || causasOptions.length === 0
                        || isSimulating
                      }
                    >
                      Pre cálculo
                    </Button>
                    {simulacion && (
                      <Button
                        colorPalette="green"
                        loading={isCreating}
                        disabled={isCreating}
                        onClick={handleCrear}
                      >
                        Crear liquidación
                      </Button>
                    )}
                  </Stack>

                  {isSimulating ? (
                    <Stack align="center" py="10" gap="3">
                      <Spinner size="lg" />
                      <Text color="fg.muted">Ejecutando pre cálculo…</Text>
                    </Stack>
                  ) : simulacion ? (
                    <Stack gap="4">
                      <Card.Root>
                        <Card.Body>
                          <SimpleGrid columns={{ base: 2, md: 4 }} gap="4">
                            <Box>
                              <Text textStyle="xs" color="fg.muted">Colaborador</Text>
                              <Text fontWeight="semibold">{simulacion.colaborador.nombre}</Text>
                            </Box>
                            <Box>
                              <Text textStyle="xs" color="fg.muted">Causa</Text>
                              <Badge colorPalette={getCausaBadgeColor(simulacion.causa)} variant="subtle">
                                {simulacion.causa}
                              </Badge>
                            </Box>
                            <Box>
                              <Text textStyle="xs" color="fg.muted">Antigüedad</Text>
                              <Text fontWeight="semibold">
                                {simulacion.antiguedad.anios}a {simulacion.antiguedad.meses}m
                              </Text>
                            </Box>
                            <Box>
                              <Text textStyle="xs" color="fg.muted">Total liquidación</Text>
                              <Heading size="md" color="green.600">
                                {formatCRC(simulacion.totales.totalBruto)}
                              </Heading>
                            </Box>
                          </SimpleGrid>
                        </Card.Body>
                      </Card.Root>

                      <Card.Root>
                        <Card.Header>
                          <Card.Title>Desglose de componentes</Card.Title>
                        </Card.Header>
                        <Card.Body p="0">
                          <Table.Root size="sm" variant="outline">
                            <Table.Header>
                              <Table.Row>
                                <Table.ColumnHeader>Componente</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="right">Monto</Table.ColumnHeader>
                                <Table.ColumnHeader>Detalle</Table.ColumnHeader>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              <Table.Row>
                                <Table.Cell>Salario diario</Table.Cell>
                                <Table.Cell textAlign="right">
                                  <Text fontWeight="semibold">
                                    {formatCRC(simulacion.componentes.salarioDiario.valor)}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>
                                  <Text textStyle="xs" color="fg.muted">
                                    {simulacion.componentes.salarioDiario.origen}
                                  </Text>
                                </Table.Cell>
                              </Table.Row>
                              <Table.Row>
                                <Table.Cell>Aguinaldo proporcional</Table.Cell>
                                <Table.Cell textAlign="right">
                                  <Text fontWeight="bold" color="green.600">
                                    {formatCRC(simulacion.componentes.aguinaldoProporcional.valor)}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>
                                  <Text textStyle="xs" color="fg.muted">
                                    {simulacion.componentes.aguinaldoProporcional.detalles?.mesesIncluidos ?? 0} meses
                                  </Text>
                                </Table.Cell>
                              </Table.Row>
                              <Table.Row>
                                <Table.Cell>Vacaciones proporcionales</Table.Cell>
                                <Table.Cell textAlign="right">
                                  <Text fontWeight="bold" color="green.600">
                                    {formatCRC(simulacion.componentes.vacacionesProporcionales.valor)}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>
                                  <Text textStyle="xs" color="fg.muted">
                                    {simulacion.componentes.vacacionesProporcionales.diasPendientes} días pendientes
                                  </Text>
                                </Table.Cell>
                              </Table.Row>
                              <Table.Row>
                                <Table.Cell>Cesantía</Table.Cell>
                                <Table.Cell textAlign="right">
                                  <Text fontWeight="bold" color="green.600">
                                    {formatCRC(simulacion.componentes.cesantia.valor)}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>
                                  <Text textStyle="xs" color="fg.muted">
                                    {simulacion.componentes.cesantia.diasCalculados} días
                                  </Text>
                                </Table.Cell>
                              </Table.Row>
                              <Table.Row>
                                <Table.Cell>Preaviso</Table.Cell>
                                <Table.Cell textAlign="right">
                                  <Text fontWeight="bold" color="green.600">
                                    {formatCRC(simulacion.componentes.preaviso.valor)}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>
                                  <Text textStyle="xs" color="fg.muted">
                                    {simulacion.componentes.preaviso.diasCalculados} días
                                  </Text>
                                </Table.Cell>
                              </Table.Row>
                              <Table.Row>
                                <Table.Cell>Salario pendiente</Table.Cell>
                                <Table.Cell textAlign="right">
                                  <Text fontWeight="bold" color="green.600">
                                    {formatCRC(simulacion.componentes.salarioPendiente.valor)}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>
                                  <Text textStyle="xs" color="fg.muted">
                                    {simulacion.componentes.salarioPendiente.diasPendientes} días
                                  </Text>
                                </Table.Cell>
                              </Table.Row>
                              <Table.Row bg="gray.50">
                                <Table.Cell>
                                  <Text fontWeight="bold">TOTAL</Text>
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                  <Heading size="md" color="green.600">
                                    {formatCRC(simulacion.totales.totalBruto)}
                                  </Heading>
                                </Table.Cell>
                                <Table.Cell />
                              </Table.Row>
                            </Table.Body>
                          </Table.Root>
                        </Card.Body>
                      </Card.Root>

                      {simulacion.validaciones.advertencias.length > 0 && (
                        <Card.Root borderColor="yellow.300" borderWidth="1px">
                          <Card.Body>
                            <Stack gap="1">
                              {simulacion.validaciones.advertencias.map((adv: string, i: number) => (
                                <Text key={i} textStyle="sm" color="yellow.700">
                                  ⚠ {adv}
                                </Text>
                              ))}
                            </Stack>
                          </Card.Body>
                        </Card.Root>
                      )}
                    </Stack>
                  ) : null}
                </Stack>
              </Form>
            ) : null
          }
        />

        <Card.Root>
          <Card.Header>
            <Card.Title>Liquidaciones creadas</Card.Title>
            <Card.Description>
              Visualiza, ordena y consulta el detalle de cada liquidación registrada.
            </Card.Description>
          </Card.Header>
          <Card.Body>
            <DataTable<LiquidacionRegistro>
              columns={tableColumns}
              data={paginatedRecords}
              actionColumn={actionColumn}
              isDataLoading={loadingRecords}
              size="md"
              pagination={{
                enabled: true,
                page: tableQuery.page,
                pageSize: tableQuery.limit,
                totalCount: sortedRecords.length,
                onPageChange: (nextPage) => {
                  setTableQuery((prev) => ({ ...prev, page: nextPage }));
                },
              }}
            />
          </Card.Body>
        </Card.Root>
      </Stack>

      <Modal
        title={
          selectedLiquidacionRecord
            ? `Detalle de liquidación #${selectedLiquidacionRecord.id_caso_termina}`
            : "Detalle de liquidación"
        }
        size="xl"
        isOpen={Boolean(selectedLiquidacionRecord)}
        onOpenChange={({ open }) => {
          if (!open) {
            setSelectedLiquidacionRecord(null);
            setLiquidacionDetalle(null);
          }
        }}
        footerContent={(
          <HStack w="full" justifyContent="flex-end">
            <Button
              colorPalette="blue"
              variant="outline"
              disabled={!detalleActual || isDetalleLoading}
              loading={isPdfDownloading}
              onClick={() => {
                void handleDownloadDetallePdf();
              }}
            >
              <FiDownload />
              Descargar PDF
            </Button>
          </HStack>
        )}
        content={
          isDetalleLoading ? (
            <Stack align="center" py="10" gap="3">
              <Spinner size="lg" />
              <Text color="fg.muted">Cargando detalle de liquidación…</Text>
            </Stack>
          ) : detalleActual ? (
            <LiquidacionDetalleCard detalle={detalleActual} />
          ) : (
            <Text color="fg.muted">No se logró cargar el detalle de la liquidación.</Text>
          )
        }
      />
    </Layout>
  );
};

function DetailInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="0.5">
      <Text fontSize="xs" color="fg.muted" textTransform="uppercase">{label}</Text>
      <Text fontWeight="semibold">{value}</Text>
    </Stack>
  );
}

function LiquidacionDetalleCard({ detalle }: { detalle: LiquidacionDetalleView }) {
  return (
    <Stack gap="6" maxW="1100px" mx="auto" w="full">
      <Card.Root>
        <Card.Body>
          <Stack align="center" gap="2" textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="brand.blue.700">
              {COMPANY_NAME}
            </Text>
            <Text color="fg.muted">Detalle de liquidación laboral</Text>
            <Text fontSize="sm" color="fg.muted">Caso #{detalle.idCasoTermina}</Text>
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
              <DetailInfoItem label="Nombre" value={detalle.colaboradorNombre} />
              <DetailInfoItem label="Identificación" value={detalle.identificacion} />
              <DetailInfoItem label="Causa" value={detalle.causa} />
              <DetailInfoItem
                label="Ingreso compañía"
                value={formatDateUiCompact(detalle.fechaIngresoContrato)}
              />
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Información de liquidación</Card.Title>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
              <DetailInfoItem label="Fecha terminación" value={formatDateUiCompact(detalle.fechaTerminacion)} />
              <DetailInfoItem label="Fecha aprobación" value={formatDateUiCompact(detalle.fechaAprobacion)} />
              <DetailInfoItem label="Preaviso" value={detalle.realizoPreaviso ? "Sí" : "No"} />
            </SimpleGrid>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <Card.Root>
        <Card.Header>
          <Card.Title>Desglose de componentes</Card.Title>
        </Card.Header>
        <Card.Body p="0">
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Componente</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Monto</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>Salario diario</Table.Cell>
                <Table.Cell textAlign="right">
                  <Text fontWeight="semibold">{formatCRC(detalle.salarioDiario)}</Text>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Aguinaldo proporcional</Table.Cell>
                <Table.Cell textAlign="right">
                  <Text fontWeight="bold" color="green.600">{formatCRC(detalle.aguinaldo)}</Text>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Cesantía</Table.Cell>
                <Table.Cell textAlign="right">
                  <Text fontWeight="bold" color="green.600">{formatCRC(detalle.cesantia)}</Text>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Preaviso</Table.Cell>
                <Table.Cell textAlign="right">
                  <Text fontWeight="bold" color="green.600">{formatCRC(detalle.preaviso)}</Text>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Otros montos</Table.Cell>
                <Table.Cell textAlign="right">
                  <Text fontWeight="bold" color="green.600">{formatCRC(detalle.otrosMontos)}</Text>
                </Table.Cell>
              </Table.Row>
              <Table.Row bg="gray.50">
                <Table.Cell>
                  <Text fontWeight="bold">TOTAL</Text>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  <Heading size="md" color="green.600">
                    {formatCRC(detalle.totalBruto)}
                  </Heading>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}
