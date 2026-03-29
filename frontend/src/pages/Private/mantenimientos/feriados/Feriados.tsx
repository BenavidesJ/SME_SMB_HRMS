import { useMemo, useState } from "react";
import { Box, Stack, Button as ChakraButton } from "@chakra-ui/react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { Layout } from "../../../../components/layout";
import { DataTable } from "../../../../components/general/table/DataTable";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { Modal } from "../../../../components/general";
import { Form, InputField } from "../../../../components/forms";
import { Button } from "../../../../components/general/button/Button";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import { apiRequest } from "../../../../services/api";

const BASE_URL = "mantenimientos/feriados";

const BOOLEAN_OPTIONS = [
  { label: "Sí", value: "true" },
  { label: "No", value: "false" },
];

type FeriadoRow = { id: number; fecha: string; nombre: string; es_obligatorio: boolean };

type CreateFormValues = { fecha: string; nombre: string; es_obligatorio: string };
type UpdateFormValues = { fecha: string; nombre: string; es_obligatorio: string };

type CreatePayload = { fecha: string; nombre: string; es_obligatorio: boolean };
type UpdatePayload = { fecha?: string; nombre?: string; es_obligatorio?: boolean };

const Feriados = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingRow, setEditingRow] = useState<FeriadoRow | null>(null);

  const { data: feriados = [], isLoading: isTableLoading, refetch } = useApiQuery<FeriadoRow[]>({ url: BASE_URL });

  const { mutate: createFeriado, isLoading: isCreating } = useApiMutation<CreatePayload, FeriadoRow>({
    url: BASE_URL,
    method: "POST",
  });

  const { mutate: updateFeriado, isLoading: isUpdating } = useApiMutation<UpdatePayload, FeriadoRow, number>({
    url: (id) => `${BASE_URL}/${id}`,
    method: "PATCH",
  });

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return feriados.slice(start, start + pageSize);
  }, [feriados, page]);

  const columns = useMemo<DataTableColumn<FeriadoRow>[]>(() => {
    return [
      { id: "id", header: "ID", minW: "80px", textAlign: "center", cell: (row) => String(row.id) },
      { id: "fecha", header: "Fecha", minW: "140px", cell: (row) => row.fecha },
      { id: "nombre", header: "Nombre", minW: "220px", cell: (row) => row.nombre },
      {
        id: "obligatorio",
        header: "Obligatorio",
        minW: "120px",
        textAlign: "center",
        cell: (row) => (row.es_obligatorio ? "Sí" : "No"),
      },
    ];
  }, []);

  const handleCreate = async (values: CreateFormValues) => {
    try {
      const payload: CreatePayload = {
        fecha: String(values.fecha ?? "").trim(),
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
        es_obligatorio: values.es_obligatorio === "true",
      };

      await createFeriado(payload);

      setOpenCreate(false);
      setPage(1);
      await refetch();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleEdit = async (values: UpdateFormValues) => {
    if (!editingRow) return false;

    try {
      const payload: UpdatePayload = {
        fecha: String(values.fecha ?? "").trim(),
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
        es_obligatorio: values.es_obligatorio === "true",
      };

      await updateFeriado(editingRow.id, payload);

      setOpenEdit(false);
      setEditingRow(null);
      await refetch();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest<void>({ url: `${BASE_URL}/${id}`, method: "DELETE" });
      setPage(1);
      await refetch();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Layout pageTitle="Feriados">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px">
            <Button
              appearance="login"
              size="lg"
              w="100%"
              onClick={() => setOpenCreate(true)}
            >
              Registrar feriado <FiPlus />
            </Button>
          </Box>
        </section>

        <section style={{ marginBottom: "100px" }}>
          <DataTable<FeriadoRow>
            data={isTableLoading ? [] : pagedRows}
            columns={columns}
            isDataLoading={isTableLoading}
            size="md"
            actionColumn={{
              header: "Acciones",
              cell: (row) => (
                <Stack direction="row" gap="2" justifyContent="flex-end">
                  <ChakraButton
                    variant="subtle"
                    colorPalette="yellow"
                    size="sm"
                    onClick={() => {
                      setEditingRow(row);
                      setOpenEdit(true);
                    }}
                  >
                    <FiEdit2 /> Editar
                  </ChakraButton>
                  <ChakraButton
                    variant="subtle"
                    colorPalette="red"
                    size="sm"
                    onClick={() => handleDelete(row.id)}
                  >
                    <FiTrash2 /> Eliminar
                  </ChakraButton>
                </Stack>
              ),
            }}
            pagination={{
              enabled: true,
              page,
              pageSize,
              totalCount: feriados.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>

      <Modal
        title="Registrar feriado"
        isOpen={openCreate}
        size="lg"
        onOpenChange={(event) => setOpenCreate(event.open)}
        content={
          <Form<CreateFormValues> onSubmit={handleCreate} resetOnSuccess>
            <InputField
              fieldType="date"
              label="Fecha"
              name="fecha"
              required
              rules={{ required: "La fecha es obligatoria" }}
            />

            <InputField
              fieldType="text"
              label="Nombre"
              name="nombre"
              required
              textOnly
              rules={{
                required: "El nombre es obligatorio",
                setValueAs: (value) => String(value ?? "").trim(),
              }}
            />

            <InputField
              fieldType="select"
              label="Obligatorio"
              name="es_obligatorio"
              disableSelectPortal
              required
              options={BOOLEAN_OPTIONS}
              rules={{ required: "El estado es obligatorio" }}
            />

            <Box w="250px">
              <Button
                loading={isCreating}
                loadingText="Guardando"
                appearance="login"
                type="submit"
                mt="4"
                size="lg"
                w="100%"
              >
                Guardar
              </Button>
            </Box>
          </Form>
        }
      />

      <Modal
        title="Editar feriado"
        isOpen={openEdit}
        size="lg"
        onOpenChange={(event) => {
          setOpenEdit(event.open);
          if (!event.open) setEditingRow(null);
        }}
        content={
          <Form<UpdateFormValues>
            onSubmit={handleEdit}
            defaultValues={{
              fecha: editingRow?.fecha ?? "",
              nombre: editingRow?.nombre ?? "",
              es_obligatorio: editingRow?.es_obligatorio ? "true" : "false",
            }}
          >
            <InputField
              fieldType="date"
              label="Fecha"
              name="fecha"
              required
              rules={{ required: "La fecha es obligatoria" }}
            />

            <InputField
              fieldType="text"
              label="Nombre"
              name="nombre"
              required
              textOnly
              rules={{
                required: "El nombre es obligatorio",
                setValueAs: (value) => String(value ?? "").trim(),
              }}
            />

            <InputField
              fieldType="select"
              label="Obligatorio"
              name="es_obligatorio"
              required
              options={BOOLEAN_OPTIONS}
            />

            <Box w="250px">
              <Button
                loading={isUpdating}
                loadingText="Actualizando"
                appearance="login"
                type="submit"
                mt="4"
                size="lg"
                w="100%"
                disabled={!editingRow}
              >
                Actualizar
              </Button>
            </Box>
          </Form>
        }
      />
    </Layout>
  );
};

export default Feriados;
