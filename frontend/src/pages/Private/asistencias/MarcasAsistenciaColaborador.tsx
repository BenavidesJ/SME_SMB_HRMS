import { useParams } from 'react-router';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { Layout } from "../../../components/layout";
import { DataTable } from '../../../components/general/table/DataTable';
import { useMemo } from 'react';
import type { DataTableColumn } from '../../../components/general/table/types';
import { Badge, HStack, Text, Button as ChakraButton } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useWeekPager } from '../../../hooks/useWeekPager';

// interface MarcaAsistencia {
//   identificacion: string,
//   tipo_marca: string,
//   timestamp: string
// }

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

export const MarcasAsistenciaColaborador = () => {
  const { id } = useParams<{ id: string }>();
  const { desde, hasta, label, goPrevWeek, goNextWeek, goToday } = useWeekPager();

  const marcasUrl = useMemo(() => {
    if (!id) return "";
    return `/asistencia/marcas?rango&identificacion=${encodeURIComponent(
      id,
    )}&desde=${desde}&hasta=${hasta}`;
  }, [id, desde, hasta]);

  const { data: marcasApi, isLoading: asistenciaLoading } = useApiQuery<any>({
    url: marcasUrl,
    enabled: Boolean(marcasUrl),
  });

  console.log(marcasApi)

  function mapMarcasToRows(apiData: any): MarcaEventoRow[] {
    const colab = apiData?.colaborador;
    const nombreCompleto = `${colab?.nombre ?? ""} ${colab?.primer_apellido ?? ""} ${colab?.segundo_apellido ?? ""}`.trim();

    const identificacion = colab?.identificacion ?? "";

    const marcas = apiData?.marcas ?? [];

    return marcas.flatMap((diaItem: any) => {
      const dia = diaItem.dia; // viene del backend
      const asistencia = diaItem.asistencia ?? [];

      return asistencia.map((m: any) => ({
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
        cell: (r) => dayjs(r.timestamp).format("YYYY-MM-DD HH:mm:ss"),
      },
      // opcional:
      {
        id: "observaciones",
        header: "Observaciones",
        minW: "220px",
        textAlign: "left",
        cell: (r) => <Text>{r.observaciones}</Text>,
      },
    ];
  }, []);

  const rows = useMemo(() => {
    if (!marcasApi) return [];
    return mapMarcasToRows(marcasApi);
  }, [marcasApi]);


  return (
    <Layout pageTitle={`Marcas de asistencia`}>

      <HStack justify="space-between" align="center" mt="6" mb="3">
        <HStack>
          <ChakraButton backgroundColor="brand.green.100" color="brand.text" _hover={{ backgroundColor: "brand.green.75" }} size="sm" onClick={goPrevWeek}>
            Semana anterior
          </ChakraButton>
          <ChakraButton backgroundColor="brand.green.100" color="brand.text" _hover={{ backgroundColor: "brand.green.75" }} size="sm" onClick={goToday}>
            Hoy
          </ChakraButton>
          <ChakraButton backgroundColor="brand.green.100" color="brand.text" _hover={{ backgroundColor: "brand.green.75" }} size="sm" onClick={goNextWeek}>
            Semana siguiente
          </ChakraButton>
        </HStack>

        <Badge variant="surface">
          {label}
        </Badge>
      </HStack>

      <DataTable<MarcaEventoRow>
        data={asistenciaLoading ? [] : rows}
        columns={columns}
        isDataLoading={asistenciaLoading}
        size="md"
      />
    </Layout>
  )
}
