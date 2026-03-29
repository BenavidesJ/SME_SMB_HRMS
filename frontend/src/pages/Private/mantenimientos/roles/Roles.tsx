import { useMemo, useState } from "react";
import { Layout } from "../../../../components/layout";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { Box, Stack, Button as ChakraButton } from "@chakra-ui/react";
import { Button } from "../../../../components/general/button/Button";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { DataTable } from "../../../../components/general/table/DataTable";
import { Modal } from "../../../../components/general";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import { Form, InputField } from "../../../../components/forms";
import type { Roles } from "../../../../types";
import { deleteRole } from "../../../../services/api/security";

export const RolesPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<Roles | null>(null);
  const { data: roles = [], isLoading: isTableLoading, refetch: refetchRoles } = useApiQuery<Roles[]>({ url: "/auth/roles" });
  const { mutate: createRoles, isLoading: isSubmitting } = useApiMutation<{ nombre: string }, void>({ url: "/auth/roles", method: "POST" });
  const { mutate: patchRoles } =
    useApiMutation<{ nombre: string }, void, number>({
      url: (id) => `/auth/roles/${id}`,
      method: "PATCH",
    })
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return roles.slice(start, start + pageSize);
  }, [roles, page]);

  const handleCreate = async (values: { nombre: string }) => {
    try {

      const payload = {
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
      };

      await createRoles(payload);

      setOpenModal(false);
      setPage(1);
      await refetchRoles();

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

      await patchRoles(editingRow.id, payload);

      setOpenEditModal(false);
      setEditingRow(null);
      await refetchRoles();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleDelete = async (id: number) => {

    try {
      await deleteRole(id);

      setPage(1);
      await refetchRoles();
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const columns = useMemo<DataTableColumn<Roles>[]>(() => {
    return [
      {
        id: "id",
        header: "ID",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.id}`,
      },
      {
        id: "roles",
        header: "Roles",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.nombre}`,
      }
    ]
  },
    []);

  return (
    <Layout pageTitle="Mantenimiento de Roles">
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
              Crear Rol <FiPlus />
            </Button>
          </Box>
        </section>
        <section style={{ marginBottom: "100px" }}>
          <DataTable<Roles>
            data={isTableLoading ? [] : pagedRows}
            columns={columns}
            isDataLoading={isTableLoading}
            size="md"
            actionColumn={{
              header: "Acciones",
              w: "200px",
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
              totalCount: roles.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>
      <Modal
        title="Crear rol"
        isOpen={openModal}
        size="lg"
        onOpenChange={(e) => setOpenModal(e.open)}
        content={
          <Form onSubmit={handleCreate} resetOnSuccess >
            <InputField
              fieldType="text"
              label="Rol"
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
        title="Editar rol"
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
              label="Rol"
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
