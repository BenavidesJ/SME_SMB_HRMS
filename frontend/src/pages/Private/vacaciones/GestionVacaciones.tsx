import { useCallback, useEffect, useMemo, useState } from "react";
import { ButtonGroup, IconButton, Pagination, SimpleGrid, Stack } from "@chakra-ui/react";
import { EmptyStateIndicator } from "../../../components/general";
import { SolicitudesAdminFilters } from "../../../components/general/requests/SolicitudesAdminFilters";
import { Layout } from "../../../components/layout";
import { useAuth } from "../../../context/AuthContext";
import { usePendientesAprobacion } from "../../../context/PendientesAprobacionContext";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { showToast } from "../../../services/toast/toastService";
import { sortRequestsByAdminPriority } from "../../../utils/requestStatus";
import { toTitleCase } from "../../../utils";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { VacacionSolicitudCard } from "./components/VacacionSolicitudCard";
import type { VacacionListItem, VacacionUpdateResponse } from "./types";
import { VacacionDetalleModal } from "./components/VacacionDetalleModal";

const PAGE_SIZE = 6;

export const GestionVacaciones = () => {
  const { user } = useAuth();
  const { refreshPendientes } = usePendientesAprobacion();
  const [estado, setEstado] = useState<string | undefined>(undefined);
  const [colaborador, setColaborador] = useState<string | undefined>(undefined);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<VacacionListItem | null>(null);

  const optionsQueryUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (estado) {
      params.set("estado", estado);
    }

    const qs = params.toString();
    return `/vacaciones/solicitudes${qs ? `?${qs}` : ""}`;
  }, [estado]);

  const { data: vacationOptionsItems = [] } = useApiQuery<VacacionListItem[]>({
    url: optionsQueryUrl,
  });

  const collaboratorOptions = useMemo(
    () => {
      const uniqueOptions = new Map<string, string>();

      for (const item of vacationOptionsItems) {
        const collaboratorId = Number(item.id_colaborador);
        if (!Number.isInteger(collaboratorId) || collaboratorId <= 0) continue;

        if (uniqueOptions.has(String(collaboratorId))) continue;

        const colab = item.colaborador;
        const baseName = [colab?.nombre, colab?.primer_apellido, colab?.segundo_apellido]
          .filter(Boolean)
          .join(" ")
          .trim();

        uniqueOptions.set(
          String(collaboratorId),
          baseName ? toTitleCase(baseName) : `Colaborador ${collaboratorId}`,
        );
      }

      return Array.from(uniqueOptions.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    [vacationOptionsItems],
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
    return `/vacaciones/solicitudes${qs ? `?${qs}` : ""}`;
  }, [colaborador, estado]);

  const {
    data: vacaciones = [],
    isLoading,
    refetch,
  } = useApiQuery<VacacionListItem[]>({ url: queryUrl });

  const { mutate: updateVacacionEstado } = useApiMutation<{ nuevo_estado: "APROBADO" | "RECHAZADO" }, VacacionUpdateResponse, number>({
    url: (idSolicitud) => `/vacaciones/solicitud/${idSolicitud}`,
    method: "PATCH",
  });

  const filteredItems = useMemo(() => {
    return sortRequestsByAdminPriority(
      vacaciones,
      (item) => item.estadoSolicitudVacaciones?.estado,
      (item) => item.fecha_inicio,
    );
  }, [vacaciones]);

  const totalCount = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [estado, colaborador]);

  useEffect(() => {
    if (!colaborador) return;
    if (!collaboratorOptions.some((option) => option.value === colaborador)) {
      setColaborador(undefined);
    }
  }, [colaborador, collaboratorOptions]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentCollaboratorId = Number(user?.id ?? 0);
  const canManageItem = useCallback(
    (item: VacacionListItem) => currentCollaboratorId > 0 && item.id_aprobador === currentCollaboratorId,
    [currentCollaboratorId],
  );

  const handleEstado = useCallback(
    async (solicitudId: number, nuevoEstado: "APROBADO" | "RECHAZADO") => {
      setSubmittingId(solicitudId);
      try {
        await updateVacacionEstado(solicitudId, { nuevo_estado: nuevoEstado });
        showToast(
          `Solicitud ${nuevoEstado === "APROBADO" ? "aprobada" : "rechazada"} correctamente`,
          "success",
          "Estado de vacaciones",
        );
        await Promise.all([refetch(), refreshPendientes()]);
      } catch (error) {
        console.error(error);
        showToast("No se pudo actualizar el estado de la solicitud", "error", "Estado de vacaciones");
      } finally {
        setSubmittingId(null);
      }
    },
    [refreshPendientes, refetch, updateVacacionEstado],
  );

  return (
    <Layout pageTitle="Gestión de Vacaciones">
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
          <Stack gap="5" pb="4">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
              {paginatedItems.map((item) => (
                <VacacionSolicitudCard
                  key={item.id_solicitud_vacaciones}
                  item={item}
                  showCollaborator
                  isSubmitting={submittingId === item.id_solicitud_vacaciones}
                  onViewDetail={canManageItem(item) ? setSelectedItem : undefined}
                />
              ))}
            </SimpleGrid>


            <Pagination.Root
              count={totalCount}
              pageSize={PAGE_SIZE}
              page={currentPage}
              onPageChange={(details) => setCurrentPage(details.page)}
            >
              <ButtonGroup variant="ghost" size="sm" wrap="wrap" justifyContent="center">
                <Pagination.PrevTrigger asChild>
                  <IconButton aria-label="Página anterior">
                    <FiChevronLeft />
                  </IconButton>
                </Pagination.PrevTrigger>

                <Pagination.Items
                  render={(page) => (
                    <IconButton
                      aria-label={`Página ${page.value}`}
                      variant={{ base: "ghost", _selected: "outline" }}
                    >
                      {page.value}
                    </IconButton>
                  )}
                />

                <Pagination.NextTrigger asChild>
                  <IconButton aria-label="Página siguiente">
                    <FiChevronRight />
                  </IconButton>
                </Pagination.NextTrigger>
              </ButtonGroup>
            </Pagination.Root>

          </Stack>
        )}

        <VacacionDetalleModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          canManageActions={selectedItem ? canManageItem(selectedItem) : false}
          onApprove={(id) => handleEstado(id, "APROBADO")}
          onDecline={(id) => handleEstado(id, "RECHAZADO")}
          isSubmitting={selectedItem ? submittingId === selectedItem.id_solicitud_vacaciones : false}
        />
      </Stack>
    </Layout>
  );
};
