import { useParams } from "react-router";
import { useCallback, useMemo, useState } from "react";
import type {
  Contrato,
  CreateContractForm,
  EmployeeRow,
  Puesto,
  TipoJornada,
} from "../../../../../types";
import {
  createAndAssignContract,
  patchContract,
} from "../../../../../services/api/employees";
import {
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  Card,
  EmptyState,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiEdit2, FiFilePlus, FiFileText } from "react-icons/fi";
import { Form, InputField } from "../../../../../components/forms";
import { toTitleCase } from "../../../../../utils";
import { showToast } from "../../../../../services/toast/toastService";
import { Modal } from "../../../../../components/general";
import { mapFormToPayload } from "../components/mapContractFormToPayload";
import { DataTable } from "../../../../../components/general/table/DataTable";
import type { DataTableColumn } from "../../../../../components/general/table/types";
import { type TipoContratoRow } from "../../../../../services/api/tiposContrato";
import { useApiQuery } from "../../../../../hooks/useApiQuery";
import { Layout } from "../../../../../components/layout";

/* ── helpers ── */

const InfoBlock = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <Stack gap="0.5">
    <Text textStyle="xs" color="fg.muted" textTransform="uppercase">
      {label}
    </Text>
    <Text fontWeight="semibold">{value ?? "—"}</Text>
  </Stack>
);

const formatMoneyCRC = (value: string | number) => {
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return String(value);
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 2,
  }).format(num);
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const formatted = d.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const DAY_LABELS: Record<string, string> = {
  L: "Lunes",
  K: "Martes",
  M: "Miércoles",
  J: "Jueves",
  V: "Viernes",
  S: "Sábado",
  D: "Domingo",
};

const getLastHorario = (r: Contrato) => {
  const hs = r.horarios ?? [];
  if (!hs.length) return null;
  const sorted = [...hs].sort((a, b) =>
    String(b.fecha_actualizacion ?? "").localeCompare(
      String(a.fecha_actualizacion ?? ""),
    ),
  );
  return sorted[0];
};

/* ── component ── */

