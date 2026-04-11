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
import { PermisoDetalleModal } from "./components/PermisoDetalleModal";
import { PermisoSolicitudCard } from "./components/PermisoSolicitudCard";
import type { PermisoListItem, PermisoUpdateResponse } from "./types";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const PAGE_SIZE = 6;

export const GestionPermisos = () => {
  const { user } = useAuth();
  const { refreshPendientes } = usePendientesAprobacion();
  const [estado, setEstado] = useState<string | undefined>(undefined);
  const [colaborador, setColaborador] = useState<string | undefined>(undefined);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<PermisoListItem | null>(null);

  const optionsQueryUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (estado) {
      params.set("estado", estado);
    }

    const qs = params.toString();
    return `/permisos/solicitudes${qs ? `?${qs}` : ""}`;
  }, [estado]);

  const { data: permisoOptionsItems = [] } = useApiQuery<PermisoListItem[]>({
    url: optionsQueryUrl,
  });

  const collaboratorOptions = useMemo(
    () => {
      const uniqueOptions = new Map<string, string>();

      for (const item of permisoOptionsItems) {
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
    [permisoOptionsItems],
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
    (item: PermisoListItem) => currentCollaboratorId > 0 && item.id_aprobador === currentCollaboratorId,
    [currentCollaboratorId],
  );

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
          <Stack gap="5" pb="4">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
              {paginatedItems.map((item) => (
                <PermisoSolicitudCard
                  key={item.id_solicitud}
                  item={item}
                  showCollaborator
                  isSubmitting={submittingId === item.id_solicitud}
                  onViewDetail={canManageItem(item) ? setSelectedItem : undefined}
                />
              ))}
            </SimpleGrid>

            {totalCount > PAGE_SIZE && (
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
            )}
          </Stack>
        )}

        <PermisoDetalleModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          canManageActions={selectedItem ? canManageItem(selectedItem) : false}
          onApprove={(id) => handleEstado(id, "APROBADO")}
          onDecline={(id) => handleEstado(id, "RECHAZADO")}
          isSubmitting={selectedItem ? submittingId === selectedItem.id_solicitud : false}
        />
      </Stack>
    </Layout>
  );
};
