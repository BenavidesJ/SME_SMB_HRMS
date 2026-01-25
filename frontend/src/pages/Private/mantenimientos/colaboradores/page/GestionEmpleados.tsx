import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useCallback, useMemo, useState } from "react";
import { Box, Stack } from "@chakra-ui/react";
import { Form } from "../../../../../components/forms";
import { FiPlus } from "react-icons/fi";
import { Button } from "../../../../../components/general/button/Button";
import type { Employee, EmployeeFullApi, EmployeeRow, Gender, Roles } from "../../../../../types";
import { toTitleCase } from "../../../../../utils";
import { Modal } from "../../../../../components/general";
import { useApiQuery } from "../../../../../hooks/useApiQuery";
import { GestionEmpleadosTabla } from "../components/GestionEmpleadosTabla";
import { useApiMutation } from "../../../../../hooks/useApiMutations";
import type { MaritalStatus } from "../../../../../types/MaritalStatus";
import type { Provincia } from "../../../../../types/Address";
import { Layout } from "../../../../../components/layout";
import { Formularios } from "../components/Formularios";

dayjs.extend(customParseFormat);

type PatchEmployeePayload = Partial<Employee> & {
  direccion?: {
    provincia?: string;
    canton?: string;
    distrito?: string;
    otros_datos?: string;
  };
};

const toDateInput = (v?: string | null) => {
  if (!v) return "";
  const d = dayjs(v, "DD-MM-YYYY HH:mm:ss", true);
  if (d.isValid()) return d.format("YYYY-MM-DD");
  const d2 = dayjs(v, "YYYY-MM-DD", true);
  return d2.isValid() ? d2.format("YYYY-MM-DD") : "";
};

