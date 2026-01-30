import { Box, Grid, GridItem, Heading, Stack, Text, Wrap, Tabs, ScrollArea, Badge } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LuUser, LuUsers } from "react-icons/lu";
import { Form, InputField } from "../../../components/forms";
import { Button } from "../../../components/general/button/Button";
import { EmptyStateIndicator } from "../../../components/general";
import { Layout } from "../../../components/layout";
import { AppLoader } from "../../../components/layout/loading";
import { useAuth } from "../../../context/AuthContext";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useApiQuery } from "../../../hooks/useApiQuery";
import type { EmployeeRow } from "../../../types";
import { toTitleCase } from "../../../utils";

interface TipoPermiso {
  id: number;
  tipo_solicitud: string;
  es_licencia: boolean,
  es_permiso: boolean
}

interface PermisoPayload {
  id_colaborador: number;
  id_aprobador: number;
  tipo_solicitud: number;
  fecha_inicio: string;
  fecha_fin: string;
  con_goce_salarial: boolean;
  observaciones?: string;
}

interface PermisoListItem extends PermisoPayload {
  id_solicitud: number;
  estado_solicitud?: number;
  cantidad_horas?: string;
  cantidad_dias?: string;
  tiposSolicitud?: {
    id_tipo_solicitud: number;
    tipo_solicitud: string;
    es_permiso: boolean;
    es_licencia: boolean;
  };
  estadoSolicitudPermisos?: {
    id_estado: number;
    estado: string;
  };
}

type CreatePermisoFormValues = Pick<PermisoPayload, "tipo_solicitud" | "fecha_inicio" | "fecha_fin" | "observaciones">;

const estadoBadgeProps = (estado?: string) => {
  const key = estado?.toUpperCase();
  switch (key) {
    case "PENDIENTE":
      return { colorPalette: "yellow", variant: "subtle" as const };
    case "APROBADO":
      return { colorPalette: "blue", variant: "subtle" as const };
    case "CANCELADO":
      return { colorPalette: "gray", variant: "subtle" as const };
    case "RECHAZADO":
      return { colorPalette: "red", variant: "subtle" as const };
    default:
      return { colorPalette: "gray", variant: "subtle" as const };
  }
};

