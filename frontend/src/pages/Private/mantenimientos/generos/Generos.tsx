import { Box, Stack, Button as ChakraButton } from "@chakra-ui/react";
import { Layout } from "../../../../components/layout";
import { useMemo, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { DataTable } from "../../../../components/general/table/DataTable";
import type { Gender } from "../../../../types";
import { Modal } from "../../../../components/general";
import { Form, InputField } from "../../../../components/forms";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { deleteGender } from "../../../../services/api/generos";
import { Button } from "../../../../components/general/button/Button";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { useApiMutation } from "../../../../hooks/useApiMutations";

export default function Generos() {
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const { data: genders = [], isLoading: isTableLoading, refetch: refetchGenders } = useApiQuery<Gender[]>({ url: "generos" });
  const { mutate: createGender, isLoading: isSubmitting } = useApiMutation<{ genero: string }, void>({ url: "/generos", method: "POST" });
  const { mutate: patchGender } =
    useApiMutation<{ genero: string }, void, number>({
      url: (id) => `/generos/${id}`,
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
    return genders.find((r) => r.id_genero === selectedId) ?? null;
  }, [genders, selectedId]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return genders.slice(start, start + pageSize);
  }, [genders, page]);

  const columns = useMemo<DataTableColumn<Gender>[]>(() => {
    return [
      {
        id: "id",
        header: "ID",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.id_genero}`,
      },
      {
        id: "genero",
        header: "Género",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.genero}`,
      }
    ]
  },
    []);


  const handleCreate = async (values: { genero: string }) => {
    try {

      const payload = {
        genero: String(values.genero ?? "").trim().toUpperCase(),
      };

      await createGender(payload);

      setOpenModal(false);
      setSelection([]);
      setPage(1);
      await refetchGenders();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleEdit = async (values: { genero: string }) => {
    if (!selectedId) return false;

    try {

      const payload = {
        genero: String(values.genero ?? "").trim().toUpperCase(),
      };

      await patchGender(selectedId, payload);

      setOpenEditModal(false);
      setSelection([]);
      await refetchGenders();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedId) return;

    try {
      await deleteGender(selectedId);

      setSelection([]);
      setPage(1);
      await refetchGenders();
    } catch (error) {
      console.log(error);
      return false;
    }
  };


  return (
    <Layout pageTitle="Mantenimiento de Géneros">
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
              Crear Genero <FiPlus />
            </Button>
          </Box>
        </section>
        <section style={{ marginBottom: "100px" }}>
          <DataTable<Gender>
            data={isTableLoading ? [] : pagedRows}
            columns={columns}
            isDataLoading={isTableLoading}
            size="md"
            selection={{
              enabled: true,
              selectedKeys: selection,
              onChange: setSelection,
              getRowKey: (r) => String(r.id_genero),
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
              totalCount: genders.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>
      <Modal
        title="Crear género"
        isOpen={openModal}
        size="lg"
        onOpenChange={(e) => setOpenModal(e.open)}
        content={
          <Form onSubmit={handleCreate} resetOnSuccess >
            <InputField
              fieldType="text"
              label="Género"
              name="genero"
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
        title="Editar género"
        isOpen={openEditModal}
        size="md"
        onOpenChange={(e) => setOpenEditModal(e.open)}
        content={
          <Form
            onSubmit={handleEdit}
            defaultValues={{
              genero: selectedRow?.genero ?? "",
            }}
          >
            <InputField
              fieldType="text"
              label="Género"
              name="genero"
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
  );
}
