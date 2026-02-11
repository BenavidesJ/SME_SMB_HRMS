import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Stack,
  Tabs,
  Wrap,
} from "@chakra-ui/react";
import { LuUser, LuUsers } from "react-icons/lu";
import { Layout } from "../../../components/layout";
import { Form, InputField } from "../../../components/forms";
import { Button } from "../../../components/general/button/Button";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useAuth } from "../../../context/AuthContext";
import { toTitleCase } from "../../../utils";
import type { EmployeeRow } from "../../../types";
import type { SolicitudesQuery } from "../../../types/Overtime";
import { ListaSolicitudes } from "./components";
import { FiltrosSolicitudes } from "./components/FiltrosSolicitudes";

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

type CreateRequestFormValues = {
  fecha_trabajo: string;
  horas_solicitadas: string;
  id_tipo_hx: string;
  justificacion: string;
};

type CollaboratorForm = { id_colaborador: string };

export const SolicitudHorasExtra = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const hasAdminPermission = useMemo(
    () => {
      const userRoles = user?.usuario?.roles ?? [];
      return userRoles.some((role) => role === "ADMINISTRADOR" || role === "SUPER_ADMIN");
    },
    [user]
  );

  const { data: tipoHx = [] } = useApiQuery<TipoHx[]>({ url: "mantenimientos/tipos-hora-extra" });
  const { data: employees = [], isLoading: isLoadingEmployees } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const { mutate: createHxRequest, isLoading: isSubmitting } = useApiMutation<TipoHxRequest, void>({
    url: "/horas-extra/solicitud",
    method: "POST",
  });

  const tipoHxOptions = useMemo(
    () => tipoHx.map((item) => ({ label: toTitleCase(item.nombre), value: String(item.id) })),
    [tipoHx]
  );

  const [myFilters, setMyFilters] = useState<SolicitudesQuery>({
    modo: "reciente",
    id_colaborador: userId ? Number(userId) : undefined,
  });
  const [othersFilters, setOthersFilters] = useState<SolicitudesQuery>({ modo: "reciente" });
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>("");

  useEffect(() => {
    if (userId) {
      setMyFilters((prev) => ({ ...prev, id_colaborador: Number(userId) }));
    }
  }, [userId]);

  useEffect(() => {
    setOthersFilters((prev) => ({
      ...prev,
      id_colaborador: selectedCollaboratorId ? Number(selectedCollaboratorId) : undefined,
    }));
  }, [selectedCollaboratorId]);

  const handleMyFiltersChange = useCallback(
    (next: SolicitudesQuery) => {
      setMyFilters({
        ...next,
        id_colaborador: userId ? Number(userId) : undefined,
      });
    },
    [userId]
  );

  const handleOthersFiltersChange = useCallback(
    (next: SolicitudesQuery) => {
      setOthersFilters({
        ...next,
        id_colaborador: selectedCollaboratorId ? Number(selectedCollaboratorId) : undefined,
      });
    },
    [selectedCollaboratorId]
  );

  const collaboratorOptions = useMemo(() => {
    return (employees ?? []).map((employee) => {
      const baseName = [employee.nombre, employee.primer_apellido, employee.segundo_apellido]
        .filter(Boolean)
        .join(" ")
        .trim();
      const label = baseName ? toTitleCase(baseName) : `Colaborador ${employee.id}`;
      return { label, value: String(employee.id) };
    });
  }, [employees]);

  const handleCreateRequest = async (solicitud: CreateRequestFormValues) => {
    const employeeId = user?.id;
    try {
      const payload: TipoHxRequest = {
        fecha_trabajo: solicitud.fecha_trabajo,
        horas_solicitadas: Number(solicitud.horas_solicitadas),
        id_tipo_hx: Number(solicitud.id_tipo_hx),
        justificacion: solicitud.justificacion,
        id_colaborador: Number(employeeId),
      };

      await createHxRequest(payload);

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleOtherCollaboratorSubmit = async (values: CollaboratorForm) => {
    setSelectedCollaboratorId(values.id_colaborador ?? "");
    return true;
  };

  return (
    <Layout pageTitle="Solicitudes de horas extra">
      <Grid templateColumns={{ base: "1fr", lg: "800px 1fr" }} gap={{ base: 4, lg: 6 }}>
        <GridItem>
          <Box bg="white" borderRadius="xl" boxShadow="md" p={6} h={{ base: "auto", lg: "full" }}>
            <Heading size="sm" mb={4}>
              Solicitudes registradas
            </Heading>

            <Tabs.Root variant="line" defaultValue="mine">
              <Tabs.List>
                <Tabs.Trigger value="mine">
                  <LuUser />
                  Mis solicitudes
                </Tabs.Trigger>
                {hasAdminPermission && (
                  <Tabs.Trigger value="others">
                    <LuUsers />
                    Otros colaboradores
                  </Tabs.Trigger>
                )}
              </Tabs.List>

              <Tabs.Content value="mine">
                <Stack gap={4} mt={4}>
                  <FiltrosSolicitudes value={myFilters} onChange={handleMyFiltersChange} />
                  <ListaSolicitudes filtros={myFilters} />
                </Stack>
              </Tabs.Content>

              {hasAdminPermission && (
                <Tabs.Content value="others">
                  <Stack gap={4} mt={4}>
                    <Form<CollaboratorForm>
                      onSubmit={handleOtherCollaboratorSubmit}
                      resetOnSuccess={false}
                      defaultValues={{ id_colaborador: selectedCollaboratorId }}
                    >
                      <Stack
                        direction={{ base: "column", md: "row" }}
                        gap={{ base: 1, md: 2 }}
                        align={{ base: "stretch", md: "flex-end" }}
                        flexWrap="wrap"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Box w={{ base: "100%", md: "200px" }}>
                          <InputField
                            fieldType="select"
                            label="Colaborador"
                            name="id_colaborador"
                            required
                            disableSelectPortal
                            placeholder={isLoadingEmployees ? "Cargando colaboradores..." : "Seleccione un colaborador"}
                            options={collaboratorOptions}
                            selectRootProps={{
                              disabled: isLoadingEmployees || collaboratorOptions.length === 0,
                            }}
                            rules={{ required: "El campo es obligatorio" }}
                          />
                        </Box>

                        <Box flex="1" minW={{ base: "100%", md: "260px" }}>
                          <FiltrosSolicitudes value={othersFilters} onChange={handleOthersFiltersChange} />
                        </Box>

                        <Box w={{ base: "100%", sm: "100px" }}>
                          <Button appearance="login" type="submit" size="lg" w="100%">
                            Consultar
                          </Button>
                        </Box>
                      </Stack>
                    </Form>

                    <ListaSolicitudes filtros={othersFilters} />
                  </Stack>
                </Tabs.Content>
              )}
            </Tabs.Root>
          </Box>
        </GridItem>

        <GridItem>
          <Box bg="white" borderRadius="xl" boxShadow="md" p={6}>
            <Heading size="sm" mb={4}>
              Registrar nueva solicitud
            </Heading>

            <Form<CreateRequestFormValues> onSubmit={handleCreateRequest} resetOnSuccess>
              <Wrap maxW="600px">
                <InputField
                  fieldType="date"
                  label="Fecha de realización"
                  name="fecha_trabajo"
                  required
                  rules={{ required: "El campo es obligatorio" }}
                />
                <InputField
                  fieldType="text"
                  label="Cantidad de horas"
                  name="horas_solicitadas"
                  required
                  rules={{
                    required: "El campo es obligatorio",
                    setValueAs: (value) => String(value ?? "").trim(),
                  }}
                />
                <InputField
                  fieldType="select"
                  label="Tipo de hora extra"
                  name="id_tipo_hx"
                  required
                  disableSelectPortal
                  placeholder={tipoHxOptions.length ? "Seleccione una opción" : "Cargando..."}
                  options={tipoHxOptions}
                  rules={{
                    required: "El campo es obligatorio",
                    setValueAs: (value) => String(value ?? "").trim(),
                  }}
                  selectRootProps={{ disabled: tipoHxOptions.length === 0 }}
                />
                <InputField
                  fieldType="text"
                  label="Justificación"
                  name="justificacion"
                  required
                  rules={{
                    required: "El campo es obligatorio",
                    setValueAs: (value) => String(value ?? "").trim(),
                  }}
                />
              </Wrap>

              <Box w={{ base: "100%", sm: "250px" }} mt={4}>
                <Button
                  loading={isSubmitting}
                  loadingText="Enviando"
                  appearance="login"
                  type="submit"
                  size="lg"
                  w="100%"
                >
                  Enviar solicitud
                </Button>
              </Box>
            </Form>
          </Box>
        </GridItem>
      </Grid>
    </Layout>
  );
};
