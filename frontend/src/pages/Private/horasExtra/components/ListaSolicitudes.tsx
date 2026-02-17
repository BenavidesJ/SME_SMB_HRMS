import { useMemo, useState } from "react";
import {
  HStack,
  ScrollArea,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { buildQuery } from "./helpers/solicitudesQuery";
import { isAgrupada, type DataConsultaSolicitudes, type SolicitudesQuery, type SolicitudHoraExtra } from "../../../../types/Overtime";
import { SolicitudCard } from "./SolicitudCard";
import { EmptyStateIndicator } from "../../../../components/general";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import { useAuth } from "../../../../context/AuthContext";
import { showToast } from "../../../../services/toast/toastService";

interface ListaSolicitudesProps {
  filtros: SolicitudesQuery;
}

export function ListaSolicitudes({ filtros }: ListaSolicitudesProps) {
  const { user } = useAuth();
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const currentUserRole = String(user?.usuario?.rol ?? "").toUpperCase();
  const canManageRequests = ["SUPER_ADMIN", "ADMIN", "ADMINISTRADOR"].includes(currentUserRole);
  const url = useMemo(() => buildQuery(filtros), [filtros]);
  const { data: res, isLoading, refetch } = useApiQuery<DataConsultaSolicitudes>({ url });
  const { mutate: modifyRequest } =
    useApiMutation<{ id_aprobador?: number; estado: string }, void>({
      url: (id) => `/horas-extra/solicitud/${id}`,
      method: "PATCH",
    })

  const flatItems = res
    ? isAgrupada(res)
      ? res.grupos.flatMap((g) => g.items)
      : res.items
    : [];

  const grupos = res && isAgrupada(res) ? res.grupos : [];

  const handleApprove = async (id: number) => {
    if (!canManageRequests) return;

    setSubmittingId(id);
    try {
      await modifyRequest(id,
        { estado: "aprobado" },
      );
      await refetch();
    } catch (error) {
      showToast(`Error aprobando la solicitud: ${error}`, "error")
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDecline = async (id: number) => {
    if (!canManageRequests) return;

    setSubmittingId(id);
    try {
      await modifyRequest(id,
        { id_aprobador: user?.id, estado: "rechazado" },
      );
      await refetch();
    } catch (error) {
      showToast(`Error rechazando la solicitud: ${error}`, "error")
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <Stack gap="5">

      {!isLoading && res && res.total === 0 && (
        <EmptyStateIndicator
          title="No hay solicitudes para mostrar"
          subtitle=""
        />
      )}

      {!isLoading && res && (
        <ScrollArea.Root variant="hover" maxH={{ base: "none", lg: "30rem" }}>
          <ScrollArea.Viewport>
            <Stack gap="4" pb="8">
              {isAgrupada(res) ? (
                <Stack gap="5">
                  {grupos.map((g) => (
                    <Stack key={String(g.clave)} gap="3">
                      <HStack justify="space-between">
                        <Text fontWeight="semibold">
                          {g.etiqueta}{" "}
                          <Text as="span" color="fg.muted" fontWeight="normal">
                            ({g.cantidad})
                          </Text>
                        </Text>
                      </HStack>

                      <Stack gap="3">
                        {g.items.map((item) => (
                          <SolicitudCard
                            key={item.id_solicitud_hx}
                            item={item}
                            canManageActions={canManageRequests}
                            onApprove={canManageRequests ? handleApprove : undefined}
                            onDecline={canManageRequests ? handleDecline : undefined}
                            isSubmitting={submittingId === item.id_solicitud_hx}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Stack gap="3">
                  {flatItems.map((item: SolicitudHoraExtra) => (
                    <SolicitudCard
                      key={item.id_solicitud_hx}
                      item={item}
                      canManageActions={canManageRequests}
                      onApprove={canManageRequests ? handleApprove : undefined}
                      onDecline={canManageRequests ? handleDecline : undefined}
                      isSubmitting={submittingId === item.id_solicitud_hx}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" />
        </ScrollArea.Root>
      )}
    </Stack>
  );
}