export const SolicitudPermisos = () => {

  const { user } = useAuth();
  const userID = user?.id;
  const loggedUserRole = user?.usuario?.roles;

  const hasAdminPermission = useMemo(
    () => (loggedUserRole ?? []).some((role) => role === "ADMINISTRADOR" || role === "SUPER_ADMIN"),
    [loggedUserRole],
  );

  const { data: tiposPermiso = [] } = useApiQuery<TipoPermiso[]>({ url: "permisos/tipos-solicitud" });

  const {
    data: permisosResponse = [],
    isLoading: isLoadingMyPermisos,
    refetch: refetchMyPermisos,
  } = useApiQuery<PermisoListItem[]>({
    url: `permisos/colaborador/${userID}`,
    enabled: Boolean(userID),
  });

  const { data: employees = [], isLoading: isLoadingEmployees } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const colaboradoresActivos = useMemo(
    () =>
      (employees ?? []).filter((colaborador) =>
        colaborador?.usuario?.activo ? colaborador.estado.toUpperCase() === "ACTIVO" : true,
      ),
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
      const suffix = collaboratorId === userID ? " (Para mí)" : "";
      return { label: `${displayName}${suffix}`, value: String(collaboratorId) };
    });
  }, [colaboradoresVisibles, userID]);

  const tipoPermisoOptions = useMemo(
    () => tiposPermiso.map((tipo) => ({ label: toTitleCase(tipo.tipo_solicitud), value: String(tipo.id) })),
    [tiposPermiso],
  );

  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>("");

  const {
    data: otherPermisosResponse = [],
    isLoading: isLoadingOtherPermisos,
    refetch: refetchOtherPermisos,
  } = useApiQuery<PermisoListItem[]>({
    url: selectedCollaboratorId ? `permisos/colaborador/${selectedCollaboratorId}` : "",
    enabled: hasAdminPermission && Boolean(selectedCollaboratorId),
  });

  useEffect(() => {
    if (!hasAdminPermission) {
      setSelectedCollaboratorId("");
    }
  }, [hasAdminPermission]);

  useEffect(() => {
    if (hasAdminPermission && selectedCollaboratorId) {
      refetchOtherPermisos();
    }
  }, [hasAdminPermission, selectedCollaboratorId, refetchOtherPermisos]);

  const { mutate: createPermiso, isLoading: isSubmitting } = useApiMutation<PermisoPayload, void>({
    url: "/permisos",
    method: "POST",
  });

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

  const renderPermisosList = useCallback(
    (items: PermisoListItem[], isLoading: boolean, emptyMessage: string) => (
      <ScrollArea.Root variant="hover" maxH={{ base: "none", lg: "28rem" }}>
        <ScrollArea.Viewport>
          <Stack gap={4}>
            {isLoading && <AppLoader />}
            {!isLoading && items.length === 0 && <EmptyStateIndicator title={emptyMessage} />}
            {items.map((item) => (
              <Box key={item.id_solicitud} p={4} borderRadius="lg" bg="gray.50" _hover={{ bg: "gray.100" }}>
                <Text fontWeight="semibold">
                  {toTitleCase(item.tiposSolicitud?.tipo_solicitud ?? String(item.tipo_solicitud))}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {item.fecha_inicio} → {item.fecha_fin}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Estado: {<Badge {...estadoBadgeProps(item.estadoSolicitudPermisos?.estado)}>{toTitleCase(item.estadoSolicitudPermisos?.estado ?? "Desconocido")}</Badge>}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Duración: {getDurationLabel(item.fecha_inicio, item.fecha_fin)}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Con goce salarial: {item.con_goce_salarial ? "Sí" : "No"}
                </Text>
                {item.observaciones && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Observaciones: {item.observaciones}
                  </Text>
                )}
              </Box>
            ))}
          </Stack>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" />
      </ScrollArea.Root>
    ),
    [getDurationLabel],
  );

  const handleCreatePermiso = async (formValues: CreatePermisoFormValues) => {
    if (!userID) {
      console.error("No se pudo determinar el colaborador autenticado");
      return false;
    }

    const selectedTipo = tiposPermiso.find((tipo) => tipo.id === formValues.tipo_solicitud);
    const normalizedNombre = (selectedTipo?.tipo_solicitud ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toUpperCase();

    const conGoceSalarial = normalizedNombre.includes("SIN GOCE")
      ? false
      : normalizedNombre.includes("CON GOCE") || normalizedNombre.includes("LICENCIA");

    const payload: PermisoPayload = {
      ...formValues,
      id_colaborador: Number(userID),
      id_aprobador: 1,
      con_goce_salarial: conGoceSalarial,
      observaciones: "N/A"
    };

    try {
      await createPermiso(payload);
      await refetchMyPermisos();
      if (hasAdminPermission && payload.id_colaborador === Number(selectedCollaboratorId)) {
        await refetchOtherPermisos();
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleOtherCollaboratorSubmit = async (values: { id_colaborador: string }) => {
    setSelectedCollaboratorId(values.id_colaborador ?? "");
    return true;
  };

  const myPermisos = permisosResponse;
  const otherPermisos = otherPermisosResponse;

  return (
    <Layout pageTitle="Solicitud de Permisos">
      <Grid templateColumns={{ base: "1fr", lg: "500px 1fr" }} gap={{ base: 4, lg: 6 }}>
        <GridItem>
          <Box bg="white" borderRadius="xl" boxShadow="md" p={6} h={{ base: "auto", lg: "full" }}>
            <Heading size="sm" mb={4}>
              Permisos registrados
            </Heading>

            <Tabs.Root variant="line" defaultValue="mine">
              <Tabs.List>
                <Tabs.Trigger value="mine">
                  <LuUser />
                  Mis permisos
                </Tabs.Trigger>
                {hasAdminPermission && (
                  <Tabs.Trigger value="others">
                    <LuUsers />
                    Otros colaboradores
                  </Tabs.Trigger>
                )}
              </Tabs.List>

              <Tabs.Content value="mine">
                {renderPermisosList(myPermisos, isLoadingMyPermisos, "No hay permisos registrados")}
              </Tabs.Content>

              {hasAdminPermission && (
                <Tabs.Content value="others">
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
                          isLoadingEmployees ? "Cargando colaboradores..." : "Seleccione un colaborador"
                        }
                        options={colaboradorOptions}
                        selectRootProps={{ disabled: isLoadingEmployees || colaboradorOptions.length === 0 }}
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
                      renderPermisosList(
                        otherPermisos,
                        isLoadingOtherPermisos,
                        "No hay permisos registrados",
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
            <Form onSubmit={handleCreatePermiso} resetOnSuccess>
              <Wrap maxW="600px">
                <InputField
                  fieldType="select"
                  label="Tipo de permiso"
                  name="tipo_solicitud"
                  required
                  disableSelectPortal
                  placeholder={tipoPermisoOptions.length ? "Seleccione un tipo" : "Cargando..."}
                  options={tipoPermisoOptions}
                  rules={{
                    required: "El campo es obligatorio",
                    setValueAs: (v) => (v ? Number(v) : undefined),
                  }}
                  selectRootProps={{ disabled: tipoPermisoOptions.length === 0 }}
                />
                <InputField
                  fieldType="date"
                  label="Fecha de inicio"
                  name="fecha_inicio"
                  required
                  rules={{ required: "El campo es obligatorio" }}
                />
                <InputField
                  fieldType="date"
                  label="Fecha de finalización"
                  name="fecha_fin"
                  required
                  rules={{ required: "El campo es obligatorio" }}
                />
                <InputField
                  fieldType="text"
                  label="Observaciones"
                  name="observaciones"
                  placeholder="Detalle adicional (opcional)"
                  rules={{
                    setValueAs: (v) => (typeof v === "string" ? v.trim() || undefined : undefined),
                  }}
                  required={false}
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
                  Registrar permiso
                </Button>
              </Box>
            </Form>
          </Box>
        </GridItem>
      </Grid>
    </Layout>
  );
};
