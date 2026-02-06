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
import { FiEdit2, FiFilePlus, FiTrash2 } from "react-icons/fi";
import { PiMoney } from "react-icons/pi";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { Form } from "../../../components/forms/Form/Form";
import { InputField } from "../../../components/forms/InputField/InputField";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { showToast } from "../../../services/toast/toastService";

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
  id_ciclo_pago: string;
};

type CicloPagoOption = {
  id: number;
  ciclo_pago: string;
};

type PersistPeriodoPayload = {
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  id_ciclo_pago: number;
};

export const Planillas = () => {
  const { data: payrollPeriods = [], isLoading: isTableLoading, refetch } =
    useApiQuery<PeriodoPlanilla[]>({ url: "planillas/periodo_planilla" });

  const { mutate: createPeriod, isLoading: isCreating } =
    useApiMutation<PersistPeriodoPayload, void>({
      url: "planillas/periodo_planilla",
      method: "POST",
    });

  const { mutate: updatePeriod, isLoading: isUpdating } =
    useApiMutation<PersistPeriodoPayload, void, number>({
      url: (id) => `planillas/periodo_planilla/${id}`,
      method: "PATCH",
    });

  const { mutate: deletePeriod, isLoading: isDeleting } =
    useApiMutation<undefined, void, number>({
      url: (id) => `planillas/periodo_planilla/${id}`,
      method: "DELETE",
    });

  const { data: cycles = [], isLoading: isLoadingCycles } =
    useApiQuery<CicloPagoOption[]>({ url: "mantenimientos/ciclos-pago" });

  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PeriodoPlanilla | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
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

  const cycleOptions = useMemo(
    () =>
      cycles.map((cycle) => ({
        label: cycle.ciclo_pago,
        value: String(cycle.id),
      })),
    [cycles],
  );

  const cycleMap = useMemo(() => {
    const map = new Map<number, string>();
    cycles.forEach((cycle) => {
      map.set(cycle.id, cycle.ciclo_pago);
    });
    return map;
  }, [cycles]);

  const defaultFormValues = useMemo<CreatePeriodoFormValues>(
    () =>
      editingPeriod
        ? {
          fecha_inicio: editingPeriod.fecha_inicio,
          fecha_fin: editingPeriod.fecha_fin,
          fecha_pago: editingPeriod.fecha_pago,
          id_ciclo_pago: String(editingPeriod.id_ciclo_pago),
        }
        : {
          fecha_inicio: "",
          fecha_fin: "",
          fecha_pago: "",
          id_ciclo_pago: cycleOptions[0]?.value ?? "",
        },
    [editingPeriod, cycleOptions],
  );

  const handleSubmitPeriod = async (values: CreatePeriodoFormValues) => {
    if (!values.id_ciclo_pago) {
      showToast("Seleccione un ciclo de pago.", "error");
      return false;
    }

    try {
      const payload: PersistPeriodoPayload = {
        fecha_inicio: values.fecha_inicio,
        fecha_fin: values.fecha_fin,
        fecha_pago: values.fecha_pago,
        id_ciclo_pago: Number(values.id_ciclo_pago),
      };

      if (editingPeriod) {
        await updatePeriod(editingPeriod.id, payload);
        showToast("Periodo de planilla actualizado.", "success");
      } else {
        await createPeriod(payload);
        showToast("Periodo de planilla creado.", "success");
      }

      await refetch();
      setShowForm(false);
      setEditingPeriod(null);
      return true;
    } catch (error) {
      console.log(error);
      showToast(
        "No se pudo guardar el periodo. Revise la información e intente nuevamente.",
        "error",
      );
      return false;
    }
  };

  const handleStartCreate = () => {
    setEditingPeriod(null);
    setShowForm((prev) => !prev);
  };

  const handleEditPeriod = (period: PeriodoPlanilla) => {
    setEditingPeriod(period);
    setShowForm(true);
  };

  const handleDeletePeriod = async (period: PeriodoPlanilla) => {
    const confirmed = window.confirm(
      `¿Desea eliminar el periodo del ${renderDate(period.fecha_inicio)} al ${renderDate(period.fecha_fin)}?`,
    );
    if (!confirmed) return;

    try {
      setPendingDeleteId(period.id);
      await deletePeriod(period.id, undefined);
      await refetch();
      showToast("Periodo eliminado.", "success");
    } catch (error) {
      console.log(error);
      showToast("No se pudo eliminar el periodo.", "error");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <Layout pageTitle="Generación y gestión de planillas">
      <Stack gap="6">
        <Button
          colorPalette="blue"
          alignSelf="flex-start"
          onClick={handleStartCreate}
        >
          <FiFilePlus />
          {showForm && !editingPeriod ? " Cerrar formulario" : " Crear periodo de planilla"}
        </Button>

        {showForm && (
          <Form<CreatePeriodoFormValues>
            key={editingPeriod ? `edit-${editingPeriod.id}` : "create"}
            onSubmit={handleSubmitPeriod}
            defaultValues={defaultFormValues}
            resetOnSuccess={!editingPeriod}
          >
            <Card.Root as="section" maxW="lg">
              <Card.Header>
                <Card.Title>
                  {editingPeriod ? "Editar periodo de planilla" : "Nuevo periodo de planilla"}
                </Card.Title>
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
                    label="Ciclo de pago"
                    fieldType="select"
                    required
                    options={cycleOptions}
                    placeholder={
                      cycleOptions.length === 0
                        ? isLoadingCycles
                          ? "Cargando ciclos..."
                          : "Sin ciclos disponibles"
                        : "Seleccione un ciclo de pago"
                    }
                    selectRootProps={{
                      disabled: cycleOptions.length === 0,
                    }}
                  />
                </Stack>
              </Card.Body>
              <Card.Footer justifyContent="flex-end" gap="3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPeriod(null);
                  }}
                >
                  {editingPeriod ? "Cancelar edición" : "Cancelar"}
                </Button>
                <Button
                  type="submit"
                  colorPalette="blue"
                  loading={isSaving}
                  disabled={cycleOptions.length === 0 || isSaving}
                >
                  {editingPeriod ? "Guardar cambios" : "Guardar periodo"}
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
                onClick={() => navigate(`/planillas/periodo_planilla/${period.id}`)}
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
                      <Text fontWeight="medium">
                        {cycleMap.get(period.id_ciclo_pago) ?? `#${period.id_ciclo_pago}`}
                      </Text>
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
                  <Stack direction="row" gap="2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEditPeriod(period);
                      }}
                    >
                      <FiEdit2 /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      colorPalette="red"
                      onClick={async (event) => {
                        event.stopPropagation();
                        await handleDeletePeriod(period);
                      }}
                      loading={isDeleting && pendingDeleteId === period.id}
                    >
                      <FiTrash2 /> Eliminar
                    </Button>
                  </Stack>
                </Card.Footer>
              </Card.Root>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Layout>
  );
};
