import { useParams, useNavigate } from "react-router";
import { useMemo, useState } from "react";
import {
  Badge,
  Card,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Table,
} from "@chakra-ui/react";
import { FiArrowLeft, FiCalendar } from "react-icons/fi";
import { Form, InputField } from "../../../components/forms";
import { formatDateUiDefault, toTitleCase } from "../../../utils";
import { showToast } from "../../../services/toast/toastService";
import { Modal } from "../../../components/general";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useAuth } from "../../../context/AuthContext";
import { Layout } from "../../../components/layout";
import { Button } from "../../../components/general/button/Button";
import { extenderIncapacidad } from "../../../services/api/incapacidades";

const InfoBlock = ({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number | null;
  children?: React.ReactNode;
}) => (
  <Stack gap="0.5">
    <Text textStyle="xs" color="fg.muted" textTransform="uppercase">
      {label}
    </Text>
    {children ?? <Text fontWeight="semibold">{value ?? "—"}</Text>}
  </Stack>
);

const formatDateLong = (iso?: string | null) => {
  return formatDateUiDefault(iso);
};

interface DiaIncapacidad {
  id_jornada: number;
  fecha: string;
  id_incapacidad: number | null;
  porcentaje_patrono: number;
  porcentaje_ccss: number;
}

interface IncapacidadGrupo {
  numero_boleta: string | null;
  tipo_incapacidad: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias: DiaIncapacidad[];
}

