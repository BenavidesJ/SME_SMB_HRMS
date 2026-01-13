import { useCallback, useMemo, useState } from "react";
import { Box, SimpleGrid, Stack, Heading } from "@chakra-ui/react";
import { Layout } from "../../../../layouts";
import { Form, InputField } from "../../../../components/forms";
import { FiPlus } from "react-icons/fi";
import { Button } from "../../../../components/general/button/Button";
import type { Employee, EmployeeRow, Gender, Roles } from "../../../../types";
import { toTitleCase } from "../../../../utils";
import { Modal } from "../../../../components/general";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { GestionEmpleadosTabla } from "./GestionEmpleadosTabla";
import { useApiMutation } from "../../../../hooks/useApiMutations";
import type { MaritalStatus } from "../../../../types/MaritalStatus";

const GestionEmpleados = () => {
  const { data: genders = [] } = useApiQuery<Gender[]>({ url: "/generos" });
  const { data: maritalStatuses = [] } = useApiQuery<MaritalStatus[]>({ url: "/estado_civil" });
  const { data: roles = [] } = useApiQuery<Roles[]>({ url: "/auth/roles" });
  const { data: employees = [], isLoading: isTableLoading, refetch: refetchEmployees } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });
  const { mutate: createEmployee, isLoading: isSubmitting } = useApiMutation<Employee, void>({ url: "/empleados", method: "POST" });
  const [openModal, setOpenModal] = useState(false);

  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);

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
  const marStatsOptions = useMemo(
    () => mapMaritalStatusToOptions(maritalStatuses),
    [maritalStatuses, mapMaritalStatusToOptions],
  );
  const rolesOptions = useMemo(() => mapRoleToOptions(roles), [roles, mapRoleToOptions]);

  const handleCreateEmployee = async (employee: Employee) => {
    try {
      const payload: Employee = {
        ...employee,
        cantidad_hijos: Number(employee.cantidad_hijos),
      };

      await createEmployee(payload);

      setSelection([]);
      setPage(1);
      await refetchEmployees();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

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
          />
        </section>
      </Stack>
      <Modal
        title="Crear empleado"
        isOpen={openModal}
        size="lg"
        onOpenChange={(e) => setOpenModal(e.open)}
        content={
          <Form onSubmit={handleCreateEmployee} resetOnSuccess >
            <SimpleGrid columns={{ base: 2, md: 3 }} gapX="1rem">
              <InputField
                fieldType="text"
                label="Nombre"
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
              <InputField
                fieldType="text"
                label="Primer Apellido"
                name="primer_apellido"
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
              <InputField
                fieldType="text"
                label="Segundo Apellido"
                name="segundo_apellido"
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
              <InputField
                fieldType="select"
                label="Género"
                name="genero"
                required
                disableSelectPortal
                placeholder={genders.length ? "Seleccione una opción" : "Cargando..."}
                options={genderOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: genders.length === 0 }}
              />
              <InputField
                fieldType="text"
                label="Cédula o DIMEX"
                name="identificacion"
                required
                rules={{
                  required: "El campo es obligatorio",
                  pattern: {
                    value: /^\d+$/,
                    message: "Solo se permiten números."
                  }
                }}
              />
              <InputField
                fieldType="email"
                label="Correo Eletrónico"
                name="correo_electronico"
                required
                rules={{ required: "El campo es obligatorio" }}
              />
              <InputField
                fieldType="text"
                label="Teléfono"
                name="telefono"
                required
                rules={{
                  required: "El campo es obligatorio",
                  pattern: { value: /^\d+$/, message: "Solo se permiten números" },
                  minLength: { value: 8, message: "Debe tener al menos 8 dígitos" },
                  maxLength: { value: 15, message: "No puede exceder 15 dígitos" },
                  setValueAs: (v) => String(v ?? "").trim(),
                }}
              />
              <InputField
                fieldType="date"
                label="Fecha de Ingreso"
                name="fecha_ingreso"
                required
                rules={{ required: "El campo es obligatorio" }}
              />
              <InputField
                fieldType="date"
                label="Fecha de Nacimiento"
                name="fecha_nacimiento"
                required
                rules={{ required: "El campo es obligatorio" }}
              />
              <InputField
                fieldType="select"
                label="Estado Civil"
                name="estado_civil"
                disableSelectPortal
                required
                placeholder={maritalStatuses.length ? "Seleccione una opción" : "Cargando..."}
                options={marStatsOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: maritalStatuses.length === 0 }}
              />
              <InputField
                fieldType="select"
                label="Rol"
                name="rol"
                required
                disableSelectPortal
                placeholder={roles.length ? "Seleccione una opción" : "Cargando..."}
                options={rolesOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: roles.length === 0 }}
              />
              <InputField
                fieldType="number"
                label="Cantidad de Hijos"
                name="cantidad_hijos"
                required
                rules={{
                  required: "El campo es obligatorio",
                }}
              />
            </SimpleGrid>
            {/* <Heading as="h3" size="md">Dirección</Heading>
            <SimpleGrid columns={{ base: 2, md: 3 }} gap={2}>
              <InputField
                fieldType="select"
                label="Provincia"
                name="provincia"
                disableSelectPortal
                required
                placeholder={maritalStatuses.length ? "Seleccione una opción" : "Cargando..."}
                options={marStatsOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: maritalStatuses.length === 0 }}
              />
              <InputField
                fieldType="select"
                label="Cantón"
                name="canton"
                disableSelectPortal
                required
                placeholder={maritalStatuses.length ? "Seleccione una opción" : "Cargando..."}
                options={marStatsOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: maritalStatuses.length === 0 }}
              />
              <InputField
                fieldType="select"
                label="Distrito"
                name="distrito"
                disableSelectPortal
                required
                placeholder={maritalStatuses.length ? "Seleccione una opción" : "Cargando..."}
                options={marStatsOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: maritalStatuses.length === 0 }}
              />
            </SimpleGrid>
            <InputField
              fieldType="text"
              label="Otras señas"
              name="otros_datos"
              required
              rules={{
                required: "El campo es obligatorio",
              }}
            /> */}

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
                Agregar Colaborador <FiPlus />
              </Button>
            </Box>
          </Form>
        }
      />
    </Layout>
  );
};

export default GestionEmpleados;
