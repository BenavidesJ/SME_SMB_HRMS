/* eslint-disable no-unused-vars */
import { useMemo, useState, useEffect, useCallback } from "react";
import { Badge, HStack, Text, Button as ChakraButton, Box, VStack } from "@chakra-ui/react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { Layout } from "../../../components/layout";
import { DataTable } from "../../../components/general/table/DataTable";
import type { DataTableColumn } from "../../../components/general/table/types";
import { useWeekPager } from "../../../hooks/useWeekPager";
import { Form } from "../../../components/forms/Form/Form";
import { InputField } from "../../../components/forms/InputField/InputField";
import { useAuth } from "../../../context/AuthContext";
import { useWatch } from "react-hook-form";
import { onlyDigitsMax } from "../../../utils";

const IDENTIFICATION_MAX_DIGITS = 12;

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("es");

type MarcaDiaRow = {
  id: string;
  identificacion: string;
  dia: string;
  horaEntrada: string | null;
  horaSalida: string | null;
};

type RegistrarMarcaPayload = {
  identificacion: string;
  tipo_marca: "ENTRADA" | "SALIDA";
  timestamp: string;
};

type RegistrarMarcaResponse = {
  id_marca: number;
  tipo_marca: "ENTRADA" | "SALIDA";
  timestamp: string;
  jornada: {
    fecha: string;
    horas_ordinarias: number;
    entrada: string | null;
    salida: string | null;
  };
};

type MarcaRegistroApi = {
  id_marca: number;
  timestamp: string;
  tipo_marca?: string | null;
  TipoMarca?: {
    nombre?: string | null;
  };
};

type MarcaDiaApi = {
  dia: string;
  asistencia: MarcaRegistroApi[];
};

type ColaboradorResumen = {
  id_colaborador: number;
  identificacion: string | number;
  nombre?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
};

type MarcasApiResponse = {
  colaborador: ColaboradorResumen | null;
  marcas: MarcaDiaApi[];
};

type MarcasFormValues = {
  identificacion: string;
};

const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

const formatClockText = (source: dayjs.Dayjs) => {
  const localized = source.locale("es");
  const dayName = capitalize(localized.format("dddd"));
  const dayNumber = localized.format("D");
  const monthName = capitalize(localized.format("MMMM"));
  const year = localized.format("YYYY");
  const time = localized.format("h:mm a");
  return `${dayName} ${dayNumber} de ${monthName} de ${year}, ${time}`;
};

const formatDayLabel = (dateStr: string) => {
  const localized = dayjs(dateStr).locale("es");
  const dayName = capitalize(localized.format("dddd"));
  const dayNumber = localized.format("D");
  const monthName = localized.format("MMMM");
  return `${dayName} ${dayNumber} de ${monthName}`;
};

const formatTimeCR = (timestamp: string) =>
  dayjs
    .utc(timestamp)
    .tz("America/Costa_Rica")
    .format("h:mm a");

const getTipo = (registro: MarcaRegistroApi) => String((registro.tipo_marca ?? registro.TipoMarca?.nombre) ?? "").toUpperCase();

