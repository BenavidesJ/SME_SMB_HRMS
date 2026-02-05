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
import { showToast } from "../../../services/toast/toastService";
import type { EmployeeRow, EmployeeUserInfo } from "../../../types";
import { toTitleCase } from "../../../utils";

interface VacacionPayload {
  id_colaborador: number;
  id_aprobador: number;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones?: string;
}

interface VacacionListItem {
  id_solicitud_vacaciones: number;
  id_colaborador: number;
  id_aprobador: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias_aprobados?: string | null;
  dias_solicitados?: string | null;
  observaciones?: string | null;
  dias_solicitados_detalle: string[];
  dias_skipped_detalle?: Array<{
    date: string;
    reason: string;
    holiday: string | null;
  }>;
  meta_vacaciones?: {
    chargeableDates: string[];
    skippedDates: Array<{
      date: string;
      reason: string;
      holiday: string | null;
    }>;
  };
  colaborador?: {
    id_colaborador: number;
    nombre: string | null;
    primer_apellido: string | null;
    segundo_apellido: string | null;
    correo_electronico: string | null;
  } | null;
  aprobador?: {
    id_colaborador: number;
    nombre: string | null;
    primer_apellido: string | null;
    segundo_apellido: string | null;
    correo_electronico: string | null;
  } | null;
  saldo_vacaciones?: {
    dias_ganados: number;
    dias_tomados: number;
  } | null;
  estadoSolicitudVacaciones?: {
    id_estado: number;
    estado: string;
  };
}

interface VacacionMetaEngine {
  chargeableDays: number;
  chargeableDates: string[];
  skippedDates: Array<{
    date: string;
    reason: string;
    holiday?: string | null;
  }>;
  dias_ganados_recalculados: number;
  disponibles: number;
  id_saldo_vacaciones: number;
}


interface VacacionCreateResponse {
  id_solicitud_vacaciones: number;
  id_colaborador: number;
  id_aprobador: number;
  estado_solicitud: string;
  fecha_inicio: string;
  fecha_fin: string;
  id_saldo_vacaciones: number;
  meta_engine?: VacacionMetaEngine;
  warnings?: string[];
  notificaciones?: {
    aprobador_notificado: boolean;
  };
}

interface VacacionUpdateResponse {
  id_solicitud_vacaciones: number;
  estado_solicitud: string;
}

type CreateVacacionFormValues = Pick<VacacionPayload, "fecha_inicio" | "fecha_fin" | "observaciones"> & {
  id_aprobador: string;
};