export default function DetalleIncapacidad() {
  const { numero_boleta } = useParams<{ numero_boleta: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userID = user?.id;

  const {
    data: incapacidades = [],
    isLoading,
    refetch,
  } = useApiQuery<IncapacidadGrupo[]>({
    url: `incapacidades/colaborador/${userID}`,
    enabled: Boolean(userID),
  });

  const incapacidad = useMemo(
    () => incapacidades.find((i) => i.numero_boleta === numero_boleta) ?? null,
    [incapacidades, numero_boleta],
  );

  const tipoLabel = useMemo(() => {
    const raw = incapacidad?.tipo_incapacidad?.replace(/_/g, " ") ?? "";
    if (!raw) return "Tipo no definido";
    return raw.toUpperCase() === raw ? raw : toTitleCase(raw);
  }, [incapacidad]);

  const extensionMinDate = incapacidad?.fecha_fin ?? "";

  const totalDias = incapacidad?.dias.length ?? 0;
  const diasLaborales = incapacidad?.dias.filter((d) => d.porcentaje_patrono > 0 || d.porcentaje_ccss > 0).length ?? 0;

  const [openExtendModal, setOpenExtendModal] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  const handleExtender = async (form: { fecha_fin: string }) => {
    if (!numero_boleta) return;
    try {
      setIsExtending(true);
      await extenderIncapacidad(numero_boleta, { fecha_fin: form.fecha_fin });
      showToast("Incapacidad extendida correctamente.", "success");
      setOpenExtendModal(false);
      await refetch();
    } catch (error) {
      console.log(error);
      showToast("Error al extender la incapacidad.", "error");
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <Layout pageTitle="Detalle de Incapacidad">
      <Stack gap="8" marginBottom="5rem">
        <Card.Root>
          <Card.Body>
            {isLoading ? (
              <Stack align="center" py="6">
                <Spinner size="lg" />
              </Stack>
            ) : !incapacidad ? (
              <Stack align="center" py="6" gap="3">
                <Text color="fg.muted">No se encontró la incapacidad.</Text>
                <Button
                  variant="ghost"
                  colorPalette="blue"
                  onClick={() => navigate("/incapacidades")}
                >
                  <FiArrowLeft /> Volver a incapacidades
                </Button>
              </Stack>
            ) : (
              <Stack gap="4">
                <Flex justify="space-between" align="center" wrap="wrap" gap="3">
                  <Stack gap="1">
                    <HStack gap="2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => navigate("/incapacidades")}
                      >
                        <FiArrowLeft />
                      </Button>
                      <Heading size="lg">
                        Incapacidad por {tipoLabel}
                      </Heading>
                    </HStack>
                    <Text color="fg.muted" fontSize="sm">
                      Desde {formatDateLong(incapacidad.fecha_inicio)} hasta{" "}
                      {formatDateLong(incapacidad.fecha_fin)}
                    </Text>
                    <HStack gap="2" mt="1">
                      <Badge colorPalette="blue">{tipoLabel}</Badge>
                      <Badge variant="surface">{totalDias} días</Badge>
                    </HStack>
                  </Stack>
                  <Button
                    size="sm"
                    colorPalette="blue"
                    onClick={() => setOpenExtendModal(true)}
                  >
                    <FiCalendar /> Extender incapacidad
                  </Button>
                </Flex>
              </Stack>
            )}
          </Card.Body>
        </Card.Root>

        {!isLoading && incapacidad && (
          <Card.Root>
            <Card.Header>
              <Card.Title>Información General</Card.Title>
            </Card.Header>
            <Card.Body>
              <Stack gap="6">
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
                  <InfoBlock
                    label="Tipo de incapacidad"
                    value={tipoLabel}
                  />
                  <InfoBlock
                    label="Fecha de inicio"
                    value={formatDateLong(incapacidad.fecha_inicio)}
                  />
                  <InfoBlock
                    label="Fecha de fin"
                    value={formatDateLong(incapacidad.fecha_fin)}
                  />
                  <InfoBlock label="Total de días" value={totalDias} />
                  <InfoBlock
                    label="Días con cobertura"
                    value={diasLaborales}
                  />
                  <InfoBlock
                    label="Número de boleta"
                    value={incapacidad.numero_boleta ?? "—"}
                  />
                </SimpleGrid>

                <Stack gap="3">
                  <Text textStyle="sm" fontWeight="semibold">
                    Días incluidos
                  </Text>
                  <HStack gap="2" wrap="wrap" align="start">
                    {incapacidad.dias.map((dia) => (
                      <Badge
                        key={dia.id_jornada}
                        size="sm"
                        bg="blue.100"
                        color="blue.800"
                        borderRadius="full"
                        px="2.5"
                        py="1"
                      >
                        {formatDateLong(dia.fecha)}
                      </Badge>
                    ))}
                  </HStack>
                </Stack>
              </Stack>
            </Card.Body>
          </Card.Root>
        )}

        {!isLoading && incapacidad && (
          <Card.Root>
            <Card.Header>
              <Card.Title>Desglose por día</Card.Title>
            </Card.Header>
            <Card.Body>
              <Table.ScrollArea>
                <Table.Root size="md" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">
                        % Patrono
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">
                        % CCSS
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">
                        Cobertura
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {incapacidad.dias.map((dia) => {
                      const hasCoverage =
                        dia.porcentaje_patrono > 0 || dia.porcentaje_ccss > 0;
                      return (
                        <Table.Row key={dia.id_jornada}>
                          <Table.Cell>{formatDateLong(dia.fecha)}</Table.Cell>
                          <Table.Cell textAlign="center">
                            {dia.porcentaje_patrono}%
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            {dia.porcentaje_ccss}%
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            <Badge
                              colorPalette={hasCoverage ? "green" : "gray"}
                              size="sm"
                            >
                              {hasCoverage ? "Con cobertura" : "Sin cobertura"}
                            </Badge>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
              </Table.ScrollArea>
            </Card.Body>
          </Card.Root>
        )}
      </Stack>

      <Modal
        title="Extender incapacidad"
        isOpen={openExtendModal}
        onOpenChange={(e) => setOpenExtendModal(e.open)}
        content={
          <Form
            onSubmit={handleExtender}
            defaultValues={{ fecha_fin: extensionMinDate }}
          >
            <Stack gap="4">
              <Text fontSize="sm" color="fg.muted">
                La incapacidad actual termina el{" "}
                <strong>{formatDateLong(incapacidad?.fecha_fin)}</strong>.
                Ingrese la nueva fecha de finalización.
              </Text>

              <InputField
                fieldType="date"
                label="Nueva fecha de fin"
                name="fecha_fin"
                required
                min={extensionMinDate || undefined}
                rules={{
                  required: "El campo es obligatorio",
                  validate: (value) => {
                    const nextDate = String(value ?? "");

                    if (!nextDate || !extensionMinDate) return true;

                    return nextDate > extensionMinDate || "La nueva fecha debe ser posterior a la fecha fin actual.";
                  },
                }}
              />

              <Button
                fontWeight="semibold"
                colorPalette="blue"
                loadingText="Extendiendo..."
                loading={isExtending}
                type="submit"
              >
                Extender incapacidad
              </Button>
            </Stack>
          </Form>
        }
      />
    </Layout>
  );
}