export default function ColaboradorDetalle() {
  const { id } = useParams<{ id: string }>();
  const { data: employee, isLoading: isEmployeeLoading } = useApiQuery<EmployeeRow>({ url: `/empleados/${id}` });
  const { data: contracts = [], isLoading: isContractsLoading, refetch: refetchContracts } = useApiQuery<Contrato[]>({ url: `empleados/${id}/contratos`, enabled: Boolean(id) });
  const { data: tiposJornada = [] } = useApiQuery<TipoJornada[]>({ url: "mantenimientos/tipos-jornada" });
  const { data: positions = [] } = useApiQuery<Puesto[]>({ url: "mantenimientos/puestos" });
  const { data: tipoContratos = [] } = useApiQuery<TipoContratoRow[]>({ url: "mantenimientos/tipos-contrato" });

  const [openModal, setOpenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const mapToOptions = useCallback(
    (items: string[]) => items.map((v) => ({ label: toTitleCase(v), value: v })),
    [],
  );
  const mapContractTypesToOptions = useCallback(
    (items: TipoContratoRow[]) => items.map((v) => ({ label: toTitleCase(v.tipo_contrato), value: v.tipo_contrato })),
    [],
  );

  const positionsOptions = useMemo(
    () => mapToOptions(positions.map((p) => p.puesto)),
    [positions, mapToOptions],
  );

  const contractTypesOptions = useMemo(
    () => mapContractTypesToOptions(tipoContratos),
    [tipoContratos, mapContractTypesToOptions],
  );

  const tipoJornadaOptions = useMemo(
    () => mapToOptions(tiposJornada.map((t) => t.tipo)),
    [tiposJornada, mapToOptions],
  );

  const fullName = useMemo(() => {
    if (!employee) return "";
    const { nombre, primer_apellido, segundo_apellido } = employee;
    return `${nombre} ${primer_apellido} ${segundo_apellido}`.trim();
  }, [employee]);

  const diasOptions = useMemo(
    () => [
      { label: "Lunes", value: "L" },
      { label: "Martes", value: "K" },
      { label: "Miércoles", value: "M" },
      { label: "Jueves", value: "J" },
      { label: "Viernes", value: "V" },
      { label: "Sábado", value: "S" },
      { label: "Domingo", value: "D" },
    ],
    [],
  );

  const pagedContracts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return contracts.slice(start, start + pageSize);
  }, [contracts, page]);

  const handleCreateContract = async (form: CreateContractForm) => {
    try {
      setIsSubmitting(true);

      const idColaborador = Number(id);
      if (!Number.isInteger(idColaborador) || idColaborador <= 0) {
        throw new Error("ID de colaborador inválido");
      }

      const payload = mapFormToPayload(form, idColaborador);
      await createAndAssignContract(payload);

      showToast("Contrato creado correctamente.", "success");
      setOpenModal(false);

      await refetchContracts();
    } catch (error) {
      console.log(error);
      showToast("Error al crear el contrato.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── active contract (latest) ── */
  const activeContract = useMemo(() => {
    if (!contracts.length) return null;
    const sorted = [...contracts].sort((a, b) =>
      String(b.fecha_inicio).localeCompare(String(a.fecha_inicio)),
    );
    return sorted[0];
  }, [contracts]);

  const activeHorario = activeContract ? getLastHorario(activeContract) : null;

  /* ── edit contract ── */
  const [openEditContractModal, setOpenEditContractModal] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);

  const estadoOptions = useMemo(
    () => [
      { label: "Activo", value: "ACTIVO" },
      { label: "Inactivo", value: "INACTIVO" },
    ],
    [],
  );

  const editContractDefaults = useMemo(() => {
    if (!activeContract) return undefined;
    const h = getLastHorario(activeContract);
    return {
      puesto: activeContract.puesto,
      tipo_contrato: activeContract.tipo_contrato,
      tipo_jornada: activeContract.tipo_jornada,
      salario_base: Number(activeContract.salario_base),
      fecha_inicio: activeContract.fecha_inicio,
      estado: activeContract.estado ?? undefined,
      hora_inicio: h?.hora_inicio ?? "",
      hora_fin: h?.hora_fin ?? "",
      dias_laborales: h?.dias_laborales?.split("") ?? [],
      dias_libres: h?.dias_libres?.split("") ?? [],
    };
  }, [activeContract]);

  type EditContractFormValues = {
    puesto: string;
    tipo_contrato: string;
    tipo_jornada: string;
    salario_base: number | string;
    fecha_inicio: string;
    estado: string;
    hora_inicio: string;
    hora_fin: string;
    dias_laborales: string[];
    dias_libres: string[];
  };

  const handleEditContract = async (form: EditContractFormValues) => {
    if (!activeContract || !id) return;
    try {
      setIsEditingContract(true);

      const patch: Record<string, unknown> = {
        puesto: String(form.puesto).trim(),
        tipo_contrato: String(form.tipo_contrato).trim(),
        tipo_jornada: String(form.tipo_jornada).trim(),
        salario_base: Number(form.salario_base),
        fecha_inicio: String(form.fecha_inicio).trim(),
        estado: String(form.estado).trim(),
      };

      await patchContract(Number(id), activeContract.id_contrato, patch);

      showToast("Contrato actualizado correctamente.", "success");
      setOpenEditContractModal(false);
      await refetchContracts();
    } catch (error) {
      console.log(error);
      showToast("Error al actualizar el contrato.", "error");
    } finally {
      setIsEditingContract(false);
    }
  };

  /* ── table columns ── */
  const columns = useMemo<DataTableColumn<Contrato>[]>(() => {
    return [
      {
        id: "id_contrato",
        header: "ID",
        minW: "70px",
        textAlign: "center",
        cell: (r) => String(r.id_contrato),
      },
      {
        id: "puesto",
        header: "Puesto",
        minW: "200px",
        textAlign: "center",
        cell: (r) => toTitleCase(r.puesto),
      },
      {
        id: "tipo_contrato",
        header: "Tipo contrato",
        minW: "140px",
        textAlign: "center",
        cell: (r) => toTitleCase(r.tipo_contrato),
      },
      {
        id: "tipo_jornada",
        header: "Tipo jornada",
        minW: "140px",
        textAlign: "center",
        cell: (r) => toTitleCase(r.tipo_jornada),
      },
      {
        id: "fecha_inicio",
        header: "Fecha inicio",
        minW: "130px",
        textAlign: "center",
        cell: (r) => formatDate(r.fecha_inicio),
      },
      {
        id: "salario_base",
        header: "Salario base",
        minW: "160px",
        textAlign: "center",
        cell: (r) => formatMoneyCRC(r.salario_base),
      },
      {
        id: "horas_semanales",
        header: "Horas/sem",
        minW: "120px",
        textAlign: "center",
        cell: (r) => String(r.horas_semanales),
      },
      {
        id: "horario",
        header: "Horario",
        minW: "180px",
        textAlign: "center",
        cell: (r) => {
          const h = getLastHorario(r);
          if (!h) return <Badge variant="subtle">Sin horario</Badge>;
          return `${h.hora_inicio} - ${h.hora_fin}`;
        },
      },
      {
        id: "dias",
        header: "Días",
        minW: "200px",
        textAlign: "center",
        cell: (r) => {
          const h = getLastHorario(r);
          if (!h) return <Badge variant="subtle">N/A</Badge>;

          return (
            <HStack justify="center" gap="1" wrap="wrap">
              {h.dias_laborales.split("").map((d) => (
                <Badge key={d} variant="surface" size="sm">
                  {DAY_LABELS[d] ?? d}
                </Badge>
              ))}
            </HStack>
          );
        },
      },
    ];
  }, []);

  const isTableLoading = isEmployeeLoading || isContractsLoading;

  /* ── render ── */
  return (
    <Layout pageTitle="Perfil Profesional">
      <Stack gap="8">
        {/* ═══ Profile header card ═══ */}
        <Card.Root>
          <Card.Body>
            {isEmployeeLoading ? (
              <Stack align="center" py="6">
                <Spinner size="lg" />
              </Stack>
            ) : (
              <Stack
                direction={{ base: "column", md: "row" }}
                align="center"
                gap="6"
              >
                <Avatar.Root size="2xl">
                  <Avatar.Fallback name={fullName} />
                </Avatar.Root>

                <Stack align={{ base: "center", md: "flex-start" }} gap="1">
                  <Heading size="lg">{fullName}</Heading>
                  <Text color="fg.muted">
                    {employee?.correo_electronico ?? "Sin correo"}
                  </Text>
                  <Text color="fg.muted">
                    {employee?.usuario?.username ?? "Sin usuario"}
                  </Text>
                  <Flex gap="2" mt="1">
                    {employee?.estado?.nombre && (
                      <Badge
                        colorPalette={employee.estado.nombre === "ACTIVO" ? "blue" : "red"}
                      >
                        {toTitleCase(employee.estado.nombre)}
                      </Badge>
                    )}
                    {employee?.usuario?.rol && (
                      <Badge variant="surface">{employee.usuario.rol}</Badge>
                    )}
                  </Flex>
                </Stack>
              </Stack>
            )}
          </Card.Body>
        </Card.Root>

        {/* ═══ Info cards ═══ */}
        {!isEmployeeLoading && employee && (
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
            gap="6"
          >
            {/* ── Personal info ── */}
            <GridItem colSpan={1}>
              <Card.Root h="full">
                <Card.Header>
                  <Card.Title>Información Personal</Card.Title>
                </Card.Header>
                <Card.Body>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
                    <InfoBlock label="Nombre" value={employee.nombre} />
                    <InfoBlock label="Primer apellido" value={employee.primer_apellido} />
                    <InfoBlock label="Segundo apellido" value={employee.segundo_apellido} />
                    <InfoBlock label="Identificación" value={employee.identificacion} />
                    <InfoBlock label="Estado civil" value={employee.estado_civil?.nombre ? toTitleCase(employee.estado_civil.nombre) : null} />
                    <InfoBlock label="Fecha de nacimiento" value={formatDate(employee.fecha_nacimiento)} />
                    <InfoBlock label="Teléfono" value={employee.telefono} />
                  </SimpleGrid>
                </Card.Body>
              </Card.Root>
            </GridItem>

            {/* ── Current contract info ── */}
            <GridItem colSpan={1}>
              <Card.Root h="full">
                <Card.Header>
                  <Flex justify="space-between" align="center">
                    <Card.Title>Contrato Vigente</Card.Title>
                    {activeContract && (
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="blue"
                        onClick={() => setOpenEditContractModal(true)}
                      >
                        <FiEdit2 /> Editar
                      </Button>
                    )}
                  </Flex>
                </Card.Header>
                <Card.Body>
                  {activeContract ? (
                    <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
                      <InfoBlock label="Puesto" value={toTitleCase(activeContract.puesto)} />
                      <InfoBlock label="Tipo de contrato" value={toTitleCase(activeContract.tipo_contrato)} />
                      <InfoBlock label="Tipo de jornada" value={toTitleCase(activeContract.tipo_jornada)} />
                      <InfoBlock label="Salario base" value={formatMoneyCRC(activeContract.salario_base)} />
                      <InfoBlock label="Fecha de inicio" value={formatDate(activeContract.fecha_inicio)} />
                      <InfoBlock label="Horas semanales" value={activeContract.horas_semanales} />
                      <InfoBlock
                        label="Horario"
                        value={activeHorario ? `${activeHorario.hora_inicio} – ${activeHorario.hora_fin}` : null}
                      />
                      <Stack gap="0.5">
                        <Text textStyle="xs" color="fg.muted" textTransform="uppercase">
                          Días laborales
                        </Text>
                        {activeHorario?.dias_laborales ? (
                          <HStack gap="1" wrap="wrap">
                            {activeHorario.dias_laborales.split("").map((d) => (
                              <Badge key={d} variant="surface" size="sm">
                                {DAY_LABELS[d] ?? d}
                              </Badge>
                            ))}
                          </HStack>
                        ) : (
                          <Text fontWeight="semibold">—</Text>
                        )}
                      </Stack>
                    </SimpleGrid>
                  ) : (
                    <Text color="fg.muted">Sin contrato vigente.</Text>
                  )}
                </Card.Body>
              </Card.Root>
            </GridItem>

            {/* ── Address info ── */}
            {employee.direccion && (
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Card.Root>
                  <Card.Header>
                    <Card.Title>Dirección</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <SimpleGrid columns={{ base: 1, sm: 4 }} gap="4">
                      <InfoBlock label="Provincia" value={employee.direccion.provincia} />
                      <InfoBlock label="Cantón" value={employee.direccion.canton} />
                      <InfoBlock label="Distrito" value={employee.direccion.distrito} />
                      <InfoBlock label="Otros datos" value={employee.direccion.otros_datos} />
                    </SimpleGrid>
                  </Card.Body>
                </Card.Root>
              </GridItem>
            )}
          </Grid>
        )}

        {/* ═══ Contracts table ═══ */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Card.Title>Historial de Contratos</Card.Title>
              <Button
                size="sm"
                colorPalette="blue"
                onClick={() => setOpenModal(true)}
              >
                Nuevo contrato <FiFilePlus />
              </Button>
            </Flex>
          </Card.Header>
          <Card.Body>
            {!isTableLoading && contracts.length > 0 && (
              <DataTable<Contrato>
                data={isTableLoading ? [] : pagedContracts}
                columns={columns}
                isDataLoading={isTableLoading}
                size="md"
                selection={{
                  enabled: true,
                  selectedKeys: selection,
                  onChange: setSelection,
                  getRowKey: (r) => String(r.id_contrato),
                }}
                actionBar={{
                  enabled: contracts.length > 0,
                  renderActions: (count) => (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={count === 0}
                      >
                        Desactivar ({count})
                      </Button>
                    </>
                  ),
                }}
                pagination={{
                  enabled: true,
                  page,
                  pageSize,
                  totalCount: contracts.length,
                  onPageChange: setPage,
                }}
              />
            )}

            {!isTableLoading && contracts.length === 0 && (
              <EmptyState.Root
                colorPalette="blue"
                h="300px"
                border="0.15rem dashed"
                borderColor="blue.600"
                alignContent="center"
              >
                <EmptyState.Content>
                  <EmptyState.Indicator>
                    <FiFileText />
                  </EmptyState.Indicator>
                  <VStack textAlign="center">
                    <EmptyState.Title>
                      {fullName} aún no tiene contratos para mostrar.
                    </EmptyState.Title>
                    <EmptyState.Description>
                      Empieza creando un contrato para este colaborador.
                    </EmptyState.Description>
                  </VStack>
                  <ButtonGroup>
                    <Button onClick={() => setOpenModal(true)}>
                      Crear contrato <FiFilePlus />
                    </Button>
                  </ButtonGroup>
                </EmptyState.Content>
              </EmptyState.Root>
            )}

            {isTableLoading && (
              <Stack align="center" py="10">
                <Spinner size="lg" />
              </Stack>
            )}
          </Card.Body>
        </Card.Root>
      </Stack>

      {/* ═══ Create contract modal ═══ */}
      <Modal
        title="Crear contrato"
        isOpen={openModal}
        size="lg"
        onOpenChange={(e) => setOpenModal(e.open)}
        content={
          <Form onSubmit={handleCreateContract}>
            <SimpleGrid columns={2} gapX="1rem">
              <InputField
                fieldType="select"
                label="Puesto"
                name="puesto"
                required
                placeholder={positions.length ? "Seleccione una opción" : "Cargando..."}
                disableSelectPortal
                options={positionsOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: positions.length === 0 }}
              />

              <InputField
                fieldType="select"
                label="Tipo de Contrato"
                name="tipo_contrato"
                required
                placeholder={tipoContratos.length ? "Seleccione una opción" : "Cargando..."}
                disableSelectPortal
                options={contractTypesOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: tipoContratos.length === 0 }}
              />

              <InputField
                fieldType="select"
                label="Tipo de Jornada"
                name="tipo_jornada"
                required
                placeholder={tiposJornada.length ? "Seleccione una opción" : "Cargando..."}
                disableSelectPortal
                options={tipoJornadaOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: tiposJornada.length === 0 }}
              />

              <InputField
                fieldType="number"
                label="Salario Base"
                name="salario_base"
                required
                rules={{ required: "El campo es obligatorio" }}
              />

              <InputField
                fieldType="date"
                label="Fecha de Ingreso"
                name="fecha_ingreso"
                required
                rules={{ required: "El campo es obligatorio" }}
              />
            </SimpleGrid>

            <Heading mt="3">Horario Laboral</Heading>

            <SimpleGrid columns={2} gapX="1rem">
              <InputField
                fieldType="time"
                label="Hora de Entrada"
                name="hora_inicio"
                required
                rules={{ required: "El campo es obligatorio" }}
              />

              <InputField
                fieldType="time"
                label="Hora de Salida"
                name="hora_fin"
                required
                rules={{ required: "El campo es obligatorio" }}
              />

              <InputField
                fieldType="select"
                label="Días Laborales"
                name="dias_laborales"
                options={diasOptions}
                disableSelectPortal
                selectRootProps={{ multiple: true }}
                required
                rules={{ required: "El campo es obligatorio" }}
              />

              <InputField
                fieldType="select"
                label="Días Libres"
                name="dias_libres"
                options={diasOptions}
                disableSelectPortal
                selectRootProps={{ multiple: true }}
                required
                rules={{ required: "El campo es obligatorio" }}
              />
            </SimpleGrid>

            <Button
              mt="4"
              fontWeight="semibold"
              colorPalette="blue"
              loadingText="Creando contrato..."
              loading={isSubmitting}
              type="submit"
            >
              Crear contrato
            </Button>
          </Form>
        }
      />

      {/* ═══ Edit contract modal ═══ */}
      <Modal
        title="Editar contrato vigente"
        isOpen={openEditContractModal}
        size="lg"
        onOpenChange={(e) => setOpenEditContractModal(e.open)}
        content={
          !activeContract ? (
            <Text p="6" color="fg.muted">No hay contrato vigente para editar.</Text>
          ) : (
            <Form
              key={activeContract.id_contrato}
              onSubmit={handleEditContract}
              defaultValues={editContractDefaults}
            >
              <SimpleGrid columns={2} gapX="1rem">
                <InputField
                  fieldType="select"
                  label="Puesto"
                  name="puesto"
                  required
                  placeholder={positions.length ? "Seleccione una opción" : "Cargando..."}
                  disableSelectPortal
                  options={positionsOptions}
                  rules={{ required: "El campo es obligatorio" }}
                  selectRootProps={{ disabled: positions.length === 0 }}
                />

                <InputField
                  fieldType="select"
                  label="Tipo de Contrato"
                  name="tipo_contrato"
                  required
                  placeholder={tipoContratos.length ? "Seleccione una opción" : "Cargando..."}
                  disableSelectPortal
                  options={contractTypesOptions}
                  rules={{ required: "El campo es obligatorio" }}
                  selectRootProps={{ disabled: tipoContratos.length === 0 }}
                />

                <InputField
                  fieldType="select"
                  label="Tipo de Jornada"
                  name="tipo_jornada"
                  required
                  placeholder={tiposJornada.length ? "Seleccione una opción" : "Cargando..."}
                  disableSelectPortal
                  options={tipoJornadaOptions}
                  rules={{ required: "El campo es obligatorio" }}
                  selectRootProps={{ disabled: tiposJornada.length === 0 }}
                />

                <InputField
                  fieldType="number"
                  label="Salario Base"
                  name="salario_base"
                  required
                  rules={{ required: "El campo es obligatorio" }}
                />

                <InputField
                  fieldType="date"
                  label="Fecha de Inicio"
                  name="fecha_inicio"
                  required
                  rules={{ required: "El campo es obligatorio" }}
                />

                <InputField
                  fieldType="select"
                  label="Estado"
                  name="estado"
                  required
                  disableSelectPortal
                  options={estadoOptions}
                  rules={{ required: "El campo es obligatorio" }}
                />
              </SimpleGrid>

              <Button
                mt="4"
                fontWeight="semibold"
                colorPalette="blue"
                loadingText="Actualizando contrato..."
                loading={isEditingContract}
                type="submit"
              >
                Actualizar contrato
              </Button>
            </Form>
          )
        }
      />
    </Layout>
  );
}
