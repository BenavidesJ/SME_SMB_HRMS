import {
  ButtonGroup,
  HStack,
  IconButton,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  createListCollection,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router";
import { EmptyStateIndicator } from "../../../components/general";
import { Layout } from "../../../components/layout";
import { useAuth } from "../../../context/AuthContext";
import { useApiQuery } from "../../../hooks/useApiQuery";
import type { EmployeeRow, EmployeeUserInfo, IncapacidadGrupo, TipoIncapacidad } from "../../../types";
import { toTitleCase } from "../../../utils";
import { IncapacidadCard } from "./components/IncapacidadCard";

const PAGE_SIZE = 6;

const normalizeTipo = (value?: string | null) => String(value ?? "").replace(/_/g, " ").trim().toUpperCase();

const isUsuarioActivo = (usuario?: EmployeeUserInfo | null) => {
  if (!usuario) return false;
  if (typeof usuario.estado === "string") return usuario.estado.toUpperCase() === "ACTIVO";
  if (typeof usuario.estado === "number") return usuario.estado === 1;
  return Boolean(usuario.estado);
};

export const GestionIncapacidades = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: employees = [], isLoading: isEmployeesLoading } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });
  const { data: tiposIncapacidad = [] } = useApiQuery<TipoIncapacidad[]>({ url: "mantenimientos/tipos-incapacidad" });

  const {
    data: incapacidades = [],
    isLoading: isLoadingIncapacidades,
  } = useApiQuery<IncapacidadGrupo[]>({
    url: selectedCollaboratorId ? `incapacidades/colaborador/${selectedCollaboratorId}` : "",
    enabled: Boolean(selectedCollaboratorId),
  });

  const colaboradoresActivos = useMemo(
    () =>
      (employees ?? []).filter((colaborador) => {
        const estadoNombre = (colaborador.estado?.nombre ?? "").toUpperCase();
        return estadoNombre === "ACTIVO" && isUsuarioActivo(colaborador.usuario);
      }),
    [employees],
  );

  const collaboratorCollection = useMemo(
    () =>
      createListCollection({
        items: colaboradoresActivos.map((colaborador) => {
          const fullName = [colaborador.nombre, colaborador.primer_apellido, colaborador.segundo_apellido]
            .filter(Boolean)
            .join(" ")
            .trim();

          const displayName = fullName ? toTitleCase(fullName) : `Colaborador ${colaborador.id}`;
          const suffix = Number(colaborador.id) === Number(user?.id) ? " (Yo)" : "";

          return {
            label: `${displayName}${suffix}`,
            value: String(colaborador.id),
          };
        }),
      }),
    [colaboradoresActivos, user?.id],
  );

  const tipoCollection = useMemo(
    () =>
      createListCollection({
        items: tiposIncapacidad.map((tipo) => ({
          label: toTitleCase(tipo.nombre),
          value: normalizeTipo(tipo.nombre),
        })),
      }),
    [tiposIncapacidad],
  );

  const filteredItems = useMemo(() => {
    const sorted = [...incapacidades].sort((left, right) =>
      String(right.fecha_inicio ?? "").localeCompare(String(left.fecha_inicio ?? "")),
    );

    if (!tipoFilter) return sorted;

    return sorted.filter((item) => normalizeTipo(item.tipo_incapacidad) === tipoFilter);
  }, [incapacidades, tipoFilter]);

  useEffect(() => {
    setPage(1);
  }, [selectedCollaboratorId, tipoFilter]);

  const totalCount = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredItems, page]);

  const handleViewDetail = (item: IncapacidadGrupo) => {
    if (!item.numero_boleta) return;
    const params = new URLSearchParams({ origen: "gestion" });
    if (selectedCollaboratorId) {
      params.set("colaborador", selectedCollaboratorId);
    }
    navigate(`/incapacidades/${encodeURIComponent(item.numero_boleta)}?${params.toString()}`);
  };

  return (
    <Layout pageTitle="Gestión de Incapacidades">
      <Stack gap="5" minH={{ base: "auto", lg: "calc(100vh - 13rem)" }} pb="6">
        <HStack gap="3" wrap="wrap" align="stretch">
          <Select.Root
            collection={collaboratorCollection}
            value={selectedCollaboratorId ? [selectedCollaboratorId] : []}
            onValueChange={(event) => setSelectedCollaboratorId(event.value?.[0] ?? "")}
            width={{ base: "100%", md: "320px" }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder={isEmployeesLoading ? "Cargando colaboradores..." : "Filtrar por colaborador"} />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
                <Select.ClearTrigger />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {collaboratorCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>

          <Select.Root
            collection={tipoCollection}
            value={tipoFilter ? [tipoFilter] : []}
            onValueChange={(event) => setTipoFilter(event.value?.[0] ?? "")}
            width={{ base: "100%", md: "260px" }}
            disabled={!selectedCollaboratorId}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Filtrar por tipo" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
                <Select.ClearTrigger />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {tipoCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </HStack>

        {!selectedCollaboratorId && (
          <EmptyStateIndicator
            title="Seleccione un colaborador para consultar"
            variant="compact"
          />
        )}

        {selectedCollaboratorId && !isLoadingIncapacidades && filteredItems.length === 0 && (
          <EmptyStateIndicator
            title="No hay incapacidades registradas"
            variant="compact"
          />
        )}

        {selectedCollaboratorId && filteredItems.length > 0 && (
          <Stack gap="5" pb="4">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
              {paginatedItems.map((item, index) => (
                <IncapacidadCard
                  key={item.numero_boleta ?? `${item.fecha_inicio}-${index}`}
                  item={item}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </SimpleGrid>

            {totalCount > PAGE_SIZE && (
              <Pagination.Root
                count={totalCount}
                pageSize={PAGE_SIZE}
                page={page}
                onPageChange={(details) => setPage(details.page)}
              >
                <ButtonGroup variant="ghost" size="sm" wrap="wrap" justifyContent="center">
                  <Pagination.PrevTrigger asChild>
                    <IconButton aria-label="Página anterior">
                      <FiChevronLeft />
                    </IconButton>
                  </Pagination.PrevTrigger>

                  <Pagination.Items
                    render={(item) => (
                      <IconButton
                        aria-label={`Página ${item.value}`}
                        variant={{ base: "ghost", _selected: "outline" }}
                      >
                        {item.value}
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
      </Stack>
    </Layout>
  );
};
