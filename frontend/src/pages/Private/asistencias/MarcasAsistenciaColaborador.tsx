import { useParams } from 'react-router';
import { useMemo, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  Badge,
  HStack,
  Text,
  Button as ChakraButton,
  VStack,
} from '@chakra-ui/react';
import { Layout } from "../../../components/layout";
import { DataTable } from '../../../components/general/table/DataTable';
import type { DataTableColumn } from '../../../components/general/table/types';
import { useWeekPager } from '../../../hooks/useWeekPager';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { useApiMutation } from '../../../hooks/useApiMutations';
import { Modal } from '../../../components/general';
import { Form, InputField } from '../../../components/forms';
import { Button as PrimaryButton } from '../../../components/general/button/Button';
import { formatDateUiDefault } from '../../../utils';
import { FiEdit2 } from 'react-icons/fi';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("es");

export interface RespuestaApi {
  colaborador: Colaborador
  filtro: Filtro
  total: number
  marcas: Marca[]
}

export interface Colaborador {
  id_colaborador: number
  identificacion: number
  nombre: string
  primer_apellido: string
  segundo_apellido: string
}

export interface Filtro {
  desde: string
  hasta: string
  tipo_marca: string
}

export interface Marca {
  dia: string
  asistencia: Asistencia[]
}

export interface Asistencia {
  id_marca: number
  tipo_marca: string
  timestamp: string
}

type MarcaDiaRow = {
  key: string;
  identificacion: number | string;
  dia: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  entrada_timestamp: string | null;
  salida_timestamp: string | null;
};

type UpdateMarcaFormValues = {
  tipo_marca: "ENTRADA" | "SALIDA";
  nuevo_timestamp: string;
};

const formatTimeCR = (timestamp: string) =>
  dayjs
    .utc(timestamp)
    .tz("America/Costa_Rica")
    .format("h:mm a");

