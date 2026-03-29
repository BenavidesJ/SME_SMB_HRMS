import { useMemo, useState } from "react";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import type { Status } from "../../../../types";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { Box, Stack, Button as ChakraButton } from "@chakra-ui/react";
import { Button } from "../../../../components/general/button/Button";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { DataTable } from "../../../../components/general/table/DataTable";
import { Modal } from "../../../../components/general";
import { Form, InputField } from "../../../../components/forms";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import { deleteStatus } from "../../../../services/api/estados";
import { Layout } from "../../../../components/layout";

export const Estados = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<Status | null>(null);
  const { data: estados = [], isLoading: statusLoading, refetch: refetchStatus } = useApiQuery<Status[]>({ url: "mantenimientos/estados" });
  const { mutate: createStatus, isLoading: isSubmitting } = useApiMutation<{ estado: string }, void>({ url: "mantenimientos/estados", method: "POST" });
  const { mutate: modifyStatus } =
    useApiMutation<{ estado: string }, void, number>({
      url: (id) => `mantenimientos/estados/${id}`,
      method: "PATCH",
    })
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return estados.slice(start, start + pageSize);
  }, [estados, page]);

  const columns = useMemo<DataTableColumn<Status>[]>(() => {
    return [
      {
        id: "id_estado",
        header: "ID",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.id}`,
      },
      {
        id: "estado",
        header: "Estado",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.estado}`,
      }
    ]
  },
    []);

  const handleCreate = async (values: { estado: string }) => {
    try {

      const payload = {
        estado: String(values.estado ?? "").trim().toUpperCase(),
      };

      await createStatus(payload);

      setOpenModal(false);
      setPage(1);
      await refetchStatus();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleEdit = async (values: { estado: string }) => {
    if (!editingRow) return false;

    try {

      const payload = {
        estado: String(values.estado ?? "").trim().toUpperCase(),
      };

      await modifyStatus(editingRow.id, payload);

      setOpenEditModal(false);
      setEditingRow(null);
      await refetchStatus();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleDelete = async (id: number) => {

    try {

      await deleteStatus(id);

      setPage(1);
      await refetchStatus();
    } catch (error) {
      console.log(error);
      return false;
    }
  };
  return (
    <Layout pageTitle="Mantenimiento de Estados">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px" alignContent="center">
            <Button
              appearance="login"
              mt="4"
              size="lg"
              w="100%"
              marginBottom="5"
              onClick={() => setOpenModal(true)}
            >
              Crear Estado <FiPlus />
            </Button>
          </Box>
        </section>
        <section style={{ marginBottom: "100px" }}>
          <DataTable<Status>
            data={statusLoading ? [] : pagedRows}
            columns={columns}
            isDataLoading={statusLoading}
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
                      setOpenEditModal(true);
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
                    <FiTrash2 /> Desactivar
                  </ChakraButton>
                </Stack>
              ),
            }}
            pagination={{
              enabled: true,
              page,
              pageSize,
              totalCount: estados.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>
      <Modal
        title="Crear estado"
        isOpen={openModal}
        size="lg"
        onOpenChange={(e) => setOpenModal(e.open)}
        content={
          <Form onSubmit={handleCreate} resetOnSuccess >
            <InputField
              fieldType="text"
              label="Estado"
              name="estado"
              required
              textOnly
              rules={{
                required: "El campo es obligatorio",
                pattern: {
                  value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
                  message: "Solo se permiten letras y espacios",
                },
                setValueAs: (v) => String(v ?? "").trim(),
              }}
            />
            <Box w="250px" alignContent="center">
              <Button
                loading={isSubmitting}
                loadingText="Agregando"
                appearance="login"
                type="submit"
                mt="4"
                size="lg"
                w="100%"
                marginBottom="5"
              >
                Agregar <FiPlus />
              </Button>
            </Box>
          </Form>
        }
      />
      <Modal
        title="Editar estado"
        isOpen={openEditModal}
        size="md"
        onOpenChange={(e) => {
          setOpenEditModal(e.open);
          if (!e.open) setEditingRow(null);
        }}
        content={
          <Form
            onSubmit={handleEdit}
            defaultValues={{
              estado: editingRow?.estado ?? "",
            }}
          >
            <InputField
              fieldType="text"
              label="Estado"
              name="estado"
              required
              textOnly
              rules={{
                required: "El campo es obligatorio",
                pattern: {
                  value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
                  message: "Solo se permiten letras y espacios",
                },
                setValueAs: (v) => String(v ?? "").trim(),
              }}
            />

            <Box w="250px" alignContent="center">
              <Button
                loading={isSubmitting}
                loadingText="Actualizando"
                appearance="login"
                type="submit"
                mt="4"
                size="lg"
                w="100%"
                marginBottom="5"
              >
                Actualizar
              </Button>
            </Box>
          </Form>
        }
      />
    </Layout>
  )
}
