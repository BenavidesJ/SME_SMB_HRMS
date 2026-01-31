import { useMemo, useState } from "react";
import {
  Box,
  Button as ChakraButton,
  Stack,
} from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { Layout } from "../../../../components/layout";
import { DataTable } from "../../../../components/general/table/DataTable";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { Modal } from "../../../../components/general";
import { Form, InputField } from "../../../../components/forms";
import { Button } from "../../../../components/general/button/Button";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import { deleteJornada } from "../../../../services/api/employees";

type TipoJornadaRow = {
  id: number;
  tipo: string;
  max_horas_semanales: number;
  max_horas_diarias: number;
};

type CreatePayload = {
  tipo: string;
  max_horas_diarias: string | number;
  max_horas_semanales: string | number;
};

type UpdatePayload = Partial<CreatePayload>;

export const TiposJornada = () => {
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    data: tipos = [],
    isLoading: isTableLoading,
    refetch,
  } = useApiQuery<TipoJornadaRow[]>({ url: "tipos_jornada" });

  const { mutate: createTipo, isLoading: isSubmittingCreate } =
    useApiMutation<CreatePayload, void>({
      url: "/tipos_jornada",
      method: "POST",
    });

  const { mutate: patchTipo, isLoading: isSubmittingEdit } =
    useApiMutation<UpdatePayload, void, number>({
      url: (id) => `/tipos_jornada/${id}`,
      method: "PATCH",
    });

  const selectedId = useMemo(() => {
    if (selection.length !== 1) return null;
    const parsed = Number(selection[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }, [selection]);

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return tipos.find((row) => row.id === selectedId) ?? null;
  }, [selectedId, tipos]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tipos.slice(start, start + pageSize);
  }, [tipos, page]);

  const handleCreate = async (values: CreatePayload) => {
    try {
      const payload: CreatePayload = {
        tipo: String(values.tipo ?? "").trim(),
        max_horas_diarias: Number(values.max_horas_diarias),
        max_horas_semanales: Number(values.max_horas_semanales),
      };

      await createTipo(payload);

      setOpenCreateModal(false);
      setSelection([]);
      setPage(1);
      await refetch();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleEdit = async (values: UpdatePayload) => {
    if (!selectedId) return false;

    try {
      const payload: UpdatePayload = {
        ...(values.tipo !== undefined
          ? { tipo: String(values.tipo ?? "").trim() }
          : {}),
        ...(values.max_horas_diarias !== undefined
          ? { max_horas_diarias: Number(values.max_horas_diarias) }
          : {}),
        ...(values.max_horas_semanales !== undefined
          ? { max_horas_semanales: Number(values.max_horas_semanales) }
          : {}),
      };

      await patchTipo(selectedId, payload);

      setOpenEditModal(false);
      setSelection([]);
      await refetch();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedId) return;
    try {
      await deleteJornada(selectedId);
      setSelection([]);
      setPage(1);
      await refetch();
    } catch (error) {
      console.log(error);
    }
  };

  const columns = useMemo<DataTableColumn<TipoJornadaRow>[]>(() => {
    return [
      {
        id: "id",
        header: "ID",
        minW: "80px",
        textAlign: "center",
        cell: (row) => `${row.id}`,
      },
      {
        id: "tipo_jornada",
        header: "Tipo de jornada",
        minW: "160px",
        cell: (row) => row.tipo,
      },
      {
        id: "cantidad_max_horas_dia",
        header: "Máx. horas día",
        minW: "140px",
        textAlign: "center",
        cell: (row) => `${row.max_horas_diarias}`,
      },
      {
        id: "cantidad_max_horas_semana",
        header: "Máx. horas semana",
        minW: "160px",
        textAlign: "center",
        cell: (row) => `${row.max_horas_semanales}`,
      },
    ];
  }, []);

  return (
    <Layout pageTitle="Mantenimiento de Tipos de Jornada">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px">
            <Button
              appearance="login"
              mt="4"
              size="lg"
              w="100%"
              onClick={() => setOpenCreateModal(true)}
            >
              Crear Tipo de Jornada <FiPlus />
            </Button>
          </Box>
        </section>

        <section style={{ marginBottom: "100px" }}>
          <DataTable<TipoJornadaRow>
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
                    onClick={handleDeleteSelected}
                  >
                    Eliminar
                  </ChakraButton>
                  <ChakraButton
                    variant="solid"
                    colorPalette="yellow"
                    size="sm"
                    disabled={selection.length !== 1}
                    onClick={() => setOpenEditModal(true)}
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
              totalCount: tipos.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>

      <Modal
        title="Crear tipo de jornada"
        isOpen={openCreateModal}
        size="lg"
        onOpenChange={(event) => setOpenCreateModal(event.open)}
        content={
          <Form<CreatePayload>
            onSubmit={handleCreate}
            resetOnSuccess
          >
            <InputField
              fieldType="text"
              label="Tipo de jornada"
              name="tipo"
              required
              rules={{
                required: "El tipo es obligatorio",
                setValueAs: (value) => String(value ?? "").trim(),
              }}
            />
            <InputField
              fieldType="number"
              label="Máximo de horas por día"
              name="max_horas_diarias"
              required
              rules={{
                required: "El máximo por día es obligatorio",
                min: { value: 1, message: "Debe ser mayor a 0" },
                setValueAs: (value) => Number(value),
              }}
            />
            <InputField
              fieldType="number"
              label="Máximo de horas por semana"
              name="max_horas_semanales"
              required
              rules={{
                required: "El máximo por semana es obligatorio",
                min: { value: 1, message: "Debe ser mayor a 0" },
                setValueAs: (value) => Number(value),
              }}
            />

            <Box w="250px" alignContent="center">
              <Button
                loading={isSubmittingCreate}
                loadingText="Agregando"
                appearance="login"
                type="submit"
                mt="4"
                size="lg"
                w="100%"
              >
                Agregar <FiPlus />
              </Button>
            </Box>
          </Form>
        }
      />

      <Modal
        title="Editar tipo de jornada"
        isOpen={openEditModal}
        size="md"
        onOpenChange={(event) => setOpenEditModal(event.open)}
        content={
          <Form<UpdatePayload>
            onSubmit={handleEdit}
            defaultValues={{
              tipo: selectedRow?.tipo ?? "",
              max_horas_diarias: selectedRow?.max_horas_diarias ?? "",
              max_horas_semanales: selectedRow?.max_horas_semanales ?? "",
            }}
          >
            <InputField
              fieldType="text"
              label="Tipo de jornada"
              name="tipo"
              required
              rules={{
                required: "El tipo es obligatorio",
                setValueAs: (value) => String(value ?? "").trim(),
              }}
            />
            <InputField
              fieldType="number"
              label="Máximo de horas por día"
              name="max_horas_diarias"
              required
              rules={{
                required: "El máximo por día es obligatorio",
                min: { value: 1, message: "Debe ser mayor a 0" },
                setValueAs: (value) => Number(value),
              }}
            />
            <InputField
              fieldType="number"
              label="Máximo de horas por semana"
              name="max_horas_semanales"
              required
              rules={{
                required: "El máximo por semana es obligatorio",
                min: { value: 1, message: "Debe ser mayor a 0" },
                setValueAs: (value) => Number(value),
              }}
            />

            <Box w="250px" alignContent="center">
              <Button
                loading={isSubmittingEdit}
                loadingText="Actualizando"
                appearance="login"
                type="submit"
                mt="4"
                size="lg"
                w="100%"
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