import { useMemo, useState } from "react";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { DataTable } from "../../../../components/general/table/DataTable";
import { Box, Button as ChakraButton, Stack, } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { Modal } from "../../../../components/general";
import { Form, InputField } from "../../../../components/forms";
import { Button } from "../../../../components/general/button/Button";
import type { Department } from "../../../../types/Company";
import { deleteDepartment } from "../../../../services/api/empresa";
import { Layout } from "../../../../components/layout";


export const Departamentos = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const { data: departments = [], isLoading: isTableLoading, refetch: refetch } = useApiQuery<Department[]>({ url: "mantenimientos/departamentos" });
  const { mutate: createDepartment, isLoading: isSubmitting } = useApiMutation<{ nombre: string }, void>({ url: "mantenimientos/departamentos", method: "POST" });
  const { mutate: patchDepartment } =
    useApiMutation<{ nombre: string }, void, number>({
      url: (id) => `mantenimientos/departamentos/${id}`,
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
    return departments.find((r) => r.id === selectedId) ?? null;
  }, [departments, selectedId]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return departments.slice(start, start + pageSize);
  }, [departments, page]);

  const handleCreate = async (values: { nombre: string }) => {
    try {

      const payload = {
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await createDepartment(payload);

      setOpenModal(false);
      setSelection([]);
      setPage(1);
      await refetch();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleEdit = async (values: { nombre: string }) => {
    if (!selectedId) return false;

    try {

      const payload = {
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await patchDepartment(selectedId, payload);

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
      await deleteDepartment(selectedId);

      setSelection([]);
      setPage(1);
      await refetch();
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const columns = useMemo<DataTableColumn<Department>[]>(() => {
    return [
      {
        id: "id",
        header: "ID",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.id}`,
      },
      {
        id: "departamento",
        header: "Departamento",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.nombre}`,
      }
    ]
  },
    []);

  return (
    <Layout pageTitle="Mantenimiento de Departamentos">
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
              Crear Departamento <FiPlus />
            </Button>
          </Box>
        </section>
        <section style={{ marginBottom: "100px" }}>
          <DataTable<Department>
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
              totalCount: departments.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>
      <Modal
        title="Crear departamento"
        isOpen={openModal}
        size="lg"
        onOpenChange={(e) => setOpenModal(e.open)}
        content={
          <Form onSubmit={handleCreate} resetOnSuccess >
            <InputField
              fieldType="text"
              label="Departamento"
              name="nombre"
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
        title="Editar departamento"
        isOpen={openEditModal}
        size="md"
        onOpenChange={(e) => setOpenEditModal(e.open)}
        content={
          <Form
            onSubmit={handleEdit}
            defaultValues={{
              nombre: selectedRow?.nombre ?? "",
            }}
          >
            <InputField
              fieldType="text"
              label="Departamento"
              name="nombre"
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
