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

const BASE_URL = "mantenimientos/tipos-marca";

type TipoMarcaRow = { id: number; nombre: string };

type CreateFormValues = { nombre: string };
type UpdateFormValues = { nombre: string };

type CreatePayload = { nombre: string };
type UpdatePayload = { nombre: string };

const TiposMarca = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingRow, setEditingRow] = useState<TipoMarcaRow | null>(null);

  const { data: tipos = [], isLoading: isTableLoading, refetch } = useApiQuery<TipoMarcaRow[]>({ url: BASE_URL });

  const { mutate: createTipo, isLoading: isCreating } = useApiMutation<CreatePayload, TipoMarcaRow>({
    url: BASE_URL,
    method: "POST",
  });

  const { mutate: updateTipo, isLoading: isUpdating } = useApiMutation<UpdatePayload, TipoMarcaRow, number>({
    url: (id) => `${BASE_URL}/${id}`,
    method: "PATCH",
  });

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tipos.slice(start, start + pageSize);
  }, [tipos, page]);

  const columns = useMemo<DataTableColumn<TipoMarcaRow>[]>(() => {
    return [
      { id: "id", header: "ID", minW: "80px", textAlign: "center", cell: (row) => String(row.id) },
      { id: "nombre", header: "Nombre", minW: "240px", cell: (row) => row.nombre },
    ];
  }, []);

  const handleCreate = async (values: CreateFormValues) => {
    try {
      const payload: CreatePayload = {
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await createTipo(payload);

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
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await updateTipo(editingRow.id, payload);

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
    <Layout pageTitle="Tipos de marca">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px">
            <Button
              appearance="login"
              size="lg"
              w="100%"
              onClick={() => setOpenCreate(true)}
            >
              Registrar tipo <FiPlus />
            </Button>
          </Box>
        </section>

        <section style={{ marginBottom: "100px" }}>
          <DataTable<TipoMarcaRow>
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
              totalCount: tipos.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>

      <Modal
        title="Registrar tipo de marca"
        isOpen={openCreate}
        size="lg"
        onOpenChange={(event) => setOpenCreate(event.open)}
        content={
          <Form<CreateFormValues> onSubmit={handleCreate} resetOnSuccess>
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
        title="Editar tipo de marca"
        isOpen={openEdit}
        size="md"
        onOpenChange={(event) => {
          setOpenEdit(event.open);
          if (!event.open) setEditingRow(null);
        }}
        content={
          <Form<UpdateFormValues>
            onSubmit={handleEdit}
            defaultValues={{ nombre: editingRow?.nombre ?? "" }}
          >
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

export default TiposMarca;
