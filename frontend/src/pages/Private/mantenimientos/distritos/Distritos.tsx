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

type DistritoRow = { id: number; id_canton: number; nombre: string };
type CantonRow = { id: number; nombre: string; id_provincia?: number | null };
type ProvinciaRow = { id: number; nombre: string };

type CreateFormValues = { id_distrito: number; id_canton: string; nombre: string };
type UpdateFormValues = { id_canton: string; nombre: string };

type CreatePayload = { id_distrito: number; id_canton: number; nombre: string };
type UpdatePayload = { id_canton: number; nombre: string };

const BASE_URL = "mantenimientos/distritos";
const CANTON_URL = "mantenimientos/cantones";
const PROVINCE_URL = "mantenimientos/provincias";

const Distritos = () => {
  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [filterProvinceId, setFilterProvinceId] = useState("");
  const [filterCantonId, setFilterCantonId] = useState("");
  const filterFocusStyles = { outline: "1px solid", outlineColor: "brand.blue.100" } as const;

  const { data: distritos = [], isLoading: isTableLoading, refetch } = useApiQuery<DistritoRow[]>({ url: BASE_URL });
  const { data: cantones = [] } = useApiQuery<CantonRow[]>({ url: CANTON_URL });
  const { data: provincias = [] } = useApiQuery<ProvinciaRow[]>({ url: PROVINCE_URL });

  const canFilterByProvince = useMemo(() => {
    return cantones.some((canton) => Number.isFinite(canton.id_provincia));
  }, [cantones]);

  const filteredCantones = useMemo(() => {
    if (!canFilterByProvince || !filterProvinceId) return cantones;
    const provinceId = Number(filterProvinceId);
    if (!Number.isFinite(provinceId)) return cantones;
    return cantones.filter((canton) => canton.id_provincia === provinceId);
  }, [cantones, canFilterByProvince, filterProvinceId]);

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

  const filteredDistritos = useMemo(() => {
    return distritos.filter((row) => {
      const byProvince = !canFilterByProvince || !filterProvinceId
        ? true
        : cantones.some(
          (canton) => canton.id === row.id_canton && canton.id_provincia === Number(filterProvinceId),
        );
      const byCanton = filterCantonId ? row.id_canton === Number(filterCantonId) : true;
      return byProvince && byCanton;
    });
  }, [distritos, cantones, canFilterByProvince, filterProvinceId, filterCantonId]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDistritos.slice(start, start + pageSize);
  }, [filteredDistritos, page]);

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
          <Flex mb="4" gap="4" flexWrap="wrap">
            {canFilterByProvince && (
              <Field.Root minW="240px" maxW="320px">
                <Field.Label>Filtrar por provincia</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    _focusVisible={filterFocusStyles}
                    value={filterProvinceId}
                    onChange={(event) => {
                      setFilterProvinceId(event.target.value);
                      setFilterCantonId("");
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
            )}

            <Field.Root minW="240px" maxW="320px">
              <Field.Label>Filtrar por cantón</Field.Label>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  _focusVisible={filterFocusStyles}
                  value={filterCantonId}
                  onChange={(event) => {
                    setFilterCantonId(event.target.value);
                    setSelection([]);
                    setPage(1);
                  }}
                >
                  <option value="">Todos</option>
                  {filteredCantones.map((canton) => (
                    <option key={canton.id} value={String(canton.id)}>
                      {canton.nombre}
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
                  setFilterCantonId("");
                  setSelection([]);
                  setPage(1);
                }}
                disabled={!filterProvinceId && !filterCantonId}
              >
                Limpiar filtros
              </ChakraButton>
            </Box>
          </Flex>

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
              totalCount: filteredDistritos.length,
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
