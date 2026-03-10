/* eslint-disable no-unused-vars */
import { useMemo, useState } from "react";
import {
  Box,
  Badge,
  Button,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RatingGroup } from "@chakra-ui/react";
import { Document, Image, Page, StyleSheet, Text as PdfText, View, pdf } from "@react-pdf/renderer";
import { FiDownload } from "react-icons/fi";
import { Modal } from "../../../../components/general/modal";
import { RadarChartEvaluacion } from "./RadarChartEvaluacion";
import type { Evaluacion } from "../../../../types/Evaluacion";
import logoPdf from "../../../../assets/logo.jpg";

const pdfStyles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 9,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 700,
    color: "#14204a",
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 12,
    objectFit: "contain",
  },
  title: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: 700,
  },
  card: {
    borderWidth: 1,
    borderColor: "#D7E0F1",
    padding: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    color: "#4A5568",
  },
  value: {
    fontSize: 10,
    color: "#1A202C",
    fontWeight: 700,
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
  planBox: {
    borderWidth: 1,
    borderColor: "#D7E0F1",
    padding: 8,
    fontSize: 9,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 12,
    textAlign: "right",
    fontSize: 8,
    color: "#4A5568",
  },
});

const COMPANY_NAME = "BioAlquimia";

function tryParseDate(value?: string | null) {
  if (!value) return null;
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T/;

  if (!dateOnlyRegex.test(value) && !dateTimeRegex.test(value)) return null;

  const candidate = dateOnlyRegex.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatLongDate(value?: string | null) {
  const parsed = tryParseDate(value);
  if (!parsed) return value ?? "—";

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

  if (!weekday || !day || !month || !year) return value ?? "—";
  return `${capitalize(weekday)} ${day} de ${capitalize(month)}, ${year}`;
}

function EvaluacionPdfDocument({
  evaluacion,
  colaboradorNombre,
  evaluadorNombre,
}: {
  evaluacion: Evaluacion;
  colaboradorNombre: string;
  evaluadorNombre: string;
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.topBar}>
          <PdfText style={pdfStyles.companyName}>{COMPANY_NAME}</PdfText>
          <PdfText>{formatLongDate(new Date().toISOString())}</PdfText>
        </View>

        <Image src={logoPdf} style={pdfStyles.logo} />
        <PdfText style={pdfStyles.title}>Evaluación de desempeño</PdfText>

        <View style={pdfStyles.card}>
          <View style={pdfStyles.row}>
            <PdfText style={pdfStyles.label}>Colaborador</PdfText>
            <PdfText style={pdfStyles.value}>{colaboradorNombre || "N/D"}</PdfText>
          </View>
          <View style={pdfStyles.row}>
            <PdfText style={pdfStyles.label}>Evaluador</PdfText>
            <PdfText style={pdfStyles.value}>{evaluadorNombre || "N/D"}</PdfText>
          </View>
          <View style={pdfStyles.row}>
            <PdfText style={pdfStyles.label}>Período</PdfText>
            <PdfText style={pdfStyles.value}>{`${formatLongDate(evaluacion.fecha_inicio)} — ${formatLongDate(evaluacion.fecha_fin)}`}</PdfText>
          </View>
          <View style={pdfStyles.row}>
            <PdfText style={pdfStyles.label}>Puntaje general</PdfText>
            <PdfText style={pdfStyles.value}>{Number(evaluacion.puntaje_general).toFixed(2)}</PdfText>
          </View>
        </View>

        <PdfText style={pdfStyles.sectionTitle}>Detalle por rubro</PdfText>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <PdfText style={pdfStyles.headerCell}>Rubro</PdfText>
            <PdfText style={pdfStyles.headerCell}>Calificación</PdfText>
            <PdfText style={pdfStyles.headerCell}>Comentarios</PdfText>
          </View>

          {evaluacion.rubros.map((er) => {
            const rubro = er.rubro;
            const maxCal = Number(rubro?.calificacion || 0);

            return (
              <View key={`pdf-rubro-${er.id_rubro_evaluacion}`} style={pdfStyles.tableRow}>
                <PdfText style={pdfStyles.bodyCell}>{rubro?.rubro || "Rubro"}</PdfText>
                <PdfText style={pdfStyles.bodyCell}>{`${maxCal.toFixed(1)} / ${maxCal}`}</PdfText>
                <PdfText style={pdfStyles.bodyCell}>{rubro?.comentarios || "—"}</PdfText>
              </View>
            );
          })}
        </View>

        {evaluacion.plan_accion && (
          <>
            <PdfText style={pdfStyles.sectionTitle}>Plan de acción</PdfText>
            <PdfText style={pdfStyles.planBox}>{evaluacion.plan_accion}</PdfText>
          </>
        )}

        <PdfText style={pdfStyles.footer}>Generado por BioAlquimia</PdfText>
      </Page>
    </Document>
  );
}

