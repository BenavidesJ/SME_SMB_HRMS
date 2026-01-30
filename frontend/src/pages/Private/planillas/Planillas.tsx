import {
  Badge,
  Button,
  Card,
  EmptyState,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Layout } from "../../../components/layout";
import { FiFilePlus } from "react-icons/fi";
import { PiMoney } from "react-icons/pi";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { Form } from "../../../components/forms/Form/Form";
import { InputField } from "../../../components/forms/InputField/InputField";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";

interface PeriodoPlanilla {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  id_ciclo_pago: number;
  estado: string;
  descripcion: string;
}

type CreatePeriodoFormValues = {
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  id_ciclo_pago: number;
};

export const Planillas = () => {
  const { data: payrollPeriods = [], isLoading: isTableLoading, refetch } =
    useApiQuery<PeriodoPlanilla[]>({ url: "planillas/periodo_planilla" });

  const { mutate: createPeriod, isLoading: isCreating } =
    useApiMutation<CreatePeriodoFormValues, void>({
      url: "planillas/periodo_planilla",
      method: "POST",
    });

  const [showCreateCard, setShowCreateCard] = useState(false);
  const navigate = useNavigate();

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CR", {
        dateStyle: "medium",
      }),
    [],
  );

  const renderDate = useCallback(
    (value: string) => {
      if (!value) return "Sin definir";
      const parsed = new Date(`${value}T00:00:00`);
      return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
    },
    [dateFormatter],
  );

  const handleCreatePeriod = async (values: CreatePeriodoFormValues) => {
    try {
      await createPeriod({
        ...values,
        id_ciclo_pago: Number(values.id_ciclo_pago),
        descripcion: "N/A",
      });
      await refetch();
      setShowCreateCard(false);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  return (
    <Layout pageTitle="Generación y gestión de planillas">
      <Stack gap="6">
        <Button
          colorPalette="blue"
          alignSelf="flex-start"
          onClick={() => setShowCreateCard((prev) => !prev)}
        >
          <FiFilePlus /> {showCreateCard ? "Cerrar formulario" : "Crear periodo de planilla"}
        </Button>

        {showCreateCard && (
          <Form<CreatePeriodoFormValues> onSubmit={handleCreatePeriod} resetOnSuccess>
            <Card.Root as="section" maxW="lg">
              <Card.Header>
                <Card.Title>Nuevo periodo de planilla</Card.Title>
                <Card.Description>
                  Define las fechas y el ciclo asociado.
                </Card.Description>
              </Card.Header>
              <Card.Body>
                <Stack gap="4">
                  <InputField
                    name="fecha_inicio"
                    label="Fecha de inicio"
                    fieldType="date"
                    required
                  />
                  <InputField
                    name="fecha_fin"
                    label="Fecha de fin"
                    fieldType="date"
                    required
                  />
                  <InputField
                    name="fecha_pago"
                    label="Fecha de pago"
                    fieldType="date"
                    required
                  />
                  <InputField
                    name="id_ciclo_pago"
                    label="ID de ciclo de pago"
                    fieldType="number"
                    required
                    helperText="Ingrese el identificador del ciclo correspondiente."
                  />
                </Stack>
              </Card.Body>
              <Card.Footer justifyContent="flex-end" gap="3">
                <Button type="button" variant="outline" onClick={() => setShowCreateCard(false)}>
                  Cancelar
                </Button>
                <Button type="submit" colorPalette="blue" loading={isCreating}>
                  Guardar periodo
                </Button>
              </Card.Footer>
            </Card.Root>
          </Form>
        )}

        {isTableLoading ? (
          <Spinner alignSelf="center" size="lg" />
        ) : payrollPeriods.length === 0 ? (
          <EmptyState.Root
            colorPalette="blue"
            h="400px"
            border="0.15rem dashed"
            borderColor="blue.600"
            alignContent="center"
            mt="1rem"
          >
            <EmptyState.Content>
              <EmptyState.Indicator>
                <PiMoney />
              </EmptyState.Indicator>
              <Stack textAlign="center" gap="2">
                <EmptyState.Title>
                  Aún no existen periodos de planilla registrados.
                </EmptyState.Title>
                <EmptyState.Description>
                  Empieza creando un periodo de planillas.
                </EmptyState.Description>
              </Stack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="5">
            {payrollPeriods.map((period) => (
              <Card.Root
                key={period.id}
                cursor="pointer"
                transition="transform 150ms ease"
                _hover={{ transform: "scale(1.01)" }}
                onClick={() => navigate(`planillas/periodo_planilla/${period.id}`)}
              >
                <Card.Header>
                  <Card.Title>Periodo planilla de {renderDate(period.fecha_inicio)} - {renderDate(period.fecha_fin)}</Card.Title>
                  <Card.Description>

                  </Card.Description>
                </Card.Header>
                <Card.Body>
                  <Stack gap="3">
                    <Stack gap="0">
                      <Text textStyle="sm" color="fg.muted">
                        Fecha de pago
                      </Text>
                      <Text fontWeight="medium">{renderDate(period.fecha_pago)}</Text>
                    </Stack>
                    <Stack gap="0">
                      <Text textStyle="sm" color="fg.muted">
                        Ciclo de pago
                      </Text>
                      <Text fontWeight="medium">#{period.id_ciclo_pago}</Text>
                    </Stack>
                    <Stack gap="0">
                      <Text textStyle="sm" color="fg.muted">
                        Descripción
                      </Text>
                      <Text>{period.descripcion || "Sin descripción"}</Text>
                    </Stack>
                  </Stack>
                </Card.Body>
                <Card.Footer justifyContent="space-between" alignItems="center">
                  <Badge colorPalette={period.estado === "ACTIVO" ? "green" : "gray"}>
                    {period.estado}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      refetch();
                    }}
                  >
                    Actualizar
                  </Button>
                </Card.Footer>
              </Card.Root>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Layout>
  );
};
