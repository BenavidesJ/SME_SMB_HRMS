import { Box, Wrap, Grid, GridItem, Heading, Stack, Text, ScrollArea, Tabs } from "@chakra-ui/react";
import { Form, InputField } from "../../../components/forms";
import { Layout } from "../../../components/layout";
import { Button } from "../../../components/general/button/Button";
import { useAuth } from "../../../context/AuthContext";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useCallback, useMemo, useState, useEffect } from "react";
import { toTitleCase } from "../../../utils";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { EmptyStateIndicator } from "../../../components/general";
import { AppLoader } from "../../../components/layout/loading";
import type { EmployeeRow, EmployeeUserInfo } from "../../../types";
import { LuUser, LuUsers } from "react-icons/lu";

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

interface IncapacidadListItem extends Incapacidad {
  id_incapacidad: number;
  observaciones?: string;
  porcentaje_patrono?: string;
  porcentaje_ccss?: string;
  tipo_incapacidad?: {
    id_tipo_incap: number;
    nombre: string;
  };
}

interface IncapacidadesResponse {
  rows: IncapacidadListItem[];
  events: unknown[];
}

export const RegistroIncapacidades = () => {
  const { user } = useAuth();
  const userID = user?.id;
  const loggedUserRole = user?.usuario?.roles;

  const hasAdminPermission = useMemo(
    () => (loggedUserRole ?? []).some((role) => role === "ADMINISTRADOR" || role === "SUPER_ADMIN"),
    [loggedUserRole],
  );

  const { data: tipoIncapacidad = [] } = useApiQuery<TipoIncapacidad[]>({ url: "incapacidades/tipos" });
  const { mutate: createIncapacidad, isLoading: isSubmitting } = useApiMutation<Incapacidad, void>({ url: "/incapacidades", method: "POST" });
  const { data: incapacidadesResponse = { rows: [], events: [] }, isLoading: isLoadingList, refetch: refecthIncapacidades } = useApiQuery<IncapacidadesResponse>({
    url: `incapacidades/colaborador/${userID}`,
    enabled: Boolean(userID),
  });

  const incapacidades = incapacidadesResponse.rows;

  const { data: employees = [], isLoading: isEmployeesLoading } =
    useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const isUsuarioActivo = (usuario?: EmployeeUserInfo | null) => {
    if (!usuario) return false;
    if (typeof usuario.estado === "string") {
      return usuario.estado.toUpperCase() === "ACTIVO";
    }
    if (typeof usuario.estado === "number") {
      return usuario.estado === 1;
    }
    return Boolean(usuario.estado);
  };

  const colaboradoresActivos = useMemo(
    () =>
      (employees ?? []).filter((colaborador) => {
        const estadoNombre = (colaborador.estado?.nombre ?? "").toUpperCase();
        return isUsuarioActivo(colaborador.usuario) ? estadoNombre === "ACTIVO" : true;
      }),
    [employees],
  );

  const colaboradoresVisibles = useMemo(() => {
    if (!hasAdminPermission) {
      return colaboradoresActivos.filter((colaborador) => colaborador.id === userID);
    }
    return colaboradoresActivos;
  }, [colaboradoresActivos, hasAdminPermission, userID]);

  const colaboradorOptions = useMemo(() => {
    return colaboradoresVisibles.map((colaborador) => {
      const collaboratorId = colaborador.id;
      const baseName = [colaborador.nombre, colaborador.primer_apellido, colaborador.segundo_apellido]
        .filter(Boolean)
        .join(" ")
        .trim();

      const displayName = baseName ? toTitleCase(baseName) : `Colaborador ${collaboratorId}`;
      const suffix = collaboratorId === userID ? " (Para mi)" : "";

      return {
        label: `${displayName}${suffix}`,
        value: String(collaboratorId),
      };
    });
  }, [colaboradoresVisibles, userID]);

  const getDurationLabel = useCallback((inicio: string, fin: string) => {
    const MS_IN_DAY = 86_400_000;
    const startDate = new Date(inicio);
    const endDate = new Date(fin);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return "Duración desconocida";
    }
    const diffDays = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / MS_IN_DAY));
    const totalDays = diffDays + 1;
    return `${totalDays} ${totalDays === 1 ? "día" : "días"}`;
  }, []);

  const tipoToOptions = useCallback(
    (items: TipoIncapacidad[]) => items.map((v) => ({ label: toTitleCase(v.nombre), value: v.nombre })),
    [],
  );

  const IncapacidadOptions = useMemo(
    () => tipoToOptions(tipoIncapacidad),
    [tipoIncapacidad, tipoToOptions],
  );

  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>("");

  const {
    data: otherIncapacidadesResponse = { rows: [], events: [] },
    isLoading: isLoadingOtherIncapacidades,
    refetch: refetchOtherIncapacidades,
  } = useApiQuery<IncapacidadesResponse>({
    url: selectedCollaboratorId ? `incapacidades/colaborador/${selectedCollaboratorId}` : `incapacidades/colaborador/${userID}`,
    enabled: hasAdminPermission && Boolean(selectedCollaboratorId),
  });

  useEffect(() => {
    if (!hasAdminPermission) {
      setSelectedCollaboratorId("");
    }
  }, [hasAdminPermission]);

  useEffect(() => {
    if (hasAdminPermission && selectedCollaboratorId) {
      refetchOtherIncapacidades();
    }
  }, [hasAdminPermission, selectedCollaboratorId, refetchOtherIncapacidades]);

  const otherIncapacidades = otherIncapacidadesResponse.rows;

  const renderIncapacidadesList = useCallback(
    (items: IncapacidadListItem[], isLoading: boolean, emptyMessage: string) => (
      <ScrollArea.Root variant="hover" maxH={{ base: "none", lg: "28rem" }}>
        <ScrollArea.Viewport>
          <Stack gap={4}>
            {isLoading && <AppLoader />}
            {!isLoading && items.length === 0 && <EmptyStateIndicator title={emptyMessage} />}
            {items.map((item) => (
              <Box key={item.id_incapacidad} p={4} borderRadius="lg" bg="gray.50" _hover={{ bg: "gray.100" }}>
                <Box flex="1">
                  <Text fontWeight="semibold">
                    {toTitleCase(item.tipo_incapacidad?.nombre ?? item.tipo_incap ?? "")}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {item.fecha_inicio} → {item.fecha_fin}
                  </Text>
                  <Text mt={2} fontSize="xs" color="gray.500">
                    Duración: {getDurationLabel(item.fecha_inicio, item.fecha_fin)}
                  </Text>
                </Box>
              </Box>
            ))}
          </Stack>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" />
      </ScrollArea.Root>
    ),
    [getDurationLabel],
  );

  const handleOtherCollaboratorSubmit = useCallback(
    async (values: { id_colaborador: string | number }) => {
      const nextValue = typeof values.id_colaborador === "number" ? String(values.id_colaborador) : values.id_colaborador ?? "";
      setSelectedCollaboratorId(nextValue);
      return true;
    },
    [],
  );

  const handleCreateRequest = async (incapacidad: Incapacidad) => {
    try {
      await createIncapacidad(incapacidad);
      await refecthIncapacidades();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  return (
    <Layout pageTitle="Registro Incapacidades">
      <Grid templateColumns={{ base: "1fr", lg: "500px 1fr" }} gap={{ base: 4, lg: 6 }}>
        <GridItem>
          <Box bg="white" borderRadius="xl" boxShadow="md" p={6} h={{ base: "auto", lg: "full" }}>
            <Heading size="sm" mb={4}>
              Incapacidades registradas
            </Heading>
            <Tabs.Root variant="line" defaultValue="member">
              <Tabs.List>
                <Tabs.Trigger value="member">
                  <LuUser />
                  Mis incapacidades
                </Tabs.Trigger>
                {hasAdminPermission && (
                  <Tabs.Trigger value="members">
                    <LuUsers />
                    Otros colaboradores
                  </Tabs.Trigger>
                )}
              </Tabs.List>

              <Tabs.Content value="member">
                {renderIncapacidadesList(incapacidades, isLoadingList, "No hay incapacidades registradas")}
              </Tabs.Content>

              {hasAdminPermission && (
                <Tabs.Content value="members">
                  <Form
                    onSubmit={handleOtherCollaboratorSubmit}
                    resetOnSuccess={false}
                    defaultValues={{ id_colaborador: selectedCollaboratorId }}
                  >
                    <Wrap maxW="600px">
                      <InputField
                        fieldType="select"
                        label="Colaborador"
                        name="id_colaborador"
                        required
                        disableSelectPortal
                        placeholder={
                          isEmployeesLoading ? "Cargando colaboradores..." : "Seleccione un colaborador"
                        }
                        options={colaboradorOptions}
                        selectRootProps={{ disabled: isEmployeesLoading || colaboradorOptions.length === 0 }}
                        rules={{ required: "El campo es obligatorio" }}
                      />
                    </Wrap>

                    <Box w={{ base: "100%", sm: "250px" }} mt={4}>
                      <Button appearance="login" type="submit" size="lg" w="100%">
                        Consultar colaborador
                      </Button>
                    </Box>
                  </Form>

                  <Box mt={6}>
                    {selectedCollaboratorId ? (
                      renderIncapacidadesList(
                        otherIncapacidades,
                        isLoadingOtherIncapacidades,
                        "No hay incapacidades registradas",
                      )
                    ) : (
                      <EmptyStateIndicator title="Seleccione un colaborador para consultar" />
                    )}
                  </Box>
                </Tabs.Content>
              )}
            </Tabs.Root>
          </Box>
        </GridItem>

        <GridItem>
          <Box bg="white" borderRadius="xl" boxShadow="md" p={6}>
            <Form onSubmit={handleCreateRequest} resetOnSuccess>
              <Wrap maxW="600px">
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
                <InputField
                  fieldType="select"
                  label="Colaborador"
                  name="id_colaborador"
                  required
                  disableSelectPortal
                  placeholder={isEmployeesLoading ? "Cargando colaboradores..." : "Seleccione un colaborador"}
                  options={colaboradorOptions}
                  rules={{
                    required: "El campo es obligatorio",
                    setValueAs: (v) => (v !== undefined && v !== null && v !== "" ? Number(v) : undefined),
                  }}
                  selectRootProps={{ disabled: isEmployeesLoading || colaboradorOptions.length === 0 }}
                />
              </Wrap>

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
                  Registrar Incapacidad
                </Button>
              </Box>
            </Form>
          </Box>
        </GridItem>
      </Grid>
    </Layout>
  );
}
