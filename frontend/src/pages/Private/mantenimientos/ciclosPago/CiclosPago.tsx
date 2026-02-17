import { useMemo, useState } from "react";
import { Box, Stack, Button as ChakraButton } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
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

type CreatePayload = { id_ciclo_pago: number; ciclo_pago: string };
type UpdatePayload = { ciclo_pago: string };

const BASE_URL = "mantenimientos/ciclos-pago";

const CiclosPago = () => {
  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const { data: ciclos = [], isLoading: isTableLoading, refetch } = useApiQuery<CicloPagoRow[]>({ url: BASE_URL });

  const { mutate: createCiclo, isLoading: isCreating } = useApiMutation<CreatePayload, CicloPagoRow>({
    url: BASE_URL,
    method: "POST",
  });

  const { mutate: updateCiclo, isLoading: isUpdating } = useApiMutation<UpdatePayload, CicloPagoRow, number>({
    url: (id) => `${BASE_URL}/${id}`,
    method: "PATCH",
  });

  const selectedId = useMemo(() => {
    if (selection.length !== 1) return null;
    const parsed = Number(selection[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }, [selection]);

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return ciclos.find((row) => row.id === selectedId) ?? null;
  }, [ciclos, selectedId]);

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
        id_ciclo_pago: Number(values.id_ciclo_pago),
        ciclo_pago: String(values.ciclo_pago ?? "").trim().toUpperCase(),
      };

      await createCiclo(payload);

      setOpenCreate(false);
      setSelection([]);
      setPage(1);
      await refetch();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleEdit = async (values: UpdateFormValues) => {
    if (!selectedId) return false;

    try {
      const payload: UpdatePayload = {
        ciclo_pago: String(values.ciclo_pago ?? "").trim().toUpperCase(),
      };

      await updateCiclo(selectedId, payload);

      setOpenEdit(false);
      setSelection([]);
      await refetch();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await apiRequest<void>({ url: `${BASE_URL}/${selectedId}`, method: "DELETE" });
      setSelection([]);
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
            selection={{
              enabled: true,
              selectedKeys: selection,
              onChange: setSelection,
              getRowKey: (row) => String(row.id),
            }}
            actionBar={{
              enabled: true,
              renderActions: () => (
                <>
                  <ChakraButton
                    variant="solid"
                    colorPalette="red"
                    size="sm"
                    disabled={selection.length !== 1}
                    onClick={handleDelete}
                  >
                    Eliminar
                  </ChakraButton>
                  <ChakraButton
                    variant="solid"
                    colorPalette="yellow"
                    size="sm"
                    disabled={selection.length !== 1}
                    onClick={() => setOpenEdit(true)}
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
              fieldType="number"
              label="ID del ciclo"
              name="id_ciclo_pago"
              required
              rules={{
                required: "El ID es obligatorio",
                min: { value: 1, message: "Debe ser mayor o igual a 1" },
                setValueAs: (value) => Number(value),
              }}
            />
            <InputField
              fieldType="text"
              label="Descripción"
              name="ciclo_pago"
              required
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
        onOpenChange={(event) => setOpenEdit(event.open)}
        content={
          <Form<UpdateFormValues>
            onSubmit={handleEdit}
            defaultValues={{ ciclo_pago: selectedRow?.ciclo_pago ?? "" }}
          >
            <InputField
              fieldType="text"
              label="Descripción"
              name="ciclo_pago"
              required
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
                disabled={!selectedId}
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