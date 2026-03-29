import { useMemo, useState } from "react";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { DataTable } from "../../../../components/general/table/DataTable";
import { Box, Button as ChakraButton, Stack, } from "@chakra-ui/react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { Modal } from "../../../../components/general";
import { Form, InputField } from "../../../../components/forms";
import { Button } from "../../../../components/general/button/Button";
import type { Department } from "../../../../types/Company";
import { deleteDepartment } from "../../../../services/api/empresa";
import { Layout } from "../../../../components/layout";


export const Departamentos = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<Department | null>(null);
  const { data: departments = [], isLoading: isTableLoading, refetch: refetch } = useApiQuery<Department[]>({ url: "mantenimientos/departamentos" });
  const { mutate: createDepartment, isLoading: isSubmitting } = useApiMutation<{ nombre: string }, void>({ url: "mantenimientos/departamentos", method: "POST" });
  const { mutate: patchDepartment } =
    useApiMutation<{ nombre: string }, void, number>({
      url: (id) => `mantenimientos/departamentos/${id}`,
      method: "PATCH",
    })
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
      setPage(1);
      await refetch();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleEdit = async (values: { nombre: string }) => {
    if (!editingRow) return false;

    try {

      const payload = {
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await patchDepartment(editingRow.id, payload);

      setOpenEditModal(false);
      setEditingRow(null);
      await refetch();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleDelete = async (id: number) => {

    try {
      await deleteDepartment(id);

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
        title="Editar departamento"
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
              nombre: editingRow?.nombre ?? "",
            }}
          >
            <InputField
              fieldType="text"
              label="Departamento"
              name="nombre"
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
