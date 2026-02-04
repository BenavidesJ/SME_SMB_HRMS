import { useMemo, useState } from "react";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import type { Status } from "../../../../types";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { Box, Stack, Button as ChakraButton } from "@chakra-ui/react";
import { Button } from "../../../../components/general/button/Button";
import { FiPlus } from "react-icons/fi";
import { DataTable } from "../../../../components/general/table/DataTable";
import { Modal } from "../../../../components/general";
import { Form, InputField } from "../../../../components/forms";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import { deleteStatus } from "../../../../services/api/estados";
import { Layout } from "../../../../components/layout";

export const Estados = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const { data: estados = [], isLoading: statusLoading, refetch: refetchStatus } = useApiQuery<Status[]>({ url: "mantenimientos/estados" });
  const [selection, setSelection] = useState<string[]>([]);
  const { mutate: createStatus, isLoading: isSubmitting } = useApiMutation<{ estado: string }, void>({ url: "mantenimientos/estados", method: "POST" });
  const { mutate: modifyStatus } =
    useApiMutation<{ estado: string }, void, number>({
      url: (id) => `mantenimientos/estados/${id}`,
      method: "PATCH",
    })
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const selectedId = useMemo(() => {
    if (selection.length !== 1) return null;
    const id = Number(selection[0]);
    return Number.isFinite(id) ? id : null;
  }, [selection]);

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return estados.find((r) => r.id === selectedId) ?? null;
  }, [estados, selectedId]);

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
      setSelection([]);
      setPage(1);
      await refetchStatus();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleEdit = async (values: { estado: string }) => {
    if (!selectedId) return false;

    try {

      const payload = {
        estado: String(values.estado ?? "").trim().toUpperCase(),
      };

      await modifyStatus(selectedId, payload);

      setOpenEditModal(false);
      setSelection([]);
      await refetchStatus();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedId) return;

    try {

      await deleteStatus(selectedId);

      setSelection([]);
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
            selection={{
              enabled: true,
              selectedKeys: selection,
              onChange: setSelection,
              getRowKey: (r) => String(r.id),
            }}
            actionBar={{
              enabled: true,
              renderActions: () => (
                <>
                  <ChakraButton
                    variant="solid"
                    colorPalette="red"
                    size="sm"
                    onClick={handleDeleteSelected}
                  >
                    Desactivar
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
        onOpenChange={(e) => setOpenEditModal(e.open)}
        content={
          <Form
            onSubmit={handleEdit}
            defaultValues={{
              estado: selectedRow?.estado ?? "",
            }}
          >
            <InputField
              fieldType="text"
              label="Estado"
              name="estado"
              required
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
