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

type ProvinciaRow = { id: number; nombre: string };
type CreatePayload = { id_provincia: number; nombre: string };
type UpdatePayload = { nombre: string };

type CreateFormValues = { id_provincia: number; nombre: string };
type EditFormValues = { nombre: string };

const BASE_URL = "mantenimientos/provincias";

const Provincias = () => {
  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const {
    data: provincias = [],
    isLoading: isTableLoading,
    refetch,
  } = useApiQuery<ProvinciaRow[]>({ url: BASE_URL });

  const { mutate: createProvincia, isLoading: isCreating } = useApiMutation<CreatePayload, ProvinciaRow>({
    url: BASE_URL,
    method: "POST",
  });

  const { mutate: updateProvincia, isLoading: isUpdating } = useApiMutation<UpdatePayload, ProvinciaRow, number>({
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
    return provincias.find((row) => row.id === selectedId) ?? null;
  }, [provincias, selectedId]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return provincias.slice(start, start + pageSize);
  }, [page, provincias]);

  const columns = useMemo<DataTableColumn<ProvinciaRow>[]>(() => {
    return [
      {
        id: "id",
        header: "ID",
        minW: "100px",
        textAlign: "center",
        cell: (row) => String(row.id),
      },
      {
        id: "nombre",
        header: "Provincia",
        minW: "200px",
        cell: (row) => row.nombre,
      },
    ];
  }, []);

  const handleCreate = async (values: CreateFormValues) => {
    try {
      const payload: CreatePayload = {
        id_provincia: Number(values.id_provincia),
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await createProvincia(payload);

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

  const handleEdit = async (values: EditFormValues) => {
    if (!selectedId) return false;
    try {
      const payload: UpdatePayload = {
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await updateProvincia(selectedId, payload);

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
      await apiRequest<void>({
        url: `${BASE_URL}/${selectedId}`,
        method: "DELETE",
      });
      setSelection([]);
      setPage(1);
      await refetch();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Layout pageTitle="Mantenimiento de Provincias">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px">
            <Button
              appearance="login"
              size="lg"
              w="100%"
              onClick={() => setOpenCreate(true)}
            >
              Crear Provincia <FiPlus />
            </Button>
          </Box>
        </section>

        <section style={{ marginBottom: "100px" }}>
          <DataTable<ProvinciaRow>
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
              totalCount: provincias.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>

      <Modal
        title="Crear provincia"
        isOpen={openCreate}
        size="lg"
        onOpenChange={(event) => setOpenCreate(event.open)}
        content={
          <Form<CreateFormValues> onSubmit={handleCreate} resetOnSuccess>
            <InputField
              fieldType="number"
              label="ID de provincia"
              name="id_provincia"
              required
              rules={{
                required: "El ID es obligatorio",
                min: { value: 1, message: "Debe ser mayor o igual a 1" },
                setValueAs: (value) => Number(value),
              }}
            />
            <InputField
              fieldType="text"
              label="Nombre"
              name="nombre"
              required
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
        title="Editar provincia"
        isOpen={openEdit}
        size="md"
        onOpenChange={(event) => setOpenEdit(event.open)}
        content={
          <Form<EditFormValues>
            onSubmit={handleEdit}
            defaultValues={{ nombre: selectedRow?.nombre ?? "" }}
          >
            <InputField
              fieldType="text"
              label="Nombre"
              name="nombre"
              required
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

export default Provincias;
