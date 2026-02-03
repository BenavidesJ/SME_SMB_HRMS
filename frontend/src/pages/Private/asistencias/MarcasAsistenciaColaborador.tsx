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
  Button,
  Menu,
  Portal,
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
  observaciones: string
}

type MarcaEventoRow = {
  key: string;
  identificacion: number | string;
  nombre_completo: string;
  dia: string;
  tipo_marca: string;
  timestamp: string;
  observaciones: string;
  id_marca: number;
};

type UpdateMarcaFormValues = {
  tipo_marca: "ENTRADA" | "SALIDA";
  nuevo_timestamp: string;
};

type ObservacionFormValues = {
  observaciones: string;
};

const formatTimeCR = (timestamp: string) =>
  dayjs
    .utc(timestamp)
    .tz("America/Costa_Rica")
    .format("h:mm a");

export const MarcasAsistenciaColaborador = () => {
  const { id } = useParams<{ id: string }>();
  const { desde, hasta, label, goPrevWeek, goNextWeek, goToday } = useWeekPager();

  const [selectedMarca, setSelectedMarca] = useState<MarcaEventoRow | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isObservacionModalOpen, setIsObservacionModalOpen] = useState(false);

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
      observaciones?: string;
    },
    void
  >({
    url: "/asistencia/marca",
    method: "PATCH",
  });

  function mapMarcasToRows(apiData: RespuestaApi): MarcaEventoRow[] {
    const colab = apiData?.colaborador;
    const nombreCompleto = `${colab?.nombre ?? ""} ${colab?.primer_apellido ?? ""} ${colab?.segundo_apellido ?? ""}`.trim();

    const identificacion = colab?.identificacion ?? "";

    const marcas = apiData?.marcas ?? [];

    return marcas.flatMap((diaItem) => {
      const dia = diaItem.dia; // viene del backend
      const asistencia = diaItem.asistencia ?? [];

      return asistencia.map((m) => ({
        key: `${colab?.id_colaborador ?? "x"}-${dia}-${m.id_marca}`,
        identificacion,
        nombre_completo: nombreCompleto,
        dia,
        tipo_marca: m.tipo_marca,
        timestamp: m.timestamp,
        observaciones: m.observaciones,
        id_marca: m.id_marca,
      }));
    });
  }

  const handleOpenUpdate = useCallback((row: MarcaEventoRow) => {
    setSelectedMarca(row);
    setIsUpdateModalOpen(true);
  }, []);

  const handleOpenObservacion = useCallback((row: MarcaEventoRow) => {
    setSelectedMarca(row);
    setIsObservacionModalOpen(true);
  }, []);

  const columns = useMemo<DataTableColumn<MarcaEventoRow>[]>(() => {
    return [
      {
        id: "identificacion",
        header: "Identificación",
        minW: "140px",
        textAlign: "center",
        cell: (r) => String(r.identificacion),
      },
      {
        id: "nombre_completo",
        header: "Nombre completo",
        minW: "260px",
        textAlign: "left",
        cell: (r) => r.nombre_completo,
      },
      {
        id: "dia",
        header: "Día",
        minW: "130px",
        textAlign: "center",
        cell: (r) => r.dia,
      },
      {
        id: "tipo_marca",
        header: "Tipo",
        minW: "120px",
        textAlign: "center",
        cell: (r) => (
          <Badge colorPalette={r.tipo_marca === "ENTRADA" ? "teal" : "orange"}>
            {r.tipo_marca}
          </Badge>
        ),
      },
      {
        id: "timestamp",
        header: "Hora",
        minW: "190px",
        textAlign: "center",
        cell: (r) => formatTimeCR(r.timestamp),
      },
      // opcional:
      {
        id: "observaciones",
        header: "Observaciones",
        minW: "220px",
        textAlign: "left",
        cell: (r) => <Text>{r.observaciones}</Text>,
      },
      {
        id: "acciones",
        header: "Acciones",
        minW: "160px",
        textAlign: "center",
        cell: (row) => (
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button size="sm" variant="outline">
                Acciones
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="actualizar" onClick={() => handleOpenUpdate(row)}>
                    Actualizar marca
                  </Menu.Item>
                  <Menu.Item value="observacion" onClick={() => handleOpenObservacion(row)}>
                    Agregar observación
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        ),
      },
    ];
  }, [handleOpenObservacion, handleOpenUpdate]);

  const rows = useMemo(() => {
    if (!marcasApi) return [];
    return mapMarcasToRows(marcasApi);
  }, [marcasApi]);

  const tipoMarcaOptions = useMemo(
    () => [
      { label: "Entrada", value: "ENTRADA" },
      { label: "Salida", value: "SALIDA" },
    ],
    [],
  );

  const handleCloseModals = useCallback(() => {
    setIsUpdateModalOpen(false);
    setIsObservacionModalOpen(false);
    setSelectedMarca(null);
  }, []);

  const handleSubmitActualizar = useCallback(
    async (values: UpdateMarcaFormValues) => {
      if (!selectedMarca) return false;

      try {
        const baseDia = dayjs.tz(selectedMarca.timestamp, "America/Costa_Rica");
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
          tipo_marca: selectedMarca.tipo_marca,
          timestamp: selectedMarca.timestamp,
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

  const handleSubmitObservacion = useCallback(
    async (values: ObservacionFormValues) => {
      if (!selectedMarca) return false;

      try {
        const payload = String(values.observaciones ?? "").trim() || "N/A";

        await patchMarca({
          identificacion: String(selectedMarca.identificacion),
          tipo_marca: selectedMarca.tipo_marca,
          timestamp: selectedMarca.timestamp,
          observaciones: payload,
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
    <Layout pageTitle={`Marcas de asistencia`}>

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

        <Badge variant="surface" colorPalette="blue" size="lg">
          {label}
        </Badge>
      </VStack>

      <DataTable<MarcaEventoRow>
        data={asistenciaLoading ? [] : rows}
        columns={columns}
        isDataLoading={asistenciaLoading}
        size="md"
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
                tipo_marca: (selectedMarca.tipo_marca as "ENTRADA" | "SALIDA") ?? "ENTRADA",
                nuevo_timestamp: dayjs
                  .tz(selectedMarca.timestamp, "America/Costa_Rica")
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

      <Modal
        title="Agregar observación"
        size="md"
        isOpen={isObservacionModalOpen}
        onOpenChange={(event) => {
          if (!event.open) handleCloseModals();
        }}
        content={
          selectedMarca ? (
            <Form<ObservacionFormValues>
              onSubmit={handleSubmitObservacion}
              defaultValues={{ observaciones: selectedMarca.observaciones ?? "" }}
            >
              <InputField
                fieldType="text"
                label="Observaciones"
                name="observaciones"
                required
                rules={{
                  required: "El campo es obligatorio",
                  maxLength: {
                    value: 250,
                    message: "Máximo 250 caracteres",
                  },
                  setValueAs: (value) => String(value ?? "").trim(),
                }}
              />

              <PrimaryButton
                loading={isSavingMarca}
                loadingText="Guardando"
                appearance="login"
                type="submit"
                mt="4"
                size="lg"
                w="100%"
                marginBottom="2"
              >
                Guardar observación
              </PrimaryButton>
            </Form>
          ) : null
        }
      />
    </Layout>
  )
}
