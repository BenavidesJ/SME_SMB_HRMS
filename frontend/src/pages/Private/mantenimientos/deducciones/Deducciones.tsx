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

type DeduccionRow = {
  id: number;
  nombre: string;
  valor: number;
  es_voluntaria: boolean;
};

type CreateFormValues = { nombre: string; valor: number; es_voluntaria: string };
type UpdateFormValues = { nombre: string; valor: number; es_voluntaria: string };

type CreatePayload = { nombre: string; valor: number; es_voluntaria: boolean };
type UpdatePayload = Partial<CreatePayload>;

const BASE_URL = "mantenimientos/deducciones";
const BOOLEAN_OPTIONS = [
  { label: "Sí", value: "true" },
  { label: "No", value: "false" },
];

const Deducciones = () => {
  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const { data: deducciones = [], isLoading: isTableLoading, refetch } = useApiQuery<DeduccionRow[]>({ url: BASE_URL });

  const { mutate: createDeduccion, isLoading: isCreating } = useApiMutation<CreatePayload, DeduccionRow>({
    url: BASE_URL,
    method: "POST",
  });

  const { mutate: updateDeduccion, isLoading: isUpdating } = useApiMutation<UpdatePayload, DeduccionRow, number>({
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
    return deducciones.find((row) => row.id === selectedId) ?? null;
  }, [deducciones, selectedId]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return deducciones.slice(start, start + pageSize);
  }, [deducciones, page]);

  const columns = useMemo<DataTableColumn<DeduccionRow>[]>(() => {
    return [
      { id: "id", header: "ID", minW: "80px", textAlign: "center", cell: (row) => String(row.id) },
      { id: "nombre", header: "Nombre", minW: "200px", cell: (row) => row.nombre },
      { id: "valor", header: "Valor", minW: "120px", textAlign: "center", cell: (row) => row.valor.toFixed(2) },
      {
        id: "es_voluntaria",
        header: "Voluntaria",
        minW: "120px",
        textAlign: "center",
        cell: (row) => (row.es_voluntaria ? "Sí" : "No"),
      },
    ];
  }, []);

  const handleCreate = async (values: CreateFormValues) => {
    try {
      const payload: CreatePayload = {
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
        valor: Number(values.valor),
        es_voluntaria: values.es_voluntaria === "true",
      };

      await createDeduccion(payload);

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
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
        valor: Number(values.valor),
        es_voluntaria: values.es_voluntaria === "true",
      };

      await updateDeduccion(selectedId, payload);

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
    <Layout pageTitle="Mantenimiento de Deducciones">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px">
            <Button
              appearance="login"
              size="lg"
              w="100%"
              onClick={() => setOpenCreate(true)}
            >
              Crear Deducción <FiPlus />
            </Button>
          </Box>
        </section>

        <section style={{ marginBottom: "100px" }}>
          <DataTable<DeduccionRow>
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
              totalCount: deducciones.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>

      <Modal
        title="Crear deducción"
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
              rules={{
                required: "El nombre es obligatorio",
                setValueAs: (value) => String(value ?? "").trim(),
              }}
            />
            <InputField
              fieldType="number"
              label="Valor"
              name="valor"
              required
              rules={{
                required: "El valor es obligatorio",
                min: { value: 0, message: "Debe ser mayor o igual a 0" },
                setValueAs: (value) => Number(value),
              }}
            />
            <InputField
              fieldType="select"
              label="¿Es voluntaria?"
              name="es_voluntaria"
              required
              options={BOOLEAN_OPTIONS}
              rules={{ required: "Seleccione una opción" }}
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
        title="Editar deducción"
        isOpen={openEdit}
        size="md"
        onOpenChange={(event) => setOpenEdit(event.open)}
        content={
          <Form<UpdateFormValues>
            onSubmit={handleEdit}
            defaultValues={{
              nombre: selectedRow?.nombre ?? "",
              valor: selectedRow?.valor ?? 0,
              es_voluntaria: selectedRow ? (selectedRow.es_voluntaria ? "true" : "false") : "false",
            }}
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
            <InputField
              fieldType="number"
              label="Valor"
              name="valor"
              required
              rules={{
                required: "El valor es obligatorio",
                min: { value: 0, message: "Debe ser mayor o igual a 0" },
                setValueAs: (value) => Number(value),
              }}
            />
            <InputField
              fieldType="select"
              label="¿Es voluntaria?"
              name="es_voluntaria"
              required
              options={BOOLEAN_OPTIONS}
              rules={{ required: "Seleccione una opción" }}
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

export default Deducciones;
