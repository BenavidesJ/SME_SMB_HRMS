import { useMemo, useState } from "react";
import { ScrollArea, Stack } from "@chakra-ui/react";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { type DataConsultaSolicitudes, type SolicitudHoraExtra } from "../../../../types/Overtime";
import { SolicitudCard } from "./SolicitudCard";
import { EmptyStateIndicator } from "../../../../components/general";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import { useAuth } from "../../../../context/AuthContext";
import { usePendientesAprobacion } from "../../../../context/PendientesAprobacionContext";
import { showToast } from "../../../../services/toast/toastService";
import { sortRequestsByAdminPriority } from "../../../../utils/requestStatus";

interface ListaSolicitudesProps {
  estado?: string;
  idColaborador?: number;
}

export function ListaSolicitudes({ estado, idColaborador }: ListaSolicitudesProps) {
  const { user } = useAuth();
  const { refreshPendientes } = usePendientesAprobacion();
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const currentCollaboratorId = Number(user?.id ?? 0);
  const url = useMemo(() => {
    const params = new URLSearchParams();

    if (estado) {
      params.set("estado", estado);
    }

    if (idColaborador) {
      params.set("id_colaborador", String(idColaborador));
    }

    const qs = params.toString();
    return `/horas-extra/solicitudes${qs ? `?${qs}` : ""}`;
  }, [estado, idColaborador]);
  const { data: res, isLoading, refetch } = useApiQuery<DataConsultaSolicitudes>({ url });
  const { mutate: modifyRequest } =
    useApiMutation<{ estado: string }, void>({
      url: (id) => `/horas-extra/solicitud/${id}`,
      method: "PATCH",
    });

  const canManageItem = (item: SolicitudHoraExtra) => currentCollaboratorId > 0 && item.id_aprobador === currentCollaboratorId;

  const flatItems = useMemo(() => {
    const items = res && "grupos" in res ? res.grupos.flatMap((group) => group.items) : res?.items ?? [];
    return sortRequestsByAdminPriority(items, (item) => item.estado.estado, (item) => item.fecha_solicitud);
  }, [res]);

  const handleApprove = async (id: number) => {
    setSubmittingId(id);
    try {
      await modifyRequest(id,
        { estado: "aprobado" },
      );
      await Promise.all([refetch(), refreshPendientes()]);
    } catch (error) {
      showToast(`Error aprobando la solicitud: ${error}`, "error")
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDecline = async (id: number) => {
    setSubmittingId(id);
    try {
      await modifyRequest(id,
        { estado: "rechazado" },
      );
      await Promise.all([refetch(), refreshPendientes()]);
    } catch (error) {
      showToast(`Error rechazando la solicitud: ${error}`, "error")
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <Stack gap="5">

      {!isLoading && flatItems.length === 0 && (
        <EmptyStateIndicator
          title="Esta lista está vacía"
          variant="compact"
        />
      )}

      {!isLoading && flatItems.length > 0 && (
        <ScrollArea.Root variant="hover" maxH={{ base: "none", lg: "calc(100vh - 17rem)" }}>
          <ScrollArea.Viewport>
            <Stack gap="4" pb="8">
              <Stack gap="3">
                {flatItems.map((item: SolicitudHoraExtra) => (
                  <SolicitudCard
                    key={item.id_solicitud_hx}
                    item={item}
                    canManageActions={canManageItem(item)}
                    onApprove={canManageItem(item) ? handleApprove : undefined}
                    onDecline={canManageItem(item) ? handleDecline : undefined}
                    isSubmitting={submittingId === item.id_solicitud_hx}
                  />
                ))}
              </Stack>
            </Stack>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" />
        </ScrollArea.Root>
      )}
    </Stack>
  );
}
