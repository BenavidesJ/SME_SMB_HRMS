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

type CicloPagoRow = { id: number; ciclo_pago: string };

type CreateFormValues = { id_ciclo_pago: number; ciclo_pago: string };
type UpdateFormValues = { ciclo_pago: string };

type CreatePayload = { ciclo_pago: string };
type UpdatePayload = { ciclo_pago: string };

const BASE_URL = "mantenimientos/ciclos-pago";

const CiclosPago = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingRow, setEditingRow] = useState<CicloPagoRow | null>(null);

  const { data: ciclos = [], isLoading: isTableLoading, refetch } = useApiQuery<CicloPagoRow[]>({ url: BASE_URL });

  const { mutate: createCiclo, isLoading: isCreating } = useApiMutation<CreatePayload, CicloPagoRow>({
    url: BASE_URL,
    method: "POST",
  });

  const { mutate: updateCiclo, isLoading: isUpdating } = useApiMutation<UpdatePayload, CicloPagoRow, number>({
    url: (id) => `${BASE_URL}/${id}`,
    method: "PATCH",
  });

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ciclos.slice(start, start + pageSize);
  }, [ciclos, page]);

  const columns = useMemo<DataTableColumn<CicloPagoRow>[]>(() => {
    return [
      { id: "id", header: "ID", minW: "80px", textAlign: "center", cell: (row) => String(row.id) },
      { id: "ciclo_pago", header: "Ciclo de pago", minW: "220px", cell: (row) => row.ciclo_pago },
    ];
  }, []);

  const handleCreate = async (values: CreateFormValues) => {
    try {
      const payload: CreatePayload = {
        ciclo_pago: String(values.ciclo_pago ?? "").trim().toUpperCase(),
      };

      await createCiclo(payload);

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
        ciclo_pago: String(values.ciclo_pago ?? "").trim().toUpperCase(),
      };

      await updateCiclo(editingRow.id, payload);

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
    <Layout pageTitle="Mantenimiento de Ciclos de Pago">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px">
            <Button
              appearance="login"
              size="lg"
              w="100%"
              onClick={() => setOpenCreate(true)}
            >
              Crear Ciclo <FiPlus />
            </Button>
          </Box>
        </section>

        <section style={{ marginBottom: "100px" }}>
          <DataTable<CicloPagoRow>
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
              totalCount: ciclos.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>

      <Modal
        title="Crear ciclo de pago"
        isOpen={openCreate}
        size="lg"
        onOpenChange={(event) => setOpenCreate(event.open)}
        content={
          <Form<CreateFormValues> onSubmit={handleCreate} resetOnSuccess>
            <InputField
              fieldType="text"
              label="Descripción"
              name="ciclo_pago"
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
        title="Editar ciclo de pago"
        isOpen={openEdit}
        size="md"
        onOpenChange={(event) => {
          setOpenEdit(event.open);
          if (!event.open) setEditingRow(null);
        }}
        content={
          <Form<UpdateFormValues>
            onSubmit={handleEdit}
            defaultValues={{ ciclo_pago: editingRow?.ciclo_pago ?? "" }}
          >
            <InputField
              fieldType="text"
              label="Descripción"
              name="ciclo_pago"
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

export default CiclosPago;