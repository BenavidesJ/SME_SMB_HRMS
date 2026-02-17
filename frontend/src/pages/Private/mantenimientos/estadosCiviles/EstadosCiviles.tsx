import { useMemo, useState } from "react";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import type { MaritalStatus } from "../../../../types/MaritalStatus";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { Box, Stack, Button as ChakraButton } from "@chakra-ui/react";
import { Button } from "../../../../components/general/button/Button";
import { FiPlus } from "react-icons/fi";
import { DataTable } from "../../../../components/general/table/DataTable";
import { Modal } from "../../../../components/general";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import { deleteMaritalStatus } from "../../../../services/api/estadoCivil";
import { Form, InputField } from "../../../../components/forms";
import { Layout } from "../../../../components/layout";

export const EstadosCiviles = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const { data: maritalStatuses = [], isLoading: isTableLoading, refetch: refetchMaritalStatuses } = useApiQuery<MaritalStatus[]>({ url: "mantenimientos/estados-civiles" });
  const { mutate: createMaritalStatus, isLoading: isSubmitting } = useApiMutation<{ estado_civil: string }, void>({ url: "mantenimientos/estados-civiles", method: "POST" });
  const { mutate: patchMaritalStatus } =
    useApiMutation<{ estado_civil: string }, void, number>({
      url: (id) => `mantenimientos/estados-civiles/${id}`,
      method: "PATCH",
    })
  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const selectedId = useMemo(() => {
    if (selection.length !== 1) return null;
    const id = Number(selection[0]);
    return Number.isFinite(id) ? id : null;
  }, [selection]);

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return maritalStatuses.find((r) => r.id === selectedId) ?? null;
  }, [maritalStatuses, selectedId]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return maritalStatuses.slice(start, start + pageSize);
  }, [maritalStatuses, page]);

  const handleCreate = async (values: { estado_civil: string }) => {
    try {

      const payload = {
        estado_civil: String(values.estado_civil ?? "").trim().toUpperCase(),
      };

      await createMaritalStatus(payload);

      setOpenModal(false);
      setSelection([]);
      setPage(1);
      await refetchMaritalStatuses();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleEdit = async (values: { estado_civil: string }) => {
    if (!selectedId) return false;

    try {

      const payload = {
        estado_civil: String(values.estado_civil ?? "").trim().toUpperCase(),
      };

      await patchMaritalStatus(selectedId, payload);

      setOpenEditModal(false);
      setSelection([]);
      await refetchMaritalStatuses();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedId) return;

    try {
      await deleteMaritalStatus(selectedId);

      setSelection([]);
      setPage(1);
      await refetchMaritalStatuses();
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const columns = useMemo<DataTableColumn<MaritalStatus>[]>(() => {
    return [
      {
        id: "id",
        header: "ID",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.id}`,
      },
      {
        id: "estado_civil",
        header: "Estado Civil",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.estado_civil}`,
      }
    ]
  },
    []);

  return (
    <Layout pageTitle="Mantenimiento de Estados Civiles">
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
              Crear Estado Civil <FiPlus />
            </Button>
          </Box>
        </section>
        <section style={{ marginBottom: "100px" }}>
          <DataTable<MaritalStatus>
            data={isTableLoading ? [] : pagedRows}
            columns={columns}
            isDataLoading={isTableLoading}
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
              totalCount: maritalStatuses.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>
      <Modal
        title="Crear estado civil"
        isOpen={openModal}
        size="lg"
        onOpenChange={(e) => setOpenModal(e.open)}
        content={
          <Form onSubmit={handleCreate} resetOnSuccess >
            <InputField
              fieldType="text"
              label="Estado Civil"
              name="estado_civil"
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
        title="Editar estado civil"
        isOpen={openEditModal}
        size="md"
        onOpenChange={(e) => setOpenEditModal(e.open)}
        content={
          <Form
            onSubmit={handleEdit}
            defaultValues={{
              estado_civil: selectedRow?.estado_civil ?? "",
            }}
          >
            <InputField
              fieldType="text"
              label="Estado Civil"
              name="estado_civil"
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
