import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button as ChakraButton, SimpleGrid, Stack } from "@chakra-ui/react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { Layout } from "../../../../components/layout";
import { DataTable } from "../../../../components/general/table/DataTable";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { Modal } from "../../../../components/general";
import { Form, InputField } from "../../../../components/forms";
import { Button } from "../../../../components/general/button/Button";
import { toTitleCase } from "../../../../utils";

import {
  createContractType,
  deleteContractType,
  getAllContractTypesFull,
  patchContractType,
  type TipoContratoRow,
} from "../../../../services/api/tiposContrato";

type TipoContratoFormCreate = { tipo_contrato: string };
type TipoContratoFormEdit = { tipo_contrato: string };

const TiposContrato = () => {
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rows, setRows] = useState<TipoContratoRow[]>([]);
  const [editingRow, setEditingRow] = useState<TipoContratoRow | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const fill = useCallback(async () => {
    try {
      setIsTableLoading(true);
      const res = await getAllContractTypesFull();
      setRows(res.data.data ?? []);
    } finally {
      setIsTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fill();
  }, [fill]);

  const columns = useMemo<DataTableColumn<TipoContratoRow>[]>(() => {
    return [
      {
        id: "id_tipo_contrato",
        header: "ID",
        minW: "80px",
        textAlign: "center",
        cell: (r) => String(r.id),
      },
      {
        id: "tipo_contrato",
        header: "Tipo de contrato",
        minW: "220px",
        textAlign: "center",
        cell: (r) => toTitleCase(r.tipo_contrato),
      },
    ];
  }, []);

  const handleCreate = async (values: TipoContratoFormCreate) => {
    try {
      setIsSubmitting(true);

      const payload = { tipo_contrato: String(values.tipo_contrato ?? "").trim() };
      await createContractType(payload);

      await fill();
      setOpenCreate(false);

      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (values: TipoContratoFormEdit) => {
    if (!editingRow) return false;

    try {
      setIsSubmitting(true);

      const payload = { tipo_contrato: String(values.tipo_contrato ?? "").trim() };
      await patchContractType(editingRow.id, payload);

      await fill();
      setOpenEdit(false);
      setEditingRow(null);

      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {

    try {
      setIsSubmitting(true);

      await deleteContractType(id);

      await fill();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout pageTitle="Tipos de Contrato">
      <Stack px="2.5rem" gap="8" py="1rem">
        <section>
          <Box w="250px">
            <Button
              appearance="login"
              size="lg"
              w="100%"
              onClick={() => setOpenCreate(true)}
            >
              Crear Tipo de Contrato <FiPlus />
            </Button>
          </Box>
        </section>

        <section style={{ marginBottom: "100px" }}>
          <DataTable<TipoContratoRow>
            data={isTableLoading ? [] : rows}
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
                      setOpenEdit(true);
                    }}
                  >
                    <FiEdit2 /> Editar
                  </ChakraButton>
                  <ChakraButton
                    variant="subtle"
                    colorPalette="red"
                    size="sm"
                    loading={isSubmitting}
                    onClick={() => handleDelete(row.id)}
                  >
                    <FiTrash2 /> Eliminar
                  </ChakraButton>
                </Stack>
              ),
            }}
            pagination={{
              enabled: false,
              page: 1,
              pageSize: 10,
              totalCount: rows.length,
              onPageChange: () => { },
            }}
          />
        </section>
      </Stack>

      {/* Modal Crear */}
      <Modal
        title="Crear Tipo de Contrato"
        isOpen={openCreate}
        size="lg"
        onOpenChange={(e) => setOpenCreate(e.open)}
        content={
          <Form<TipoContratoFormCreate>
            onSubmit={handleCreate}
            resetOnSuccess
            defaultValues={{ tipo_contrato: "" }}
          >
            <SimpleGrid columns={1} gapX="1rem">
              <InputField
                fieldType="text"
                label="Tipo de Contrato"
                name="tipo_contrato"
                required
                textOnly
                allowHyphen
                rules={{
                  required: "El campo es obligatorio",
                  setValueAs: (v) => String(v ?? "").trim(),
                  pattern: {
                    value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s-]+$/,
                    message: "Solo se permiten letras, espacios y guiones",
                  },
                }}
              />
            </SimpleGrid>

            <Box w="250px">
              <Button
                loading={isSubmitting}
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
        title="Editar Tipo de Contrato"
        isOpen={openEdit}
        size="lg"
        onOpenChange={(e) => {
          setOpenEdit(e.open);
          if (!e.open) setEditingRow(null);
        }}
        content={
          <Form<TipoContratoFormEdit>
            onSubmit={handleEdit}
            defaultValues={{
              tipo_contrato: editingRow?.tipo_contrato ?? "",
            }}
          >
            <SimpleGrid columns={1} gapX="1rem">
              <InputField
                fieldType="text"
                label="Tipo de contrato"
                name="tipo_contrato"
                required
                textOnly
                allowHyphen
                rules={{
                  required: "El campo es obligatorio",
                  setValueAs: (v) => String(v ?? "").trim(),
                  pattern: {
                    value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s-]+$/,
                    message: "Solo se permiten letras, espacios y guiones",
                  },
                }}
              />
            </SimpleGrid>

            <Box w="250px">
              <Button
                loading={isSubmitting}
                loadingText="Actualizando"
                appearance="login"
                type="submit"
                mt="4"
                size="lg"
                w="100%"
                disabled={!editingRow}
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

export default TiposContrato;