interface EvaluacionDetalleModalProps {
  evaluacion: Evaluacion;
  isOpen: boolean;
  onOpenChange: (_e: { open: boolean }) => void;
}

export const EvaluacionDetalleModal = ({
  evaluacion,
  isOpen,
  onOpenChange,
}: EvaluacionDetalleModalProps) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const colaboradorNombre = evaluacion.colaborador
    ? `${evaluacion.colaborador.nombre} ${evaluacion.colaborador.primer_apellido} ${evaluacion.colaborador.segundo_apellido}`
    : "";

  const evaluadorNombre = evaluacion.evaluador
    ? `${evaluacion.evaluador.nombre} ${evaluacion.evaluador.primer_apellido}`
    : "";

  const pdfFileName = useMemo(
    () => `evaluacion-${evaluacion.id_evaluacion}-${String(evaluacion.fecha_fin ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10)}.pdf`,
    [evaluacion.fecha_fin, evaluacion.id_evaluacion],
  );

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);

    try {
      const blob = await pdf(
        <EvaluacionPdfDocument
          evaluacion={evaluacion}
          colaboradorNombre={colaboradorNombre}
          evaluadorNombre={evaluadorNombre}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = pdfFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <Modal
      title={`Resultados de ${colaboradorNombre}`}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="xl"
      footerContent={(
        <HStack w="full" justify="flex-end">
          <Button size="sm" colorPalette="blue" onClick={handleDownloadPdf} loading={isDownloadingPdf}>
            <FiDownload />
            Descargar PDF
          </Button>
        </HStack>
      )}
    >
      <VStack align="stretch" gap="5">
        <HStack justify="space-between" flexWrap="wrap" gap="2">
          <VStack align="start" gap="1">
            <Text fontSize="sm" color="gray.500">
              Evaluador: {evaluadorNombre}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Período: {evaluacion.fecha_inicio} — {evaluacion.fecha_fin}
            </Text>
          </VStack>
          <Badge colorPalette="teal" variant="solid" fontSize="lg" px="3" py="1">
            Puntaje: {Number(evaluacion.puntaje_general).toFixed(2)}
          </Badge>
        </HStack>

        <RadarChartEvaluacion evaluacion={evaluacion} />

        <Heading size="sm">Detalle por rubro</Heading>
        {evaluacion.rubros.map((er) => {
          const rubro = er.rubro;
          const maxCal = rubro ? Number(rubro.calificacion) : 5;

          return (
            <Box
              key={er.id_rubro_evaluacion}
              p="3"
              borderWidth="1px"
              borderRadius="md"
              borderColor="gray.200"
            >
              <HStack justify="space-between" mb="1">
                <Text fontWeight="bold">{rubro?.rubro || "Rubro"}</Text>
                <Badge colorPalette="blue" size="sm">
                  {Number(rubro?.calificacion || 0).toFixed(1)} / {maxCal}
                </Badge>
              </HStack>

              <RatingGroup.Root
                count={maxCal}
                value={Number(rubro?.calificacion || 0)}
                readOnly
                size="sm"
              >
                <RatingGroup.HiddenInput />
                <RatingGroup.Control />
              </RatingGroup.Root>

              {rubro?.comentarios && (
                <Text fontSize="xs" color="gray.500" mt="1">
                  {rubro.comentarios}
                </Text>
              )}
            </Box>
          );
        })}

        {evaluacion.plan_accion && (
          <Box>
            <Heading size="sm" mb="2">
              Plan de Acción
            </Heading>
            <Box
              p="3"
              bg="gray.50"
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <Text fontSize="sm" whiteSpace="pre-wrap">
                {evaluacion.plan_accion}
              </Text>
            </Box>
          </Box>
        )}
      </VStack>
    </Modal>
  );
};