const GestionEmpleados = () => {
  const { data: genders = [] } = useApiQuery<Gender[]>({ url: "/generos" });
  const { data: maritalStatuses = [] } = useApiQuery<MaritalStatus[]>({ url: "/estado_civil" });
  const { data: roles = [] } = useApiQuery<Roles[]>({ url: "/auth/roles" });
  const { data: employees = [], isLoading: isTableLoading, refetch: refetchEmployees } =
    useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const { data: provincias = [], refetch: refetchProvincias } = useApiQuery<Provincia[]>({ url: "/provincias" });

  const { mutate: createEmployee, isLoading: isSubmitting } =
    useApiMutation<Employee, void>({ url: "/empleados", method: "POST" });

  const { mutate: patchEmployee, isLoading: isPatching } =
    useApiMutation<PatchEmployeePayload, void, number>({
      url: (id) => `/empleados/${id}`,
      method: "PATCH",
    });

  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);

  const mapMaritalStatusToOptions = useCallback(
    (items: MaritalStatus[]) => items.map((v) => ({ label: toTitleCase(v.estado_civil), value: v.estado_civil })),
    [],
  );
  const mapGenderToOptions = useCallback(
    (items: Gender[]) => items.map((v) => ({ label: toTitleCase(v.genero), value: v.genero })),
    [],
  );
  const mapRoleToOptions = useCallback(
    (items: Roles[]) => items.map((v) => ({ label: toTitleCase(v.nombre), value: v.nombre })),
    [],
  );

  const genderOptions = useMemo(() => mapGenderToOptions(genders), [genders, mapGenderToOptions]);
  const marStatsOptions = useMemo(() => mapMaritalStatusToOptions(maritalStatuses), [maritalStatuses, mapMaritalStatusToOptions]);
  const rolesOptions = useMemo(() => mapRoleToOptions(roles), [roles, mapRoleToOptions]);

  const selectedColaboradorId = useMemo(() => {
    if (selection.length !== 1) return null;
    const id = Number(selection[0]);
    return Number.isFinite(id) ? id : null;
  }, [selection]);

  const onClickEdit = () => {
    if (!selectedColaboradorId) return;
    setEditId(selectedColaboradorId);
    setOpenEditModal(true);
  };

  const { data: employeeFull, isLoading: isLoadingFull } = useApiQuery<EmployeeFullApi | null>({
    url: editId ? `/empleados/${editId}/full` : "/__disabled__",
    enabled: Boolean(openEditModal && editId),
  });

  const handleCreateEmployee = async (employee: Employee) => {
    try {
      const { provincia, canton, distrito, otros_datos, ...rest } = employee;

      const payload: Employee = {
        ...rest,
        cantidad_hijos: Number(employee.cantidad_hijos),
        direccion: { provincia, canton, distrito, otros_datos },
      };

      await createEmployee(payload);

      setSelection([]);
      setPage(1);
      await refetchEmployees();
      await refetchProvincias();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleEditEmployee = async (values: Employee) => {
    if (!editId) return false;

    try {
      const { provincia, canton, distrito, otros_datos, ...rest } = values;

      const patch: PatchEmployeePayload = {
        ...rest,
        cantidad_hijos: values.cantidad_hijos !== undefined ? Number(values.cantidad_hijos) : undefined,
        direccion: { provincia, canton, distrito, otros_datos },
      };

      await patchEmployee(editId, patch);

      setOpenEditModal(false);
      setSelection([]);
      await refetchEmployees();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const editDefaultValues = useMemo(() => {
    if (!employeeFull) return undefined;

    const role = employeeFull.usuario?.roles?.[0] ?? "";

    return {
      nombre: employeeFull.nombre ?? "",
      primer_apellido: employeeFull.primer_apellido ?? "",
      segundo_apellido: employeeFull.segundo_apellido ?? "",

      genero: employeeFull.genero ?? "",
      identificacion: String(employeeFull.identificacion ?? ""),
      correo_electronico: employeeFull.correo_electronico ?? "",
      telefono: String(employeeFull.telefono ?? ""),

      fecha_ingreso: toDateInput(employeeFull.fecha_ingreso),
      fecha_nacimiento: toDateInput(employeeFull.fecha_nacimiento),

      estado_civil: employeeFull.estado_civil ?? "",
      rol: role,

      cantidad_hijos: Number(employeeFull.cantidad_hijos ?? 0),

      provincia: employeeFull.direccion?.provincia ?? "",
      canton: employeeFull.direccion?.canton ?? "",
      distrito: employeeFull.direccion?.distrito ?? "",
      otros_datos: employeeFull.direccion?.otros_datos ?? "",
    } satisfies Partial<Employee>;
  }, [employeeFull]);

  const gendersLoaded = genders.length > 0;
  const maritalStatusesLoaded = maritalStatuses.length > 0;
  const rolesLoaded = roles.length > 0;

  return (
    <Layout pageTitle="Creación de Empleados">
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
              Crear Colaborador <FiPlus />
            </Button>
          </Box>
        </section>

        <section style={{ marginBottom: "100px" }}>
          <GestionEmpleadosTabla
            employees={employees}
            loading={isTableLoading}
            selection={selection}
            setSelection={setSelection}
            page={page}
            edit={onClickEdit}
          />
        </section>
      </Stack>

      <Modal
        title="Crear empleado"
        isOpen={openModal}
        size="lg"
        onOpenChange={(e) => setOpenModal(e.open)}
        content={
          <Form onSubmit={handleCreateEmployee} resetOnSuccess>
            <Formularios
              mode="create"
              genderOptions={genderOptions}
              marStatsOptions={marStatsOptions}
              rolesOptions={rolesOptions}
              provincias={provincias}
              gendersLoaded={gendersLoaded}
              maritalStatusesLoaded={maritalStatusesLoaded}
              rolesLoaded={rolesLoaded}
              isSubmitting={isSubmitting}
            />
          </Form>
        }
      />

      <Modal
        title="Editar empleado"
        isOpen={openEditModal}
        size="lg"
        onOpenChange={(e) => {
          setOpenEditModal(e.open);
          if (!e.open) setEditId(null);
        }}
        content={
          isLoadingFull || !employeeFull ? (
            <Box p="6">Cargando...</Box>
          ) : (
            <Form<Employee>
              key={editId ?? "edit"}
              onSubmit={handleEditEmployee}
              defaultValues={editDefaultValues}
            >
              <Formularios
                mode="edit"
                genderOptions={genderOptions}
                marStatsOptions={marStatsOptions}
                rolesOptions={rolesOptions}
                provincias={provincias}
                gendersLoaded={gendersLoaded}
                maritalStatusesLoaded={maritalStatusesLoaded}
                rolesLoaded={rolesLoaded}
                isSubmitting={isPatching}
                submitLabel="Actualizar"
                disableSubmit={!editId}

              />
            </Form>
          )
        }
      />
    </Layout>
  );
};

export default GestionEmpleados;
