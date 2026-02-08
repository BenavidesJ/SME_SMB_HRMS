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
} from "../../../../../services/api/employees";
import {
  Badge,
  Button,
  ButtonGroup,
  EmptyState,
  Heading,
  HStack,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react";
import { FiFilePlus, FiFileText } from "react-icons/fi";
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

  const computeFullName = useCallback(() => {
    if (!employee) return "";
    const { nombre, primer_apellido, segundo_apellido } = employee;
    return `${nombre} ${primer_apellido} ${segundo_apellido}`;
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

      // refrescar tabla
      await refetchContracts();
    } catch (error) {
      console.log(error);
      showToast("Error al crear el contrato.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo<DataTableColumn<Contrato>[]>(() => {
    const formatMoneyCRC = (value: string | number) => {
      const num = typeof value === "string" ? Number(value) : value;
      if (!Number.isFinite(num)) return String(value);
      return new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        maximumFractionDigits: 2,
      }).format(num);
    };

    const formatDate = (iso: string) => {
      const d = new Date(`${iso}T00:00:00`);
      return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-CR");
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
            <HStack justify="center" gap="2" wrap="wrap">
              <Badge variant="surface">Lab: {h.dias_laborales}</Badge>
              <Badge variant="surface">Lib: {h.dias_libres}</Badge>
            </HStack>
          );
        },
      },
    ];
  }, []);

  const isTableLoading = isEmployeeLoading || isContractsLoading;
  const hasContracts = contracts.length > 0;

  return (
    <Layout pageTitle={`Vínculo laboral de ${computeFullName()} con BioAlquimia`}>
      {
        !isTableLoading && hasContracts && (
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
                    onClick={() => setOpenModal(true)}
                  >
                    Nuevo contrato
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={count !== 1}
                  >
                    Editar ({count})
                  </Button>

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
        )
      }

      {!isTableLoading && contracts.length === 0 && (
        <EmptyState.Root
          colorPalette="blue"
          h="500px"
          border="0.15rem dashed"
          borderColor="blue.600"
          alignContent="center"
          mt="2rem"
        >
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiFileText />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>
                {computeFullName()} aún no tiene contratos para mostrar.
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
    </Layout>
  );
}
