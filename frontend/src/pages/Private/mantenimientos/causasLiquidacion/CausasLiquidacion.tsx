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

type CausaRow = { id: number; causa_liquidacion: string };

type CreateFormValues = { causa_liquidacion: string };
type UpdateFormValues = { causa_liquidacion: string };

type CreatePayload = { causa_liquidacion: string };
type UpdatePayload = { causa_liquidacion: string };

const BASE_URL = "mantenimientos/causas-liquidacion";

const CausasLiquidacion = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingRow, setEditingRow] = useState<CausaRow | null>(null);

  const { data: causas = [], isLoading: isTableLoading, refetch } = useApiQuery<CausaRow[]>({ url: BASE_URL });

  const { mutate: createCausa, isLoading: isCreating } = useApiMutation<CreatePayload, CausaRow>({
    url: BASE_URL,
    method: "POST",
  });

  const { mutate: updateCausa, isLoading: isUpdating } = useApiMutation<UpdatePayload, CausaRow, number>({
    url: (id) => `${BASE_URL}/${id}`,
    method: "PATCH",
  });

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return causas.slice(start, start + pageSize);
  }, [causas, page]);

  const columns = useMemo<DataTableColumn<CausaRow>[]>(() => {
    return [
      { id: "id", header: "ID", minW: "80px", textAlign: "center", cell: (row) => String(row.id) },
      { id: "causa", header: "Descripción", minW: "240px", cell: (row) => row.causa_liquidacion },
    ];
  }, []);

  const handleCreate = async (values: CreateFormValues) => {
    try {
      const payload: CreatePayload = {
        causa_liquidacion: String(values.causa_liquidacion ?? "").trim().toUpperCase(),
      };

      await createCausa(payload);

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
        causa_liquidacion: String(values.causa_liquidacion ?? "").trim().toUpperCase(),
      };

      await updateCausa(editingRow.id, payload);

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
    <Layout pageTitle="Causas de Liquidación">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px">
            <Button
              appearance="login"
              size="lg"
              w="100%"
              onClick={() => setOpenCreate(true)}
            >
              Crear Causa <FiPlus />
            </Button>
          </Box>
        </section>

        <section style={{ marginBottom: "100px" }}>
          <DataTable<CausaRow>
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
              totalCount: causas.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>

      <Modal
        title="Crear causa"
        isOpen={openCreate}
        size="lg"
        onOpenChange={(event) => setOpenCreate(event.open)}
        content={
          <Form<CreateFormValues> onSubmit={handleCreate} resetOnSuccess>
            <InputField
              fieldType="text"
              label="Descripción"
              name="causa_liquidacion"
              required
              textOnly
              rules={{
                required: "La descripción es obligatoria",
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
        title="Editar causa"
        isOpen={openEdit}
        size="md"
        onOpenChange={(event) => {
          setOpenEdit(event.open);
          if (!event.open) setEditingRow(null);
        }}
        content={
          <Form<UpdateFormValues>
            onSubmit={handleEdit}
            defaultValues={{ causa_liquidacion: editingRow?.causa_liquidacion ?? "" }}
          >
            <InputField
              fieldType="text"
              label="Descripción"
              name="causa_liquidacion"
              required
              textOnly
              rules={{
                required: "La descripción es obligatoria",
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

export default CausasLiquidacion;
