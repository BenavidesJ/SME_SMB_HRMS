import {
  Badge,
  Box,
  Button as ChakraButton,
  HStack,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { Form, InputField } from "../../../../components/forms";
import { Modal } from "../../../../components/general";
import { Button } from "../../../../components/general/button/Button";
import { DataTable } from "../../../../components/general/table/DataTable";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { Layout } from "../../../../components/layout";
import type { Department, JobPosition } from "../../../../types/Company";
import type { Status, TipoJornada } from "../../../../types";
import {
  formatCurrencyInputValue,
  parseCurrencyInputValue,
  toTitleCase,
} from "../../../../utils";
import {
  getContractTemplatesForPuesto,
  replaceContractTemplatesForPuesto,
  type ContractTemplate,
} from "../colaboradores/components/contractTemplates";

type CreateJobPositionPayload = {
  nombre?: string;
  departamento?: string;
  estado?: string;
};

type CreateJobPositionFormValues = {
  nombre: string;
  departamento: string;
  estado?: string;
};

type TemplateFormValues = {
  nombre: string;
  tipo_jornada: string;
  salario_base: string;
  hora_inicio: string;
  hora_fin: string;
  dias_laborales: string[];
  dias_libres: string[];
};

const DAY_OPTIONS = [
  { label: "Lunes", value: "L" },
  { label: "Martes", value: "K" },
  { label: "Miércoles", value: "M" },
  { label: "Jueves", value: "J" },
  { label: "Viernes", value: "V" },
  { label: "Sábado", value: "S" },
  { label: "Domingo", value: "D" },
];

const ALL_DAYS = new Set(DAY_OPTIONS.map((day) => day.value));

const salaryRules = {
  required: "El campo es obligatorio",
  validate: (value: unknown) =>
    parseCurrencyInputValue(value) !== null || "Ingrese un salario válido",
};

const normalizeTime = (value: string) => String(value ?? "").slice(0, 5);

export default function Puestos() {
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [templateEditId, setTemplateEditId] = useState<string | null>(null);
  const [templateScope, setTemplateScope] = useState<"create" | "edit">("create");

  const [createTemplatesDraft, setCreateTemplatesDraft] = useState<ContractTemplate[]>([]);
  const [editTemplatesDraft, setEditTemplatesDraft] = useState<ContractTemplate[]>([]);

  const { data: puestos = [], isLoading: isTableLoading, refetch } = useApiQuery<JobPosition[]>({
    url: "mantenimientos/puestos",
  });
  const { data: departments = [] } = useApiQuery<Department[]>({
    url: "mantenimientos/departamentos",
  });
  const { data: estados = [] } = useApiQuery<Status[]>({
    url: "mantenimientos/estados",
  });
  const { data: tiposJornada = [] } = useApiQuery<TipoJornada[]>({
    url: "mantenimientos/tipos-jornada",
  });

  const { mutate: createPuesto, isLoading: isSubmitting } = useApiMutation<
    CreateJobPositionPayload,
    JobPosition
  >({
    url: "mantenimientos/puestos",
    method: "POST",
  });

  const { mutate: patchPuesto } = useApiMutation<
    CreateJobPositionPayload,
    JobPosition,
    number
  >({
    url: (id) => `mantenimientos/puestos/${id}`,
    method: "PATCH",
  });

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
    return puestos.find((row) => row.id === selectedId) ?? null;
  }, [puestos, selectedId]);

  useEffect(() => {
    if (!openEditModal || !selectedRow) return;

    setEditTemplatesDraft(
      getContractTemplatesForPuesto({
        puestoId: selectedRow.id,
        puestoNombre: selectedRow.puesto,
      }),
    );
  }, [openEditModal, selectedRow]);

  useEffect(() => {
    if (!openModal) {
      setCreateTemplatesDraft([]);
    }
  }, [openModal]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return puestos.slice(start, start + pageSize);
  }, [puestos, page]);

  const departmentsOptions = useMemo(
    () =>
      departments
        .filter(
          (department): department is Department & { nombre: string } =>
            typeof department.nombre === "string" && department.nombre.trim().length > 0,
        )
        .map((department) => ({
          label: toTitleCase(department.nombre),
          value: department.nombre,
        })),
    [departments],
  );

  const statusOptions = useMemo(
    () =>
      estados
        .filter(
          (status): status is Status & { estado: string } =>
            typeof status.estado === "string" && status.estado.trim().length > 0,
        )
        .map((status) => ({
          label: toTitleCase(status.estado),
          value: status.estado,
        })),
    [estados],
  );

  const tipoJornadaOptions = useMemo(
    () =>
      tiposJornada.map((item) => ({
        label: toTitleCase(item.tipo),
        value: item.tipo,
      })),
    [tiposJornada],
  );

  const templateFormInitialValues = useMemo<TemplateFormValues>(() => {
    const source =
      templateEditId && (templateScope === "create" ? createTemplatesDraft : editTemplatesDraft)
        ? (templateScope === "create" ? createTemplatesDraft : editTemplatesDraft).find(
          (template) => template.id === templateEditId,
        )
        : null;

    return {
      nombre: source?.nombre ?? "",
      tipo_jornada: source?.tipo_jornada ?? "",
      salario_base: source ? formatCurrencyInputValue(source.salario_base) : "",
      hora_inicio: source?.hora_inicio ?? "",
      hora_fin: source?.hora_fin ?? "",
      dias_laborales: source?.dias_laborales ?? [],
      dias_libres: source?.dias_libres ?? [],
    };
  }, [createTemplatesDraft, editTemplatesDraft, templateEditId, templateScope]);

  const columns = useMemo<DataTableColumn<JobPosition>[]>(() => {
    return [
      {
        id: "id",
        header: "ID",
        minW: "80px",
        textAlign: "center",
        cell: (row) => `${row.id}`,
      },
      {
        id: "puesto",
        header: "Puesto de Trabajo",
        minW: "80px",
        textAlign: "center",
        cell: (row) => `${row.puesto}`,
      },
      {
        id: "departamento",
        header: "Departamento",
        minW: "80px",
        textAlign: "center",
        cell: (row) => `${row.departamento}`,
      },
      {
        id: "estado",
        header: "Estado",
        minW: "80px",
        textAlign: "center",
        cell: (row) => {
          if (row.estado === "ACTIVO") {
            return (
              <Badge backgroundColor="blue.600" color="white">
                {toTitleCase(row.estado)}
              </Badge>
            );
          }
          if (row.estado === "INACTIVO") {
            return (
              <Badge backgroundColor="red.600" color="white">
                {toTitleCase(row.estado)}
              </Badge>
            );
          }
          return null;
        },
      },
    ];
  }, []);

  const validateTemplateForm = (values: TemplateFormValues) => {
    const salario = parseCurrencyInputValue(values.salario_base);
    if (salario === null || salario <= 0) {
      return "Ingrese un salario válido.";
    }

    const horaInicio = normalizeTime(values.hora_inicio);
    const horaFin = normalizeTime(values.hora_fin);
    if (!horaInicio || !horaFin) {
      return "Las horas de entrada y salida son obligatorias.";
    }

    if (horaInicio >= horaFin) {
      return "La hora de entrada debe ser menor que la hora de salida.";
    }

    const diasLaborales = new Set(values.dias_laborales ?? []);
    const diasLibres = new Set(values.dias_libres ?? []);

    if (!diasLaborales.size || !diasLibres.size) {
      return "Debe seleccionar días laborales y días libres.";
    }

    const overlap = [...diasLaborales].some((day) => diasLibres.has(day));
    if (overlap) {
      return "Días laborales y libres no pueden traslaparse.";
    }

    const union = new Set([...diasLaborales, ...diasLibres]);
    const allCovered =
      union.size === ALL_DAYS.size &&
      [...ALL_DAYS].every((day) => union.has(day));

    if (!allCovered) {
      return "Días laborales y libres deben cubrir los 7 días de la semana.";
    }

    return null;
  };

  const openTemplateEditor = (scope: "create" | "edit", templateId?: string) => {
    setTemplateScope(scope);
    setTemplateEditId(templateId ?? null);
    setOpenTemplateModal(true);
  };

  const handleSaveTemplate = (values: TemplateFormValues) => {
    const validationError = validateTemplateForm(values);
    if (validationError) {
      throw new Error(validationError);
    }

    const salario = parseCurrencyInputValue(values.salario_base);
    if (salario === null) {
      throw new Error("Ingrese un salario válido.");
    }

    const currentList = templateScope === "create" ? createTemplatesDraft : editTemplatesDraft;
    const nextTemplate: ContractTemplate = {
      id: templateEditId ?? `draft_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      nombre: String(values.nombre).trim(),
      puesto: "",
      tipo_jornada: String(values.tipo_jornada).trim(),
      salario_base: salario,
      hora_inicio: normalizeTime(values.hora_inicio),
      hora_fin: normalizeTime(values.hora_fin),
      dias_laborales: values.dias_laborales,
      dias_libres: values.dias_libres,
    };

    const nextList = templateEditId
      ? currentList.map((template) =>
        template.id === templateEditId ? { ...template, ...nextTemplate } : template,
      )
      : [...currentList, nextTemplate];

    if (templateScope === "create") {
      setCreateTemplatesDraft(nextList);
    } else {
      setEditTemplatesDraft(nextList);
    }

    setOpenTemplateModal(false);
    setTemplateEditId(null);
    return true;
  };

  const handleDeleteTemplate = (scope: "create" | "edit", templateId: string) => {
    if (scope === "create") {
      setCreateTemplatesDraft((prev) => prev.filter((template) => template.id !== templateId));
      return;
    }

    setEditTemplatesDraft((prev) => prev.filter((template) => template.id !== templateId));
  };

  const handleCreate = async (values: CreateJobPositionFormValues) => {
    try {
      const payload: CreateJobPositionPayload = {
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
        departamento: String(values.departamento ?? "").trim(),
      };

      const created = await createPuesto(payload);

      replaceContractTemplatesForPuesto({
        puestoId: created.id,
        puestoNombre: created.puesto,
        templates: createTemplatesDraft,
      });

      setOpenModal(false);
      setSelection([]);
      setPage(1);
      setCreateTemplatesDraft([]);
      await refetch();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleEdit = async (values: CreateJobPositionPayload) => {
    if (!selectedId || !selectedRow) return false;

    try {
      const payload = {
        nombre: String(values.nombre ?? "").trim().toUpperCase(),
        departamento: String(values.departamento ?? "").trim().toUpperCase(),
      };

      const updated = await patchPuesto(selectedId, payload);

      replaceContractTemplatesForPuesto({
        puestoId: updated.id,
        puestoNombre: updated.puesto,
        templates: editTemplatesDraft,
      });

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

    const payload = {
      estado: "INACTIVO",
    };

    try {
      await patchPuesto(selectedId, payload);
      setSelection([]);
      setPage(1);
      await refetch();
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  return (
    <Layout pageTitle="Mantenimiento de Puestos">
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
              Crear Puesto <FiPlus />
            </Button>
          </Box>
        </section>
        <section style={{ marginBottom: "100px" }}>
          <DataTable<JobPosition>
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
              totalCount: puestos.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </Stack>

      <Modal
        title="Crear puesto"
        isOpen={openModal}
        size="lg"
        onOpenChange={(event) => {
          setOpenModal(event.open);
          if (!event.open) {
            setCreateTemplatesDraft([]);
          }
        }}
        content={
          <Form onSubmit={handleCreate} resetOnSuccess>
            <Stack gap="4">
              <InputField
                fieldType="text"
                label="Nombre del puesto"
                name="nombre"
                required
                rules={{
                  required: "El campo es obligatorio",
                  pattern: {
                    value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
                    message: "Solo se permiten letras y espacios",
                  },
                  setValueAs: (value) => String(value ?? "").trim(),
                }}
              />

              <InputField
                fieldType="select"
                label="Departamento"
                name="departamento"
                required
                placeholder={departments.length ? "Seleccione una opción" : "Cargando..."}
                disableSelectPortal
                options={departmentsOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: departments.length === 0 }}
              />

              <Stack gap="2">
                <HStack justify="space-between">
                  <Heading size="sm">Plantillas del puesto</Heading>
                  <Button
                    appearance="login"
                    size="sm"
                    onClick={() => openTemplateEditor("create")}
                  >
                    Agregar plantilla <FiPlus />
                  </Button>
                </HStack>

                {createTemplatesDraft.length === 0 ? (
                  <Text color="fg.muted" fontSize="sm">
                    Aún no has agregado plantillas para este puesto.
                  </Text>
                ) : (
                  <Stack gap="2">
                    {createTemplatesDraft.map((template) => (
                      <Box key={template.id} borderWidth="1px" borderRadius="md" p="3">
                        <HStack justify="space-between" align="flex-start">
                          <Stack gap="0.5">
                            <Text fontWeight="semibold">{template.nombre}</Text>
                            <Text fontSize="sm" color="fg.muted">
                              {toTitleCase(template.tipo_jornada)} · ₡{formatCurrencyInputValue(template.salario_base)}
                            </Text>
                            <Text fontSize="sm" color="fg.muted">
                              {template.hora_inicio} - {template.hora_fin}
                            </Text>
                          </Stack>

                          <HStack>
                            <ChakraButton
                              size="xs"
                              variant="outline"
                              onClick={() => openTemplateEditor("create", template.id)}
                            >
                              <FiEdit2 />
                            </ChakraButton>
                            <ChakraButton
                              size="xs"
                              colorPalette="red"
                              variant="outline"
                              onClick={() => handleDeleteTemplate("create", template.id)}
                            >
                              <FiTrash2 />
                            </ChakraButton>
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>

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
            </Stack>
          </Form>
        }
      />

      <Modal
        title="Editar puesto"
        isOpen={openEditModal}
        size="lg"
        onOpenChange={(event) => {
          setOpenEditModal(event.open);
          if (!event.open) {
            setTemplateEditId(null);
          }
        }}
        content={
          <Form
            onSubmit={handleEdit}
            resetOnSuccess
            defaultValues={{
              nombre: selectedRow?.puesto,
              departamento: selectedRow?.departamento,
              estado: selectedRow?.estado,
            }}
          >
            <Stack gap="4">
              <InputField
                fieldType="text"
                label="Nombre del puesto"
                name="nombre"
                required
                rules={{
                  required: "El campo es obligatorio",
                  pattern: {
                    value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
                    message: "Solo se permiten letras y espacios",
                  },
                  setValueAs: (value) => String(value ?? "").trim(),
                }}
              />

              <InputField
                fieldType="select"
                label="Departamento"
                name="departamento"
                required
                placeholder={departments.length ? "Seleccione una opción" : "Cargando..."}
                disableSelectPortal
                options={departmentsOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: departments.length === 0 }}
              />

              <InputField
                fieldType="select"
                label="Estado"
                name="estado"
                required
                placeholder={estados.length ? "Seleccione una opción" : "Cargando..."}
                disableSelectPortal
                options={statusOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: estados.length === 0 }}
              />

              <Stack gap="2">
                <HStack justify="space-between">
                  <Heading size="sm">Plantillas del puesto</Heading>
                  <Button
                    appearance="login"
                    size="sm"
                    onClick={() => openTemplateEditor("edit")}
                    disabled={!selectedRow}
                  >
                    Agregar plantilla <FiPlus />
                  </Button>
                </HStack>

                {editTemplatesDraft.length === 0 ? (
                  <Text color="fg.muted" fontSize="sm">
                    Este puesto no tiene plantillas registradas.
                  </Text>
                ) : (
                  <Stack gap="2">
                    {editTemplatesDraft.map((template) => (
                      <Box key={template.id} borderWidth="1px" borderRadius="md" p="3">
                        <HStack justify="space-between" align="flex-start">
                          <Stack gap="0.5">
                            <Text fontWeight="semibold">{template.nombre}</Text>
                            <Text fontSize="sm" color="fg.muted">
                              {toTitleCase(template.tipo_jornada)} · ₡{formatCurrencyInputValue(template.salario_base)}
                            </Text>
                            <Text fontSize="sm" color="fg.muted">
                              {template.hora_inicio} - {template.hora_fin}
                            </Text>
                          </Stack>

                          <HStack>
                            <ChakraButton
                              size="xs"
                              variant="outline"
                              onClick={() => openTemplateEditor("edit", template.id)}
                            >
                              <FiEdit2 />
                            </ChakraButton>
                            <ChakraButton
                              size="xs"
                              colorPalette="red"
                              variant="outline"
                              onClick={() => handleDeleteTemplate("edit", template.id)}
                            >
                              <FiTrash2 />
                            </ChakraButton>
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>

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
                  Guardar cambios <FiPlus />
                </Button>
              </Box>
            </Stack>
          </Form>
        }
      />

      <Modal
        title={templateEditId ? "Editar plantilla" : "Agregar plantilla"}
        isOpen={openTemplateModal}
        size="lg"
        onOpenChange={(event) => {
          setOpenTemplateModal(event.open);
          if (!event.open) {
            setTemplateEditId(null);
          }
        }}
        content={
          <Form<TemplateFormValues>
            key={`${templateScope}-${templateEditId ?? "new"}`}
            onSubmit={handleSaveTemplate}
            defaultValues={templateFormInitialValues}
          >
            <SimpleGrid columns={2} gapX="1rem">
              <InputField
                fieldType="text"
                label="Nombre de plantilla"
                name="nombre"
                required
                rules={{ required: "El campo es obligatorio" }}
              />

              <InputField
                fieldType="select"
                label="Tipo de Jornada"
                name="tipo_jornada"
                required
                disableSelectPortal
                options={tipoJornadaOptions}
                placeholder={tiposJornada.length ? "Seleccione una opción" : "Cargando..."}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: tiposJornada.length === 0 }}
              />

              <InputField
                fieldType="text"
                label="Salario Base"
                name="salario_base"
                startElement="₡"
                currencyMask
                required
                rules={salaryRules}
              />

              <InputField
                fieldType="time"
                label="Hora de Entrada"
                name="hora_inicio"
                required
                rules={{ required: "El campo es obligatorio" }}
              />

              <InputField
                fieldType="time"
                label="Hora de Salida"
                name="hora_fin"
                required
                rules={{ required: "El campo es obligatorio" }}
              />

              <InputField
                fieldType="select"
                label="Días Laborales"
                name="dias_laborales"
                options={DAY_OPTIONS}
                disableSelectPortal
                selectRootProps={{ multiple: true }}
                required
                rules={{ required: "El campo es obligatorio" }}
              />

              <InputField
                fieldType="select"
                label="Días Libres"
                name="dias_libres"
                options={DAY_OPTIONS}
                disableSelectPortal
                selectRootProps={{ multiple: true }}
                required
                rules={{ required: "El campo es obligatorio" }}
              />
            </SimpleGrid>

            <Button
              mt="4"
              fontWeight="semibold"
              colorPalette="blue"
              type="submit"
            >
              {templateEditId ? "Guardar plantilla" : "Crear plantilla"}
            </Button>
          </Form>
        }
      />
    </Layout>
  );
}