const estadoBadgeProps = (estado?: string) => {
  switch (estado?.toUpperCase()) {
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

export const SolicitudVacaciones = () => {
  const { user } = useAuth();
  const userID = user?.id;
  const loggedUserRole = user?.usuario?.roles;
  const [activeTab, setActiveTab] = useState<"mine" | "others">("mine");

  const hasAdminPermission = useMemo(
    () => (loggedUserRole ?? []).some((role) => role === "ADMINISTRADOR" || role === "SUPER_ADMIN"),
    [loggedUserRole],
  );

  const {
    data: vacacionesResponse = [],
    isLoading: isLoadingMyVacaciones,
    refetch: refetchMyVacaciones,
  } = useApiQuery<VacacionListItem[]>({
    url: `vacaciones/colaborador/${userID}`,
    enabled: Boolean(userID),
  });

  const { data: employees = [], isLoading: isLoadingEmployees } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const isUsuarioActivo = (usuario?: EmployeeUserInfo | null) => {
    if (!usuario) return false;
    if (typeof usuario.estado === "string") return usuario.estado.toUpperCase() === "ACTIVO";
    if (typeof usuario.estado === "number") return usuario.estado === 1;
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

  const colaboradorOptions = useMemo(
    () =>
      (colaboradoresVisibles ?? []).map((colaborador) => {
        const collaboratorId = colaborador.id;
        const baseName = [colaborador.nombre, colaborador.primer_apellido, colaborador.segundo_apellido]
          .filter(Boolean)
          .join(" ")
          .trim();
        const displayName = baseName ? toTitleCase(baseName) : `Colaborador ${collaboratorId}`;
        const suffix = collaboratorId === userID ? " (Para mí)" : "";
        return { label: `${displayName}${suffix}`, value: String(collaboratorId) };
      }),
    [colaboradoresVisibles, userID],
  );

  const adminOptions = useMemo(
    () =>
      (employees ?? [])
        .filter((colaborador) =>
          (colaborador.usuario?.roles ?? []).some((role) => role === "ADMINISTRADOR" || role === "SUPER_ADMIN"),
        )
        .map((colaborador) => {
          const collaboratorId = colaborador.id;
          const baseName = [colaborador.nombre, colaborador.primer_apellido, colaborador.segundo_apellido]
            .filter(Boolean)
            .join(" ")
            .trim();
          const displayName = baseName ? toTitleCase(baseName) : `Colaborador ${collaboratorId}`;
          return { label: displayName, value: String(collaboratorId) };
        }),
    [employees],
  );

  const defaultApproverId = useMemo(() => adminOptions[0]?.value ?? "", [adminOptions]);
  const formKey = useMemo(() => `vacaciones-form-${defaultApproverId}`, [defaultApproverId]);

  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>("");

  const {
    data: otherVacacionesResponse = [],
    isLoading: isLoadingOtherVacaciones,
    refetch: refetchOtherVacaciones,
  } = useApiQuery<VacacionListItem[]>({
    url: selectedCollaboratorId ? `vacaciones/colaborador/${selectedCollaboratorId}` : "",
    enabled: hasAdminPermission && Boolean(selectedCollaboratorId),
  });

  useEffect(() => {
    if (!hasAdminPermission) {
      setSelectedCollaboratorId("");
    }
  }, [hasAdminPermission]);

  useEffect(() => {
    if (hasAdminPermission && selectedCollaboratorId) {
      refetchOtherVacaciones();
    }
  }, [hasAdminPermission, selectedCollaboratorId, refetchOtherVacaciones]);

  useEffect(() => {
    if (activeTab === "others" && !selectedCollaboratorId && colaboradorOptions.length > 0) {
      setSelectedCollaboratorId(colaboradorOptions[0].value);
    }
  }, [activeTab, colaboradorOptions, selectedCollaboratorId]);

  const { mutate: createVacacion, isLoading: isSubmitting } = useApiMutation<VacacionPayload, VacacionCreateResponse>({
    url: "/vacaciones",
    method: "POST",
  });

  const {
    mutate: updateVacacionEstado,
    isLoading: isUpdatingVacacion,
  } = useApiMutation<{ nuevo_estado: "APROBADO" | "RECHAZADO" }, VacacionUpdateResponse, number>({
    url: (idSolicitud) => `/vacaciones/solicitud/${idSolicitud}`,
    method: "PATCH",
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

  const handleChangeEstadoSolicitud = useCallback(
    async (solicitudId: number, nuevoEstado: "APROBADO" | "RECHAZADO") => {
      try {
        await updateVacacionEstado(solicitudId, { nuevo_estado: nuevoEstado });
        showToast(
          `Solicitud ${nuevoEstado === "APROBADO" ? "aprobada" : "rechazada"} correctamente`,
          "success",
          "Estado actualizado",
        );
        await Promise.all([refetchMyVacaciones(), refetchOtherVacaciones()]);
      } catch (error) {
        console.error(error);
        showToast(
          "No se pudo actualizar el estado de la solicitud",
          "error",
          "Estado de vacaciones",
        );
      }
    },
    [updateVacacionEstado, refetchMyVacaciones, refetchOtherVacaciones],
  );

  const renderVacacionesList = useCallback(
    (
      items: VacacionListItem[],
      isLoading: boolean,
      emptyMessage: string,
      options?: { mostrarAccionesAprobador?: boolean },
    ) => (
      <ScrollArea.Root variant="hover" maxH={{ base: "none", lg: "28rem" }}>
        <ScrollArea.Viewport>
          <Stack gap={4}>
            {isLoading && <AppLoader />}
            {!isLoading && items.length === 0 && <EmptyStateIndicator title={emptyMessage} />}
            {items.map((item) => {
              const estadoActual = (item.estadoSolicitudVacaciones?.estado ?? "").toUpperCase();
              const canShowAcciones =
                options?.mostrarAccionesAprobador &&
                item.id_aprobador === userID &&
                estadoActual === "PENDIENTE";

              return (
                <Box key={item.id_solicitud_vacaciones} p={4} borderRadius="lg" bg="gray.50" _hover={{ bg: "gray.100" }}>
                  <Text fontWeight="semibold">{item.fecha_inicio} → {item.fecha_fin}</Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Estado:{" "}
                    <Badge {...estadoBadgeProps(item.estadoSolicitudVacaciones?.estado ?? undefined)}>
                      {toTitleCase(item.estadoSolicitudVacaciones?.estado ?? "Desconocido")}
                    </Badge>
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Duración: {getDurationLabel(item.fecha_inicio, item.fecha_fin)}
                  </Text>
                  {item.dias_solicitados && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Días solicitados: {item.dias_solicitados}
                    </Text>
                  )}
                  {item.dias_aprobados && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Días aprobados: {item.dias_aprobados}
                    </Text>
                  )}
                  {!!item.dias_skipped_detalle?.length && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Días omitidos: {item.dias_skipped_detalle.map((skip) => skip.date).join(", ")}
                    </Text>
                  )}
                  {item.saldo_vacaciones && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Saldo al registrar: {item.saldo_vacaciones.dias_ganados - item.saldo_vacaciones.dias_tomados} días disponibles
                    </Text>
                  )}
                  {item.observaciones && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Observaciones: {item.observaciones}
                    </Text>
                  )}
                  {canShowAcciones && (
                    <Stack
                      direction={{ base: "column", sm: "row" }}
                      mt={3}
                      gap={2}
                    >
                      <Button
                        type="button"
                        appearance="primary"
                        size="sm"
                        loading={isUpdatingVacacion}
                        loadingText="Actualizando"
                        disabled={isUpdatingVacacion}
                        onClick={() => handleChangeEstadoSolicitud(item.id_solicitud_vacaciones, "APROBADO")}
                      >
                        Aprobar
                      </Button>
                      <Button
                        type="button"
                        appearance="danger"
                        size="sm"
                        loading={isUpdatingVacacion}
                        loadingText="Actualizando"
                        disabled={isUpdatingVacacion}
                        onClick={() => handleChangeEstadoSolicitud(item.id_solicitud_vacaciones, "RECHAZADO")}
                      >
                        Rechazar
                      </Button>
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Stack>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" />
      </ScrollArea.Root>
    ),
    [
      getDurationLabel,
      handleChangeEstadoSolicitud,
      isUpdatingVacacion,
      userID,
    ],
  );

  const handleCreateVacacion = async (formValues: CreateVacacionFormValues) => {
    if (!userID) {
      console.error("No se pudo determinar el colaborador autenticado");
      return false;
    }

    const { id_aprobador, ...rest } = formValues;
    const approverId = Number(id_aprobador);

    if (!Number.isFinite(approverId) || approverId <= 0) {
      showToast("Seleccione un aprobador válido.", "error", "Solicitud de vacaciones");
      return false;
    }

    const payload: VacacionPayload = {
      id_colaborador: Number(userID),
      id_aprobador: approverId,
      fecha_inicio: rest.fecha_inicio,
      fecha_fin: rest.fecha_fin,
      observaciones: rest.observaciones,
    };

    try {
      const result = await createVacacion(payload);

      if (result?.meta_engine?.chargeableDays !== undefined) {
        showToast(
          `Esta solicitud descuenta ${result.meta_engine.chargeableDays} ${result.meta_engine.chargeableDays === 1 ? "día" : "días"} del saldo.`,
          "info",
          "Cálculo de vacaciones",
        );
      }

      if (Array.isArray(result?.warnings)) {
        result.warnings.forEach((warning, index) => {
          if (!warning) return;
          showToast(warning, "warning", index === 0 ? "Avisos del periodo" : undefined);
        });
      }

      await refetchMyVacaciones();
      if (hasAdminPermission && payload.id_colaborador === Number(selectedCollaboratorId)) {
        await refetchOtherVacaciones();
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

  const myVacaciones = vacacionesResponse;
  const otherVacaciones = otherVacacionesResponse;

  return (
    <Layout pageTitle="Solicitud de Vacaciones">
      <Grid templateColumns={{ base: "1fr", lg: "500px 1fr" }} gap={{ base: 4, lg: 6 }}>
        <GridItem>
          <Box bg="white" borderRadius="xl" boxShadow="md" p={6} h={{ base: "auto", lg: "full" }}>
            <Heading size="sm" mb={4}>
              Vacaciones registradas
            </Heading>

            <Tabs.Root
              variant="line"
              value={activeTab}
              onValueChange={(details) => {
                if (details.value === "mine" || details.value === "others") {
                  setActiveTab(details.value);
                }
              }}
            >
              <Tabs.List>
                <Tabs.Trigger value="mine">
                  <LuUser />
                  Mis vacaciones
                </Tabs.Trigger>
                {hasAdminPermission && (
                  <Tabs.Trigger value="others">
                    <LuUsers />
                    Otros colaboradores
                  </Tabs.Trigger>
                )}
              </Tabs.List>

              <Tabs.Content value="mine">
                {renderVacacionesList(myVacaciones, isLoadingMyVacaciones, "No hay vacaciones registradas")}
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
                      renderVacacionesList(
                        otherVacaciones,
                        isLoadingOtherVacaciones,
                        "No hay vacaciones registradas",
                        { mostrarAccionesAprobador: true },
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
            <Form
              key={formKey}
              onSubmit={handleCreateVacacion}
              resetOnSuccess
              defaultValues={{ id_aprobador: defaultApproverId }}
            >
              <Wrap maxW="600px">
                <InputField
                  fieldType="select"
                  label="Aprobador"
                  name="id_aprobador"
                  required
                  disableSelectPortal
                  placeholder={
                    isLoadingEmployees ? "Cargando aprobadores..." : "Seleccione un aprobador"
                  }
                  options={adminOptions}
                  selectRootProps={{ disabled: isLoadingEmployees || adminOptions.length === 0 }}
                  rules={{ required: "El campo es obligatorio" }}
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
                  disabled={!adminOptions.length}
                >
                  Registrar vacaciones
                </Button>
              </Box>
            </Form>
          </Box>
        </GridItem>
      </Grid>
    </Layout>
  );
};
