import { useMemo, useState } from "react";
import { Box, Stack, Button as ChakraButton, Field, NativeSelect, Flex } from "@chakra-ui/react";
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

type CantonRow = { id: number; id_provincia: number; nombre: string };
type ProvinciaRow = { id: number; nombre: string };

type CreateFormValues = { id_provincia: string; nombre: string };
type UpdateFormValues = { id_provincia: string; nombre: string };

type CreatePayload = { id_provincia: number; nombre: string };
type UpdatePayload = { id_provincia: number; nombre: string };

const BASE_URL = "mantenimientos/cantones";
const PROVINCE_URL = "mantenimientos/provincias";

const Cantones = () => {
  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [filterProvinceId, setFilterProvinceId] = useState("");
  const filterFocusStyles = { outline: "1px solid", outlineColor: "brand.blue.100" } as const;

  const { data: cantones = [], isLoading: isTableLoading, refetch } = useApiQuery<CantonRow[]>({ url: BASE_URL });
  const { data: provincias = [] } = useApiQuery<ProvinciaRow[]>({ url: PROVINCE_URL });

  const provinceOptions = useMemo(() => {
    return provincias.map((provincia) => ({ label: provincia.nombre, value: String(provincia.id) }));
  }, [provincias]);

  const { mutate: createCanton, isLoading: isCreating } = useApiMutation<CreatePayload, CantonRow>({
    url: BASE_URL,
    method: "POST",
  });

  const { mutate: updateCanton, isLoading: isUpdating } = useApiMutation<UpdatePayload, CantonRow, number>({
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
    return cantones.find((row) => row.id === selectedId) ?? null;
  }, [cantones, selectedId]);

  const filteredCantones = useMemo(() => {
    if (!filterProvinceId) return cantones;
    const provinceId = Number(filterProvinceId);
    if (!Number.isFinite(provinceId)) return cantones;
    return cantones.filter((row) => row.id_provincia === provinceId);
  }, [cantones, filterProvinceId]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCantones.slice(start, start + pageSize);
  }, [filteredCantones, page]);

  const columns = useMemo<DataTableColumn<CantonRow>[]>(() => {
    return [
      {
        id: "id",
        header: "ID",
        minW: "100px",
        textAlign: "center",
        cell: (row) => String(row.id),
      },
      {
        id: "provincia",
        header: "Provincia",
        minW: "200px",
        cell: (row) => provincias.find((provincia) => provincia.id === row.id_provincia)?.nombre ?? String(row.id_provincia),
      },
      {
        id: "nombre",
        header: "Cantón",
        minW: "200px",
        cell: (row) => row.nombre,
      },
    ];
  }, [provincias]);

  const handleCreate = async (values: CreateFormValues) => {
    try {
      const payload: CreatePayload = {
        id_provincia: Number(values.id_provincia),
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await createCanton(payload);

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
        id_provincia: Number(values.id_provincia),
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await updateCanton(selectedId, payload);

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
    <Layout pageTitle="Mantenimiento de Cantones">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px">
            <Button
              appearance="login"
              size="lg"
              w="100%"
              onClick={() => setOpenCreate(true)}
            >
              Crear Cantón <FiPlus />
            </Button>
          </Box>
        </section>

        <section style={{ marginBottom: "100px" }}>
          <Flex mb="4" gap="4" flexWrap="wrap">
            <Field.Root minW="240px" maxW="320px">
              <Field.Label>Filtrar por provincia</Field.Label>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  _focusVisible={filterFocusStyles}
                  value={filterProvinceId}
                  onChange={(event) => {
                    setFilterProvinceId(event.target.value);
                    setSelection([]);
                    setPage(1);
                  }}
                >
                  <option value="">Todas</option>
                  {provincias.map((provincia) => (
                    <option key={provincia.id} value={String(provincia.id)}>
                      {provincia.nombre}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>

            <Box alignContent="end">
              <ChakraButton
                size="sm"
                variant="outline"
                onClick={() => {
                  setFilterProvinceId("");
                  setSelection([]);
                  setPage(1);
                }}
                disabled={!filterProvinceId}
              >
                Limpiar filtros
              </ChakraButton>
            </Box>
          </Flex>

          <DataTable<CantonRow>
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
              totalCount: filteredCantones.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>

      <Modal
        title="Crear cantón"
        isOpen={openCreate}
        size="lg"
        onOpenChange={(event) => setOpenCreate(event.open)}
        content={
          <Form<CreateFormValues> onSubmit={handleCreate} resetOnSuccess>
            <InputField
              fieldType="select"
              label="Provincia"
              name="id_provincia"
              required
              options={provinceOptions}
              rules={{
                required: "Seleccione una provincia",
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
        title="Editar cantón"
        isOpen={openEdit}
        size="md"
        onOpenChange={(event) => setOpenEdit(event.open)}
        content={
          <Form<UpdateFormValues>
            onSubmit={handleEdit}
            defaultValues={{
              id_provincia: selectedRow ? String(selectedRow.id_provincia) : "",
              nombre: selectedRow?.nombre ?? "",
            }}
          >
            <InputField
              fieldType="select"
              label="Provincia"
              name="id_provincia"
              required
              options={provinceOptions}
              rules={{
                required: "Seleccione una provincia",
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

export default Cantones;
