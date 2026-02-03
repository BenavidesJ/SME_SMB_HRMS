import { Box, Stack, Button as ChakraButton, Badge } from "@chakra-ui/react";
import { Layout } from "../../../../components/layout";
import { useMemo, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { DataTable } from "../../../../components/general/table/DataTable";
import { Modal } from "../../../../components/general";
import { Form, InputField } from "../../../../components/forms";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { Button } from "../../../../components/general/button/Button";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import type { Department, JobPosition } from "../../../../types/Company";
import { toTitleCase } from "../../../../utils";
import { formatCRC } from "../../../../utils";
import type { Status } from "../../../../types";

interface CreateJobPositionPayload {
  nombre?: string;
  departamento?: string;
  sal_base_referencia_min?: number;
  sal_base_referencia_max?: number;
  estado?: string;
};

type CreateJobPositionFormValues = {
  nombre: string;
  departamento: string;
  sal_base_referencia_min: number | string;
  sal_base_referencia_max: number | string;
  estado?: string;
};

export default function Puestos() {
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const { data: puestos = [], isLoading: isTableLoading, refetch } = useApiQuery<JobPosition[]>({ url: "mantenimientos/puestos" });
  const { data: departments = [] } = useApiQuery<Department[]>({ url: "mantenimientos/departamentos" });
  const { data: estados = [] } = useApiQuery<Status[]>({ url: "mantenimientos/estados" });
  const { mutate: createPuesto, isLoading: isSubmitting } =
    useApiMutation<CreateJobPositionPayload, void>({
      url: "mantenimientos/puestos",
      method: "POST",
    });
  const { mutate: patchPuesto } =
    useApiMutation<CreateJobPositionPayload, void, number>({
      url: (id) => `mantenimientos/puestos/${id}`,
      method: "PATCH",
    })
  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const selectedId = useMemo(() => {
    if (selection.length !== 1) return null;
    const id = Number(selection[0]);
    return Number.isFinite(id) ? id : null;
  }, [selection]);

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return puestos.find((r) => r.id === selectedId) ?? null;
  }, [puestos, selectedId]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return puestos.slice(start, start + pageSize);
  }, [puestos, page]);

  const departmentsOptions = useMemo(
    () =>
      departments.map((d) => ({
        label: toTitleCase(d.nombre!),
        value: d.nombre,
      })),
    [departments],
  );

  const statusOptions = useMemo(
    () =>
      estados.map((d) => ({
        label: toTitleCase(d.estado),
        value: d.estado,
      })),
    [estados],
  );

  const columns = useMemo<DataTableColumn<JobPosition>[]>(() => {
    return [
      {
        id: "id",
        header: "ID",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.id}`,
      },
      {
        id: "puesto",
        header: "Puesto de Trabajo",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.puesto}`,
      },
      {
        id: "departamento",
        header: "Departamento",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.departamento}`,
      },
      {
        id: "salario_minimo",
        header: "Salario de Referencia Mínimo",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${formatCRC(r.salario_ref_minimo)}`,
      },
      {
        id: "salario_maximo",
        header: "Salario de Referencia Máximo",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${formatCRC(r.salario_ref_maximo)}`,
      },
      {
        id: "estado",
        header: "Estado",
        minW: "80px",
        textAlign: "center",
        cell: (r) => {
          if (r.estado === "ACTIVO") {
            return (<Badge backgroundColor="blue.600" color="white">{toTitleCase(r.estado)}</Badge>)
          } else if (r.estado === "INACTIVO") {
            return (<Badge backgroundColor="red.600" color="white">{toTitleCase(r.estado)}</Badge>)
          }
        },
      },
    ]
  },
    []);


  const handleCreate = async (values: CreateJobPositionFormValues) => {
    try {
      const min = Number(String(values.sal_base_referencia_min ?? "").replace(/,/g, "").trim());
      const max = Number(String(values.sal_base_referencia_max ?? "").replace(/,/g, "").trim());

      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        throw new Error("Salarios inválidos");
      }
      if (min <= 0 || max <= 0) {
        throw new Error("Los salarios deben ser mayores a 0");
      }
      if (min > max) {
        throw new Error("El salario mínimo no puede ser mayor al máximo");
      }

      const payload: CreateJobPositionPayload = {
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
        departamento: String(values.departamento ?? "").trim(),
        sal_base_referencia_min: min,
        sal_base_referencia_max: max,
      };

      await createPuesto(payload);

      setOpenModal(false);
      setSelection([]);
      setPage(1);
      await refetch();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };


  const handleEdit = async (values: CreateJobPositionPayload) => {
    if (!selectedId) return false;

    try {

      const payload = {
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
        departamento: String(values.departamento ?? "").trim().toUpperCase(),
        sal_base_referencia_min: Number(values.sal_base_referencia_min),
        sal_base_referencia_max: Number(values.sal_base_referencia_max)
      };

      await patchPuesto(selectedId, payload);

      setOpenEditModal(false);
      setSelection([]);
      await refetch();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedId) return;

    const payload = {
      estado: "INACTIVO"
    };

    try {
      await patchPuesto(selectedId, payload);

      setSelection([]);
      setPage(1);
      await refetch();
    } catch (error) {
      console.log(error);
      return false;
    }
  };


  return (
    <Layout pageTitle="Mantenimiento de Puestos">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px" alignContent="center">
            <Button
              appearance="login"
              mt="4"
              size="lg"
              w="100%"
              marginBottom="5"
              onClick={() => setOpenModal(true)}
            >
              Crear Puesto <FiPlus />
            </Button>
          </Box>
        </section>
        <section style={{ marginBottom: "100px" }}>
          <DataTable<JobPosition>
            data={isTableLoading ? [] : pagedRows}
            columns={columns}
            isDataLoading={isTableLoading}
            size="md"
            selection={{
              enabled: true,
              selectedKeys: selection,
              onChange: setSelection,
              getRowKey: (r) => String(r.id),
            }}
            actionBar={{
              enabled: true,
              renderActions: () => (
                <>
                  <ChakraButton
                    variant="solid"
                    colorPalette="red"
                    size="sm"
                    onClick={handleDeleteSelected}
                  >
                    Desactivar
                  </ChakraButton>
                  <ChakraButton
                    variant="solid"
                    colorPalette="yellow"
                    size="sm"
                    disabled={selection.length !== 1}
                    onClick={() => setOpenEditModal(true)}
                  >
                    Editar
                  </ChakraButton>
                </>
              ),
            }}
            pagination={{
              enabled: true,
              page,
              pageSize,
              totalCount: puestos.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>
      <Modal
        title="Crear puesto"
        isOpen={openModal}
        size="lg"
        onOpenChange={(e) => setOpenModal(e.open)}
        content={
          <Form onSubmit={handleCreate} resetOnSuccess>
            <Stack gap="4">
              <InputField
                fieldType="text"
                label="Nombre del puesto"
                name="nombre"
                required
                rules={{
                  required: "El campo es obligatorio",
                  pattern: {
                    value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
                    message: "Solo se permiten letras y espacios",
                  },
                  setValueAs: (v) => String(v ?? "").trim(),
                }}
              />

              <InputField
                fieldType="select"
                label="Departamento"
                name="departamento"
                required
                placeholder={departments.length ? "Seleccione una opción" : "Cargando..."}
                disableSelectPortal
                options={departmentsOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: departments.length === 0 }}
              />

              <InputField
                fieldType="text"
                label="Salario base referencia mínimo"
                startElement="₡"
                name="sal_base_referencia_min"
                required
                rules={{
                  required: "El campo es obligatorio",
                  min: { value: 1, message: "Debe ser mayor a 0" },
                  setValueAs: (v) => Number(String(v ?? "").replace(/,/g, "").trim()),
                }}
              />

              <InputField
                fieldType="text"
                startElement="₡"
                label="Salario base referencia máximo"
                name="sal_base_referencia_max"
                required
                rules={{
                  required: "El campo es obligatorio",
                  min: { value: 1, message: "Debe ser mayor a 0" },
                  setValueAs: (v) => Number(String(v ?? "").replace(/,/g, "").trim()),
                }}
              />

              <Box w="250px" alignContent="center">
                <Button
                  loading={isSubmitting}
                  loadingText="Agregando"
                  appearance="login"
                  type="submit"
                  mt="4"
                  size="lg"
                  w="100%"
                  marginBottom="5"
                >
                  Agregar <FiPlus />
                </Button>
              </Box>
            </Stack>
          </Form>
        }
      />

      <Modal
        title="Editar puesto"
        isOpen={openEditModal}
        size="lg"
        onOpenChange={(e) => setOpenEditModal(e.open)}
        content={
          <Form onSubmit={handleEdit} resetOnSuccess defaultValues={{
            nombre: selectedRow?.puesto,
            departamento: selectedRow?.departamento,
            sal_base_referencia_min: Number(selectedRow?.salario_ref_minimo),
            sal_base_referencia_max: Number(selectedRow?.salario_ref_maximo),
            estado: selectedRow?.estado
          }}>
            <Stack gap="4">
              <InputField
                fieldType="text"
                label="Nombre del puesto"
                name="nombre"
                required
                rules={{
                  required: "El campo es obligatorio",
                  pattern: {
                    value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
                    message: "Solo se permiten letras y espacios",
                  },
                  setValueAs: (v) => String(v ?? "").trim(),
                }}
              />

              <InputField
                fieldType="select"
                label="Departamento"
                name="departamento"
                required
                placeholder={departments.length ? "Seleccione una opción" : "Cargando..."}
                disableSelectPortal
                options={departmentsOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: departments.length === 0 }}
              />

              <InputField
                fieldType="select"
                label="Estado"
                name="estado"
                required
                placeholder={estados.length ? "Seleccione una opción" : "Cargando..."}
                disableSelectPortal
                options={statusOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: estados.length === 0 }}
              />

              <InputField
                fieldType="text"
                label="Salario base referencia mínimo"
                name="sal_base_referencia_min"
                startElement="₡"
                required
                rules={{
                  required: "El campo es obligatorio",
                  min: { value: 1, message: "Debe ser mayor a 0" },
                  setValueAs: (v) => Number(String(v ?? "").replace(/,/g, "").trim()),
                }}
              />

              <InputField
                fieldType="text"
                label="Salario base referencia máximo"
                name="sal_base_referencia_max"
                startElement="₡"
                required
                rules={{
                  required: "El campo es obligatorio",
                  min: { value: 1, message: "Debe ser mayor a 0" },
                  setValueAs: (v) => Number(String(v ?? "").replace(/,/g, "").trim()),
                }}
              />

              <Box w="250px" alignContent="center">
                <Button
                  loading={isSubmitting}
                  loadingText="Actualizando"
                  appearance="login"
                  type="submit"
                  mt="4"
                  size="lg"
                  w="100%"
                  marginBottom="5"
                >
                  Agregar <FiPlus />
                </Button>
              </Box>
            </Stack>
          </Form>
        }
      />
    </Layout>
  );
}
