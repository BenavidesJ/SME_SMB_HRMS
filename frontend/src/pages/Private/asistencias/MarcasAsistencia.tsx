import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Badge, Button as ChakraButton, HStack, Text, Wrap } from "@chakra-ui/react";
import { Layout } from "../../../components/layout";
import { Form, InputField } from "../../../components/forms";
import { Button } from "../../../components/general/button/Button";
import { DataTable } from "../../../components/general/table/DataTable";
import type { DataTableColumn } from "../../../components/general/table/types";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useWeekPager } from "../../../hooks/useWeekPager";
import { useAuth } from "../../../context/AuthContext";
import { showToast } from "../../../services/toast/toastService";

interface MarcaAsistencia {
  identificacion: string;
  tipo_marca: string;
  timestamp: string;
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

export const MarcasAsistencia = () => {
  const { user } = useAuth();
  const [check, setCheck] = useState<string>("");
  const [identificacionActual, setIdentificacionActual] = useState<string | number | undefined>(user?.identificacion);

  const { desde, hasta, label, goPrevWeek, goNextWeek, goToday } = useWeekPager();

  const { data: tiposMarca = [] } = useApiQuery<{ id: number; tipo: string }[]>({
    url: "/asistencia/tipos_marca",
  });

  const marcasUrl = useMemo(() => {
    if (!identificacionActual) return "";
    return `/asistencia/marcas?rango&identificacion=${encodeURIComponent(
      identificacionActual,
    )}&desde=${desde}&hasta=${hasta}`;
  }, [identificacionActual, desde, hasta]);

  const { data: marcasApi, isLoading: asistenciaLoading, refetch } = useApiQuery<any>({
    url: marcasUrl,
    enabled: Boolean(marcasUrl),
  });

  const { mutate: makeCheck, isLoading: isSubmitting } = useApiMutation<MarcaAsistencia, void>({
    url: "/asistencia/marca",
    method: "POST",
  });

  function mapMarcasToRows(apiData: any): MarcaEventoRow[] {
    const colab = apiData?.colaborador;
    const nombreCompleto = `${colab?.nombre ?? ""} ${colab?.primer_apellido ?? ""} ${colab?.segundo_apellido ?? ""}`.trim();
    const identificacion = colab?.identificacion ?? "";

    const marcas = apiData?.marcas ?? [];
    return marcas.flatMap((diaItem: any) => {
      const dia = diaItem.dia;
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

  const rows = useMemo(() => mapMarcasToRows(marcasApi), [marcasApi]);

  const normalizeIdentificacion = (v: unknown) => String(v ?? "").trim();
  const loggedId = normalizeIdentificacion(user?.identificacion);

  const handleMakeCheck = async (form: { identificacion: string }) => {
    try {
      const inputId = normalizeIdentificacion(form.identificacion);


      if (inputId !== loggedId) {
        showToast("La identificación no coincide con la del usuario logueado. No se puede registrar marcas en nombre de otro usuario.", "error");
        return false;
      }

      if (!check) {
        showToast("Selecciona el tipo de marca.", "error");
        return false;
      }

      setIdentificacionActual(String(form.identificacion ?? "").trim());

      const payload: MarcaAsistencia = {
        identificacion: inputId,
        tipo_marca: check,
        timestamp: new Date().toISOString(),
      };

      await makeCheck(payload);
      await refetch();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const columns = useMemo<DataTableColumn<MarcaEventoRow>[]>(() => {
    return [
      { id: "identificacion", header: "Identificación", minW: "140px", textAlign: "center", cell: (r) => String(r.identificacion) },
      { id: "nombre_completo", header: "Nombre completo", minW: "260px", textAlign: "left", cell: (r) => r.nombre_completo },
      { id: "dia", header: "Día", minW: "130px", textAlign: "center", cell: (r) => r.dia },
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
      { id: "observaciones", header: "Observaciones", minW: "220px", textAlign: "left", cell: (r) => <Text>{r.observaciones}</Text> },
    ];
  }, []);

  return (
    <Layout pageTitle="Realizar Marcas de Asistencia">
      <Form onSubmit={handleMakeCheck} resetOnSuccess>
        <InputField
          fieldType="text"
          label="Cédula o DIMEX"
          name="identificacion"
          required
          rules={{
            required: "El campo es obligatorio",
            pattern: { value: /^\d+$/, message: "Solo se permiten números." },
            validate: (value: string) =>
              String(value ?? "").trim() === loggedId || "Debe coincidir con tu identificación. No se puede registrar marcas en nombre de otro usuario.",
          }}
        />

        <Wrap w="500px" alignContent="center" direction="row">
          {tiposMarca.map((tm) => (
            <Button
              key={`${tm.id}-${tm.tipo}`}
              loading={isSubmitting}
              loadingText="Agregando"
              appearance="login"
              type="submit"
              mt="4"
              size="lg"
              marginBottom="5"
              onClick={() => setCheck(tm.tipo)}
            >
              {tm.tipo}
            </Button>
          ))}
        </Wrap>
      </Form>

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
  );
};
