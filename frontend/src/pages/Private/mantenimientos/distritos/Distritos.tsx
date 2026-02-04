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

type DistritoRow = { id: number; id_canton: number; nombre: string };
type CantonRow = { id: number; nombre: string };

type CreateFormValues = { id_distrito: number; id_canton: string; nombre: string };
type UpdateFormValues = { id_canton: string; nombre: string };

type CreatePayload = { id_distrito: number; id_canton: number; nombre: string };
type UpdatePayload = { id_canton: number; nombre: string };

const BASE_URL = "mantenimientos/distritos";
const CANTON_URL = "mantenimientos/cantones";

const Distritos = () => {
  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const { data: distritos = [], isLoading: isTableLoading, refetch } = useApiQuery<DistritoRow[]>({ url: BASE_URL });
  const { data: cantones = [] } = useApiQuery<CantonRow[]>({ url: CANTON_URL });

  const cantonOptions = useMemo(() => {
    return cantones.map((canton) => ({ label: canton.nombre, value: String(canton.id) }));
  }, [cantones]);

  const { mutate: createDistrito, isLoading: isCreating } = useApiMutation<CreatePayload, DistritoRow>({
    url: BASE_URL,
    method: "POST",
  });

  const { mutate: updateDistrito, isLoading: isUpdating } = useApiMutation<UpdatePayload, DistritoRow, number>({
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
    return distritos.find((row) => row.id === selectedId) ?? null;
  }, [distritos, selectedId]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return distritos.slice(start, start + pageSize);
  }, [distritos, page]);

  const columns = useMemo<DataTableColumn<DistritoRow>[]>(() => {
    return [
      {
        id: "id",
        header: "ID",
        minW: "100px",
        textAlign: "center",
        cell: (row) => String(row.id),
      },
      {
        id: "canton",
        header: "Cantón",
        minW: "200px",
        cell: (row) => cantones.find((c) => c.id === row.id_canton)?.nombre ?? String(row.id_canton),
      },
      {
        id: "nombre",
        header: "Distrito",
        minW: "200px",
        cell: (row) => row.nombre,
      },
    ];
  }, [cantones]);

  const handleCreate = async (values: CreateFormValues) => {
    try {
      const payload: CreatePayload = {
        id_distrito: Number(values.id_distrito),
        id_canton: Number(values.id_canton),
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await createDistrito(payload);

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
        id_canton: Number(values.id_canton),
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await updateDistrito(selectedId, payload);

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
    <Layout pageTitle="Mantenimiento de Distritos">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px">
            <Button
              appearance="login"
              size="lg"
              w="100%"
              onClick={() => setOpenCreate(true)}
            >
              Crear Distrito <FiPlus />
            </Button>
          </Box>
        </section>

        <section style={{ marginBottom: "100px" }}>
          <DataTable<DistritoRow>
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
              totalCount: distritos.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>

      <Modal
        title="Crear distrito"
        isOpen={openCreate}
        size="lg"
        onOpenChange={(event) => setOpenCreate(event.open)}
        content={
          <Form<CreateFormValues> onSubmit={handleCreate} resetOnSuccess>
            <InputField
              fieldType="number"
              label="ID de distrito"
              name="id_distrito"
              required
              rules={{
                required: "El ID es obligatorio",
                min: { value: 1, message: "Debe ser mayor o igual a 1" },
                setValueAs: (value) => Number(value),
              }}
            />
            <InputField
              fieldType="select"
              label="Cantón"
              name="id_canton"
              required
              options={cantonOptions}
              rules={{
                required: "Seleccione un cantón",
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
        title="Editar distrito"
        isOpen={openEdit}
        size="md"
        onOpenChange={(event) => setOpenEdit(event.open)}
        content={
          <Form<UpdateFormValues>
            onSubmit={handleEdit}
            defaultValues={{
              id_canton: selectedRow ? String(selectedRow.id_canton) : "",
              nombre: selectedRow?.nombre ?? "",
            }}
          >
            <InputField
              fieldType="select"
              label="Cantón"
              name="id_canton"
              required
              options={cantonOptions}
              rules={{
                required: "Seleccione un cantón",
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

export default Distritos;
