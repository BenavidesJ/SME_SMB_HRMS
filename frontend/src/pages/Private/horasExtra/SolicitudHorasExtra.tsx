import { Box, SimpleGrid } from '@chakra-ui/react';
import { Form, InputField } from '../../../components/forms'
import { Layout } from '../../../layouts'
import { Button } from '../../../components/general/button/Button';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { useCallback, useMemo } from 'react';
import { toTitleCase } from '../../../utils';
import { useApiMutation } from '../../../hooks/useApiMutations';
import { useAuth } from '../../../context/AuthContext';

interface TipoHx {
  id: number;
  nombre: string;
  descripcion: string;
  multiplicador: string;
}

interface TipoHxRequest {
  id_colaborador: number;
  fecha_trabajo: string;
  horas_solicitadas: number;
  id_tipo_hx: number;
  justificacion: string;
}

export const SolicitudHorasExtra = () => {
  const { user } = useAuth();
  const { data: tipoHx = [] } = useApiQuery<TipoHx[]>({ url: "/horas-extra/tipos" });
  const { mutate: createHxRequest, isLoading: isSubmitting } = useApiMutation<TipoHxRequest, void>({ url: "/horas-extra/solicitud", method: "POST" });

  const tipoHxToOptions = useCallback(
    (items: TipoHx[]) => items.map((v) => ({ label: toTitleCase(v.nombre), value: v.id })),
    [],
  );

  const tipoHxOptions = useMemo(() => tipoHxToOptions(tipoHx), [tipoHx, tipoHxToOptions]);

  const handleCreateRequest = async (solicitud: TipoHxRequest) => {
    const employeeId = user?.id;
    try {
      const payload: TipoHxRequest = {
        ...solicitud,
        horas_solicitadas: Number(solicitud.horas_solicitadas),
        id_colaborador: Number(employeeId),
      };

      await createHxRequest(payload);

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  return (
    <Layout pageTitle="Solicitudes">
      <Form onSubmit={handleCreateRequest} resetOnSuccess >
        <SimpleGrid columns={{ base: 2, md: 3 }} gapX="1rem">
          <InputField
            fieldType="date"
            label="Fecha de Realización de las Horas Extra"
            name="fecha_trabajo"
            required
            rules={{ required: "El campo es obligatorio" }}
          />
          <InputField
            fieldType="text"
            label="Cantidad de Horas a Realizar"
            name="horas_solicitadas"
            required
            rules={{
              required: "El campo es obligatorio",
              setValueAs: (v) => String(v ?? "").trim(),
            }}
          />
          <InputField
            fieldType="select"
            label="Tipo de Hora Extra"
            name="id_tipo_hx"
            required
            disableSelectPortal
            placeholder={tipoHx.length ? "Seleccione una opción" : "Cargando..."}
            options={tipoHxOptions}
            rules={{ required: "El campo es obligatorio", setValueAs: (v) => String(v ?? "").trim(), }}
            selectRootProps={{ disabled: tipoHx.length === 0 }}
          />
          <InputField
            fieldType="text"
            label="Justificación"
            name="justificacion"
            required
            rules={{
              required: "El campo es obligatorio",
              setValueAs: (v) => String(v ?? "").trim(),
            }}
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
