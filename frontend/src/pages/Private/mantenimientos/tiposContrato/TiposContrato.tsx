import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, HStack, SimpleGrid, Stack } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { Layout } from "../../../../layouts";
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

type TipoContratoFormCreate = { tipo: string };
type TipoContratoFormEdit = { tipo_contrato: string };

const TiposContrato = () => {
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rows, setRows] = useState<TipoContratoRow[]>([]);
  const [selection, setSelection] = useState<string[]>([]);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const selectedId = useMemo(() => {
    if (selection.length !== 1) return null;
    const n = Number(selection[0]);
    return Number.isFinite(n) ? n : null;
  }, [selection]);

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return rows.find((r) => r.id_tipo_contrato === selectedId) ?? null;
  }, [rows, selectedId]);

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
        cell: (r) => String(r.id_tipo_contrato),
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

      const payload = { tipo: String(values.tipo ?? "").trim() };
      await createContractType(payload);

      await fill();
      setSelection([]);
      setOpenCreate(false);

      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = () => {
    if (!selectedRow) return;
    setOpenEdit(true);
  };

  const handleEdit = async (values: TipoContratoFormEdit) => {
    if (!selectedId) return false;

    try {
      setIsSubmitting(true);

      const payload = { tipo_contrato: String(values.tipo_contrato ?? "").trim() };
      await patchContractType(selectedId, payload);

      await fill();
      setSelection([]);
      setOpenEdit(false);

      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (selection.length === 0) return;

    try {
      setIsSubmitting(true);

      for (const key of selection) {
        const id = Number(key);
        if (Number.isFinite(id)) {
          await deleteContractType(id);
        }
      }

      await fill();
      setSelection([]);
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
            selection={{
              enabled: true,
              selectedKeys: selection,
              onChange: setSelection,
              getRowKey: (r) => String(r.id_tipo_contrato),
            }}
            actionBar={{
              enabled: true,
              renderActions: () => (
                <HStack gap="2">
                  <Button
                    appearance="login"
                    loading={isSubmitting}
                    disabled={selection.length !== 1}
                    onClick={handleOpenEdit}
                  >
                    Editar
                  </Button>

                  <Button
                    appearance="login"
                    loading={isSubmitting}
                    disabled={selection.length === 0}
                    onClick={handleDelete}
                  >
                    Eliminar
                  </Button>
                </HStack>
              ),
            }}
            pagination={{
              enabled: false,
              page: 1,
              pageSize: 10,
              totalCount: rows.length,
              onPageChange: () => {},
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
            defaultValues={{ tipo: "" }}
          >
            <SimpleGrid columns={1} gapX="1rem">
              <InputField
                fieldType="text"
                label="Tipo"
                name="tipo"
                required
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
        onOpenChange={(e) => setOpenEdit(e.open)}
        content={
          <Form<TipoContratoFormEdit>
            onSubmit={handleEdit}
            defaultValues={{
              tipo_contrato: selectedRow?.tipo_contrato ?? "",
            }}
          >
            <SimpleGrid columns={1} gapX="1rem">
              <InputField
                fieldType="text"
                label="Tipo de contrato"
                name="tipo_contrato"
                required
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

export default TiposContrato;
