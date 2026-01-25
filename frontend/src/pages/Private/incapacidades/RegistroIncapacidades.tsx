import { Box, SimpleGrid } from "@chakra-ui/react";
import { Form, InputField } from "../../../components/forms";
import { Layout } from "../../../components/layout";
import { Button } from "../../../components/general/button/Button";
import { useAuth } from "../../../context/AuthContext";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useCallback, useMemo } from "react";
import { toTitleCase } from "../../../utils";
import { useApiMutation } from "../../../hooks/useApiMutations";

interface TipoIncapacidad {
  id: number;
  nombre: string;
  descripcion: string;
}

interface Incapacidad {
  id_colaborador: number;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_incap: string;
}


export const RegistroIncapacidades = () => {
  const { user } = useAuth();
  const userID = user?.id;

  const { data: tipoIncapacidad = [] } = useApiQuery<TipoIncapacidad[]>({ url: "incapacidades/tipos" });
  const { mutate: createIncapacidad, isLoading: isSubmitting } = useApiMutation<Incapacidad, void>({ url: "/incapacidades", method: "POST" });


  const tipoToOptions = useCallback(
    (items: TipoIncapacidad[]) => items.map((v) => ({ label: toTitleCase(v.nombre), value: v.nombre })),
    [],
  );

  const IncapacidadOptions = useMemo(
    () => tipoToOptions(tipoIncapacidad),
    [tipoIncapacidad, tipoToOptions],
  );

  const handleCreateRequest = async (incapacidad: Incapacidad) => {
    try {
      const payload = {
        ...incapacidad,
        id_colaborador: userID,
      }

      await createIncapacidad(payload);

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  return (
    <Layout pageTitle="Registro Incapacidades">
      <Form onSubmit={handleCreateRequest} resetOnSuccess >
        <SimpleGrid columns={{ base: 2, md: 3 }} gapX="1rem">
          <InputField
            fieldType="date"
            label="Fecha de Inicio de la Incapacidad"
            name="fecha_inicio"
            required
            rules={{ required: "El campo es obligatorio" }}
          />
          <InputField
            fieldType="date"
            label="Fecha de Finalización de la Incapacidad"
            name="fecha_fin"
            required
            rules={{ required: "El campo es obligatorio" }}
          />
          <InputField
            fieldType="select"
            label="Tipo de Incapacidad"
            name="tipo_incap"
            required
            disableSelectPortal
            placeholder={tipoIncapacidad.length ? "Seleccione una opción" : "Cargando..."}
            options={IncapacidadOptions}
            rules={{ required: "El campo es obligatorio", setValueAs: (v) => String(v ?? "").trim(), }}
            selectRootProps={{ disabled: tipoIncapacidad.length === 0 }}
          />
        </SimpleGrid>

        <Box w="250px" alignContent="center">
          <Button
            loading={isSubmitting}
            loadingText="Enviando"
            appearance="login"
            type="submit"
            mt="4"
            size="lg"
            w="100%"
            marginBottom="5"
          >
            Enviar Solicitud
          </Button>
        </Box>
      </Form>
    </Layout>
  )
}