export const MarcasAsistenciaColaborador = () => {
  const { id } = useParams<{ id: string }>();
  const { desde, hasta, label, goPrevWeek, goNextWeek, goToday } = useWeekPager();

  const [selectedMarca, setSelectedMarca] = useState<MarcaDiaRow | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const marcasUrl = useMemo(() => {
    if (!id) return "";
    return `/asistencia/marcas?rango&identificacion=${encodeURIComponent(
      id,
    )}&desde=${desde}&hasta=${hasta}`;
  }, [id, desde, hasta]);

  const { data: marcasApi, isLoading: asistenciaLoading, refetch } = useApiQuery<RespuestaApi>({
    url: marcasUrl,
    enabled: Boolean(marcasUrl),
  });

  const { mutate: patchMarca, isLoading: isSavingMarca } = useApiMutation<
    {
      identificacion: string;
      tipo_marca: string;
      timestamp: string;
      nuevo_timestamp?: string;
    },
    void
  >({
    url: "/asistencia/marca",
    method: "PATCH",
  });

  function mapMarcasToRows(apiData: RespuestaApi): MarcaDiaRow[] {
    const colab = apiData?.colaborador;
    const identificacion = colab?.identificacion ?? "";

    const marcas = apiData?.marcas ?? [];

    return marcas.map((diaItem) => {
      const dia = diaItem.dia;
      const asistencia = diaItem.asistencia ?? [];

      const entrada = asistencia.find((m) => String(m.tipo_marca ?? "").toUpperCase() === "ENTRADA");
      const salida = [...asistencia].reverse().find((m) => String(m.tipo_marca ?? "").toUpperCase() === "SALIDA");

      return {
        key: `${colab?.id_colaborador ?? "x"}-${dia}`,
        identificacion,
        dia: formatDateUiDefault(dia),
        hora_entrada: entrada ? formatTimeCR(entrada.timestamp) : null,
        hora_salida: salida ? formatTimeCR(salida.timestamp) : null,
        entrada_timestamp: entrada?.timestamp ?? null,
        salida_timestamp: salida?.timestamp ?? null,
      };
    });
  }

  const collaboratorSummary = useMemo(() => {
    const colab = marcasApi?.colaborador;
    if (!colab) return null;

    const nombreCompleto = `${colab.nombre ?? ""} ${colab.primer_apellido ?? ""} ${colab.segundo_apellido ?? ""}`.trim();
    return {
      nombreCompleto,
      identificacion: String(colab.identificacion ?? ""),
    };
  }, [marcasApi]);

  const handleOpenUpdate = useCallback((row: MarcaDiaRow) => {
    setSelectedMarca(row);
    setIsUpdateModalOpen(true);
  }, []);

  const columns = useMemo<DataTableColumn<MarcaDiaRow>[]>(() => {
    return [
      {
        id: "dia",
        header: "Día",
        minW: "170px",
        textAlign: "center",
        cell: (r) => r.dia,
      },
      {
        id: "hora_entrada",
        header: "Hora Entrada",
        minW: "170px",
        textAlign: "center",
        cell: (r) => r.hora_entrada ?? "Sin registro",
      },
      {
        id: "hora_salida",
        header: "Hora Salida",
        minW: "170px",
        textAlign: "center",
        cell: (r) => r.hora_salida ?? "Sin registro",
      },
    ];
  }, []);

  const rows = useMemo(() => {
    if (!marcasApi) return [];
    return mapMarcasToRows(marcasApi);
  }, [marcasApi]);

  const tipoMarcaOptions = useMemo(() => {
    if (!selectedMarca) {
      return [
        { label: "Entrada", value: "ENTRADA" },
        { label: "Salida", value: "SALIDA" },
      ];
    }

    const options = [] as Array<{ label: string; value: "ENTRADA" | "SALIDA" }>;
    if (selectedMarca.entrada_timestamp) options.push({ label: "Entrada", value: "ENTRADA" });
    if (selectedMarca.salida_timestamp) options.push({ label: "Salida", value: "SALIDA" });

    return options.length > 0
      ? options
      : [
        { label: "Entrada", value: "ENTRADA" },
        { label: "Salida", value: "SALIDA" },
      ];
  }, [selectedMarca]);

  const handleCloseModals = useCallback(() => {
    setIsUpdateModalOpen(false);
    setSelectedMarca(null);
  }, []);

  const handleSubmitActualizar = useCallback(
    async (values: UpdateMarcaFormValues) => {
      if (!selectedMarca) return false;

      try {
        const timestampOriginal = values.tipo_marca === "ENTRADA"
          ? selectedMarca.entrada_timestamp
          : selectedMarca.salida_timestamp;

        if (!timestampOriginal) {
          return false;
        }

        const baseDia = dayjs.utc(timestampOriginal).tz("America/Costa_Rica");
        const timeOnly = dayjs(values.nuevo_timestamp, "HH:mm", true);
        if (!timeOnly.isValid()) {
          return false;
        }

        const nuevoTimestampIso = baseDia
          .hour(timeOnly.hour())
          .minute(timeOnly.minute())
          .second(0)
          .millisecond(0)
          .utc()
          .toISOString();

        await patchMarca({
          identificacion: String(selectedMarca.identificacion),
          tipo_marca: values.tipo_marca,
          timestamp: timestampOriginal,
          nuevo_timestamp: nuevoTimestampIso,
        });

        handleCloseModals();
        await refetch();
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    [selectedMarca, patchMarca, handleCloseModals, refetch],
  );

  return (
    <Layout pageTitle="Marcas de asistencia">

      {collaboratorSummary && (
        <VStack align="flex-start" gap="0.5" mt="4" mb="1rem">
          <Text fontSize="lg" fontWeight="semibold">
            {collaboratorSummary.nombreCompleto}
          </Text>
          <Text color="gray.600">
            Identificación: {collaboratorSummary.identificacion}
          </Text>
        </VStack>
      )}

      <VStack align="flex-start" gap="2" mb="1rem" mt="2rem">
        <HStack gap="3">
          <ChakraButton
            variant="surface"
            colorPalette="blue"
            size="sm"
            type="button"
            onClick={goPrevWeek}
          >
            Semana anterior
          </ChakraButton>

          <ChakraButton
            variant="surface"
            colorPalette="blue"
            size="sm"
            type="button"
            onClick={goToday}
          >
            Hoy
          </ChakraButton>

          <ChakraButton
            variant="surface"
            colorPalette="blue"
            size="sm"
            type="button"
            onClick={goNextWeek}
          >
            Semana siguiente
          </ChakraButton>
        </HStack>

        <Badge variant="surface" colorPalette="green" size="lg">
          {label}
        </Badge>
      </VStack>

      <DataTable<MarcaDiaRow>
        data={asistenciaLoading ? [] : rows}
        columns={columns}
        isDataLoading={asistenciaLoading}
        size="md"
        actionColumn={{
          header: "Acciones",
          w: "200px",
          sticky: true,
          cell: (row) => (
            <HStack gap="2" justifyContent="flex-end" wrap="wrap">
              <ChakraButton
                variant="subtle"
                colorPalette="green"
                size="sm"
                onClick={() => handleOpenUpdate(row)}
                disabled={!row.entrada_timestamp && !row.salida_timestamp}
              >
                <FiEdit2 /> Actualizar marca
              </ChakraButton>
            </HStack>
          ),
        }}
      />

      <Modal
        title="Actualizar marca"
        size="lg"
        isOpen={isUpdateModalOpen}
        onOpenChange={(event) => {
          if (!event.open) handleCloseModals();
        }}
        content={
          selectedMarca ? (
            <Form<UpdateMarcaFormValues>
              onSubmit={handleSubmitActualizar}
              defaultValues={{
                tipo_marca: selectedMarca.entrada_timestamp ? "ENTRADA" : "SALIDA",
                nuevo_timestamp: dayjs
                  .utc(
                    selectedMarca.entrada_timestamp ?? selectedMarca.salida_timestamp ?? new Date().toISOString(),
                  )
                  .tz("America/Costa_Rica")
                  .format("HH:mm"),
              }}
            >
              <InputField
                fieldType="select"
                label="Tipo de marca"
                name="tipo_marca"
                options={tipoMarcaOptions}
                disableSelectPortal
                required
                rules={{ required: "Selecciona el tipo de marca" }}
              />

              <InputField
                fieldType="time"
                label="Nuevo timestamp"
                name="nuevo_timestamp"
                required
                rules={{ required: "El nuevo timestamp es obligatorio" }}
              />

              <PrimaryButton
                loading={isSavingMarca}
                loadingText="Actualizando"
                appearance="login"
                type="submit"
                mt="4"
                size="lg"
                w="100%"
                marginBottom="2"
              >
                Actualizar marca
              </PrimaryButton>
            </Form>
          ) : null
        }
      />
    </Layout>
  );
};
