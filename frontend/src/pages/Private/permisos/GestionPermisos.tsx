import { useCallback, useMemo, useState } from "react";
import { ScrollArea, Stack } from "@chakra-ui/react";
import { EmptyStateIndicator } from "../../../components/general";
import { SolicitudesAdminFilters } from "../../../components/general/requests/SolicitudesAdminFilters";
import { Layout } from "../../../components/layout";
import { useAuth } from "../../../context/AuthContext";
import { usePendientesAprobacion } from "../../../context/PendientesAprobacionContext";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { showToast } from "../../../services/toast/toastService";
import type { EmployeeRow, EmployeeUserInfo } from "../../../types";
import { sortRequestsByAdminPriority } from "../../../utils/requestStatus";
import { toTitleCase } from "../../../utils";
import { PermisoSolicitudCard } from "./components/PermisoSolicitudCard";
import type { PermisoListItem, PermisoUpdateResponse } from "./types";

export const GestionPermisos = () => {
  const { user } = useAuth();
  const { refreshPendientes } = usePendientesAprobacion();
  const [estado, setEstado] = useState<string | undefined>(undefined);
  const [colaborador, setColaborador] = useState<string | undefined>(undefined);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const { data: employees = [] } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const isUsuarioActivo = useCallback((usuario?: EmployeeUserInfo | null) => {
    if (!usuario) return false;
    if (typeof usuario.estado === "string") return usuario.estado.toUpperCase() === "ACTIVO";
    if (typeof usuario.estado === "number") return usuario.estado === 1;
    return Boolean(usuario.estado);
  }, []);

  const colaboradoresActivos = useMemo(
    () =>
      (employees ?? []).filter((colaboradorItem) => {
        const estadoNombre = (colaboradorItem.estado?.nombre ?? "").toUpperCase();
        return isUsuarioActivo(colaboradorItem.usuario) ? estadoNombre === "ACTIVO" : true;
      }),
    [employees, isUsuarioActivo],
  );

  const collaboratorOptions = useMemo(
    () =>
      colaboradoresActivos.map((employee) => {
        const baseName = [employee.nombre, employee.primer_apellido, employee.segundo_apellido]
          .filter(Boolean)
          .join(" ")
          .trim();
        return {
          label: baseName ? toTitleCase(baseName) : `Colaborador ${employee.id}`,
          value: String(employee.id),
        };
      }),
    [colaboradoresActivos],
  );

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (estado) {
      params.set("estado", estado);
    }

    if (colaborador) {
      params.set("id_colaborador", colaborador);
    }

    const qs = params.toString();
    return `/permisos/solicitudes${qs ? `?${qs}` : ""}`;
  }, [colaborador, estado]);

  const {
    data: permisos = [],
    isLoading,
    refetch,
  } = useApiQuery<PermisoListItem[]>({ url: queryUrl });

  const { mutate: updatePermisoEstado } = useApiMutation<{ nuevo_estado: "APROBADO" | "RECHAZADO" }, PermisoUpdateResponse, number>({
    url: (idSolicitud) => `/permisos/solicitud/${idSolicitud}`,
    method: "PATCH",
  });

  const filteredItems = useMemo(() => {
    return sortRequestsByAdminPriority(
      permisos,
      (item) => item.estadoSolicitudPermisos?.estado ?? item.estado_solicitud,
      (item) => item.fecha_inicio,
    );
  }, [permisos]);

  const currentCollaboratorId = Number(user?.id ?? 0);

  const handleEstado = useCallback(
    async (solicitudId: number, nuevoEstado: "APROBADO" | "RECHAZADO") => {
      setSubmittingId(solicitudId);
      try {
        await updatePermisoEstado(solicitudId, { nuevo_estado: nuevoEstado });
        showToast(
          `Solicitud ${nuevoEstado === "APROBADO" ? "aprobada" : "rechazada"} correctamente`,
          "success",
          "Estado de permisos",
        );
        await Promise.all([refetch(), refreshPendientes()]);
      } catch (error) {
        console.error(error);
        showToast("No se pudo actualizar el estado de la solicitud", "error", "Estado de permisos");
      } finally {
        setSubmittingId(null);
      }
    },
    [refreshPendientes, refetch, updatePermisoEstado],
  );

  return (
    <Layout pageTitle="Gestión de Permisos">
      <Stack gap="5" minH={{ base: "auto", lg: "calc(100vh - 13rem)" }} pb="6">
        <SolicitudesAdminFilters
          estado={estado}
          colaborador={colaborador}
          onEstadoChange={setEstado}
          onColaboradorChange={setColaborador}
          collaboratorOptions={collaboratorOptions}
        />

        {!isLoading && filteredItems.length === 0 ? (
          <EmptyStateIndicator title="Esta lista está vacía" variant="compact" />
        ) : (
          <ScrollArea.Root variant="hover" maxH={{ base: "none", lg: "calc(100vh - 17rem)" }}>
            <ScrollArea.Viewport>
              <Stack gap="3" pb="6" pr="2">
                {filteredItems.map((item) => (
                  <PermisoSolicitudCard
                    key={item.id_solicitud}
                    item={item}
                    showCollaborator
                    canManageActions={item.id_aprobador === currentCollaboratorId}
                    isSubmitting={submittingId === item.id_solicitud}
                    onApprove={(id) => handleEstado(id, "APROBADO")}
                    onDecline={(id) => handleEstado(id, "RECHAZADO")}
                  />
                ))}
              </Stack>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="vertical" />
          </ScrollArea.Root>
        )}
      </Stack>
    </Layout>
  );
};