export const MarcasAsistencia = () => {
  const { user } = useAuth();

  const loggedId = useMemo(
    () => onlyDigitsMax(user?.identificacion, IDENTIFICATION_MAX_DIGITS),
    [user?.identificacion],
  );

  const [clockText, setClockText] = useState(() => formatClockText(dayjs()));
  const [tipoEnProceso, setTipoEnProceso] = useState<"ENTRADA" | "SALIDA" | null>(null);

  useEffect(() => {
    const tick = () => setClockText(formatClockText(dayjs()));
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const { desde, hasta, label, goPrevWeek, goNextWeek, goToday } = useWeekPager();

  const marcasUrl = useMemo(() => {
    if (!loggedId) return "";
    const params = new URLSearchParams({ identificacion: loggedId, desde, hasta });
    return `/asistencia/marcas?${params.toString()}`;
  }, [loggedId, desde, hasta]);

  const { data: marcasData, isLoading: marcasLoading, refetch: refetchMarcas, setData: setMarcasData } =
    useApiQuery<MarcasApiResponse | null>({
      url: marcasUrl,
      enabled: Boolean(marcasUrl),
      initialData: null,
    });

  const { mutate: registrarMarca } = useApiMutation<RegistrarMarcaPayload, RegistrarMarcaResponse>({
    url: "/asistencia/marca",
    method: "POST",
  });

  const nombreColaborador = useMemo(() => {
    const colab = marcasData?.colaborador;
    if (!colab) return "";
    return `${colab.nombre ?? ""} ${colab.primer_apellido ?? ""} ${colab.segundo_apellido ?? ""}`.trim();
  }, [marcasData]);

  const rows = useMemo<MarcaDiaRow[]>(() => {
    if (!marcasData) return [];

    const identificacionColab = marcasData.colaborador
      ? String(marcasData.colaborador.identificacion)
      : loggedId;

    const marcas = Array.isArray(marcasData.marcas) ? marcasData.marcas : [];

    return marcas.map((diaItem) => {
      const asistenciaDia = Array.isArray(diaItem.asistencia) ? diaItem.asistencia : [];

      const entradaRegistro = asistenciaDia.find((r) => getTipo(r) === "ENTRADA");
      const salidaRegistro = [...asistenciaDia].reverse().find((r) => getTipo(r) === "SALIDA");

      return {
        id: String(diaItem.dia),
        identificacion: identificacionColab,
        dia: formatDayLabel(String(diaItem.dia)),
        horaEntrada: entradaRegistro ? formatTimeCR(entradaRegistro.timestamp) : null,
        horaSalida: salidaRegistro ? formatTimeCR(salidaRegistro.timestamp) : null,
      };
    });
  }, [marcasData, loggedId]);

  const updateMarcasConSalida = useCallback(
    (response: RegistrarMarcaResponse) => {
      setMarcasData((prev) => {
        if (!prev) return prev;

        const fecha = response.jornada.fecha;
        const salida = response.jornada.salida;
        if (!salida) return prev;

        let diaActualizado = false;

        const updatedMarcas = prev.marcas.map((diaItem) => {
          if (diaItem.dia !== fecha) return diaItem;
          diaActualizado = true;

          const asistenciaActualizada = diaItem.asistencia.map((registro) => {
            if (getTipo(registro) !== "SALIDA") return registro;
            return { ...registro, timestamp: salida, tipo_marca: "SALIDA" };
          });

          const tieneSalida = asistenciaActualizada.some((r) => getTipo(r) === "SALIDA");
          if (!tieneSalida) {
            asistenciaActualizada.push({ id_marca: response.id_marca, timestamp: salida, tipo_marca: "SALIDA" });
          }

          return { ...diaItem, asistencia: asistenciaActualizada };
        });

        if (!diaActualizado) {
          updatedMarcas.push({
            dia: fecha,
            asistencia: [{ id_marca: response.id_marca, timestamp: salida, tipo_marca: "SALIDA" }],
          });
        }

        updatedMarcas.sort((a, b) => (a.dia < b.dia ? -1 : a.dia > b.dia ? 1 : 0));

        return { ...prev, marcas: updatedMarcas };
      });
    },
    [setMarcasData],
  );

  const handleRegistrarMarca = useCallback(
    async (tipo: "ENTRADA" | "SALIDA", identificacionIngresada: string) => {
      const identificacionDestino = onlyDigitsMax(
        identificacionIngresada || loggedId,
        IDENTIFICATION_MAX_DIGITS,
      );
      if (!identificacionDestino) return;

      setTipoEnProceso(tipo);
      try {
        const response = await registrarMarca({
          identificacion: identificacionDestino,
          tipo_marca: tipo,
          timestamp: new Date().toISOString(),
        });

        // Mantengo tu intención original:
        // - Entrada: refetch (para recalcular y traer el día completo)
        // - Salida: si hay data, patch local; si no, refetch
        if (tipo === "ENTRADA") {
          if (marcasUrl) await refetchMarcas();
          return;
        }

        if (!response) return;

        if (!marcasData) {
          if (marcasUrl) await refetchMarcas();
        } else {
          updateMarcasConSalida(response);
        }
      } finally {
        setTipoEnProceso(null);
      }
    },
    [loggedId, registrarMarca, marcasUrl, refetchMarcas, marcasData, updateMarcasConSalida],
  );

  const columns = useMemo<DataTableColumn<MarcaDiaRow>[]>(
    () => [
      {
        id: "dia",
        header: "Día",
        minW: "160px",
        textAlign: "center",
        cell: (row) => row.dia,
      },
      {
        id: "horaEntrada",
        header: "Hora Entrada",
        minW: "160px",
        textAlign: "center",
        cell: (row) => (
          <Box px="2" py="1" rounded="md" bg={row.horaEntrada ? "transparent" : "red.50"}>
            {row.horaEntrada ?? "Sin registro"}
          </Box>
        ),
      },
      {
        id: "horaSalida",
        header: "Hora Salida",
        minW: "160px",
        textAlign: "center",
        cell: (row) => (
          <Box px="2" py="1" rounded="md" bg={row.horaSalida ? "transparent" : "red.50"}>
            {row.horaSalida ?? "Sin registro"}
          </Box>
        ),
      },
    ],
    [],
  );

  return (
    <Layout pageTitle="Marcas de asistencia">
      <Form<MarcasFormValues>
        defaultValues={{ identificacion: loggedId }}
        onSubmit={async () => true}
        formOptions={{ mode: "onChange" }}
      >
        <FormContent
          clockText={clockText}
          nombreColaborador={nombreColaborador}
          label={label}
          goPrevWeek={goPrevWeek}
          goNextWeek={goNextWeek}
          goToday={goToday}
          tipoEnProceso={tipoEnProceso}
          loggedId={loggedId}
          onRegistrarMarca={handleRegistrarMarca}
        />
      </Form>

      <DataTable<MarcaDiaRow> data={marcasLoading ? [] : rows} columns={columns} isDataLoading={marcasLoading} size="md" />
    </Layout>
  );
};

type FormContentProps = {
  clockText: string;
  nombreColaborador: string;
  label: string;
  goPrevWeek: () => void;
  goNextWeek: () => void;
  goToday: () => void;
  tipoEnProceso: "ENTRADA" | "SALIDA" | null;
  loggedId: string;
  onRegistrarMarca: (tipo: "ENTRADA" | "SALIDA", identificacionIngresada: string) => void;
};

const FormContent = ({
  clockText,
  nombreColaborador,
  label,
  goPrevWeek,
  goNextWeek,
  goToday,
  tipoEnProceso,
  loggedId,
  onRegistrarMarca,
}: FormContentProps) => {
  const identificacionForm = useWatch({ name: "identificacion" }) as string;
  const identificacionIngresada = String(identificacionForm ?? "").trim();

  const identificacionValida = Boolean(identificacionIngresada.length) && identificacionIngresada === loggedId;

  return (
    <VStack align="stretch" mt="6">
      <Text fontSize="lg" fontWeight="medium">
        {clockText}
      </Text>

      {nombreColaborador && <Text color="gray.600">Colaborador: {nombreColaborador}</Text>}

      <HStack flexWrap="wrap" align="flex-start" justifyItems="center" alignItems="center">
        <Box css={{ "& > div": { minWidth: "20ch", maxWidth: "20ch", width: "20ch" } }}>
          <InputField
            fieldType="text"
            name="identificacion"
            placeholder="Cédula o DIMEX"
            label="Identificación"
            size="sm"
            required
            numericOnly
            maxDigits={IDENTIFICATION_MAX_DIGITS}
            rules={{
              required: "El campo es obligatorio",
              pattern: { value: /^\d+$/, message: "Solo se permiten números." },
              maxLength: { value: IDENTIFICATION_MAX_DIGITS, message: "Máximo 12 dígitos" },
              validate: (value: string) =>
                String(value ?? "").trim() === loggedId ||
                "Debe coincidir con tu identificación.",
            }}
          />
        </Box>

        <HStack display="flex" alignContent="center" justifyContent="center">
          <ChakraButton
            type="button"
            colorPalette="blue"
            size="sm"
            onClick={() => onRegistrarMarca("ENTRADA", identificacionIngresada)}
            disabled={!identificacionValida || Boolean(tipoEnProceso)}
            loading={tipoEnProceso === "ENTRADA"}
          >
            Entrada
          </ChakraButton>

          <ChakraButton
            type="button"
            colorPalette="teal"
            _hover={{ backgroundColor: "brand.green.75" }}
            size="sm"
            onClick={() => onRegistrarMarca("SALIDA", identificacionIngresada)}
            disabled={!identificacionValida || Boolean(tipoEnProceso)}
            loading={tipoEnProceso === "SALIDA"}
          >
            Salida
          </ChakraButton>
        </HStack>
      </HStack>

      <VStack align="flex-start" gap="2" mb="1rem">
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

    </VStack>
  );
};
