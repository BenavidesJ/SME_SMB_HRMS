import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, SimpleGrid, Stack, Badge, Button as ChakraButton, HStack } from "@chakra-ui/react";
import { Layout } from "../../../../layouts";
import { Form, InputField } from "../../../../components/forms";
import { FiPlus } from "react-icons/fi";
import { Button } from "../../../../components/general/button/Button";
import type { Employee, EmployeeRow, Gender } from "../../../../types";
import {
  createEmployee,
  getAllMaritalStatuses,
  getEmployees,
} from "../../../../services/api/employees";
import { showToast } from "../../../../services/toast/toastService";
import { getAllRoles } from "../../../../services/api/security";
import { DataTable } from "../../../../components/general/table/DataTable";
import { useNavigate } from "react-router";
import type { DataTableColumn } from "../../../../components/general/table/types";
import { toTitleCase } from "../../../../utils";
import { Modal } from "../../../../components/general";
import { getAllGenders } from "../../../../services/api/generos";

const GestionEmpleados = () => {
  const nav = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const [genders, setGenders] = useState<Gender[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);

  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const mapToOptions = useCallback(
    (items: string[]) => items.map((v) => ({ label: toTitleCase(v), value: v })),
    [],
  );
  const mapGenderToOptions = useCallback(
    (items: Gender[]) => items.map((v) => ({ label: toTitleCase(v.genero), value: v.genero })),
    [],
  );

  const fillGenders = useCallback(async () => {
    try {
      const res = await getAllGenders();
      setGenders(res.data.data ?? []);
    } catch (error) {
      console.log(error);
      showToast("Error al cargar los géneros. Recargue la página o contacte a soporte.", "error");
      setGenders([]);
    }
  }, []);

  const fillMaritalStatuses = useCallback(async () => {
    try {
      const res = await getAllMaritalStatuses();
      setMaritalStatuses(res.data.data ?? []);
    } catch (error) {
      console.log(error);
      showToast("Error al cargar los estados civiles. Recargue la página o contacte a soporte.", "error");
      setMaritalStatuses([]);
    }
  }, []);

  const fillRoles = useCallback(async () => {
    try {
      const res = await getAllRoles();
      setRoles(res.data.data ?? []);
    } catch (error) {
      console.log(error);
      showToast("Error al cargar los roles. Recargue la página o contacte a soporte.", "error");
      setRoles([]);
    }
  }, []);

  const fillEmployees = useCallback(async () => {
    try {
      setIsTableLoading(true);
      const res = await getEmployees();
      setEmployees((res.data.data ?? []) as EmployeeRow[]);
    } catch (error) {
      console.log(error);
      showToast("Error al cargar empleados.", "error");
      setEmployees([]);
    } finally {
      setIsTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fillGenders();
    fillMaritalStatuses();
    fillRoles();
    fillEmployees();
  }, [fillGenders, fillMaritalStatuses, fillRoles, fillEmployees]);

  const genderOptions = useMemo(() => mapGenderToOptions(genders), [genders, mapGenderToOptions]);
  const marStatsOptions = useMemo(
    () => mapToOptions(maritalStatuses),
    [maritalStatuses, mapToOptions],
  );
  const rolesOptions = useMemo(() => mapToOptions(roles), [roles, mapToOptions]);

  const pagedEmployees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return employees.slice(start, start + pageSize);
  }, [employees, page]);

  const handleCreateEmployee = async (employee: Employee) => {
    try {
      setIsSubmitting(true);

      const payload: Employee = {
        ...employee,
        cantidad_hijos: Number(employee.cantidad_hijos),
      };

      await createEmployee(payload);

      setSelection([]);
      setPage(1);
      await fillEmployees();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo<DataTableColumn<EmployeeRow>[]>(() => {
    return [
      {
        id: "nombre",
        header: "Nombre",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.nombre} ${r.primer_apellido} ${r.segundo_apellido}`,
      },
      {
        id: "identificacion",
        header: "Identificación",
        minW: "80px",
        textAlign: "center",
        cell: (r) => String(r.identificacion),
      },
      {
        id: "correo",
        header: "Correo",
        minW: "220px",
        textAlign: "center",
        cell: (r) => r.correo_electronico,
      },
      {
        id: "genero",
        header: "Género",
        minW: "80px",
        textAlign: "center",
        cell: (r) => toTitleCase(r.genero),
      },
      {
        id: "estado_civil",
        header: "Estado civil",
        minW: "80px",
        textAlign: "center",
        cell: (r) => toTitleCase(r.estado_civil),
      },
      {
        id: "telefono",
        header: "Teléfono",
        minW: "80px",
        textAlign: "center",
        cell: (r) => toTitleCase(String(r.telefono)),
      },
      {
        id: "rol",
        header: "Rol",
        minW: "80px",
        textAlign: "center",
        cell: (r) => (
          <HStack gap="2" wrap="wrap">
            {(r.usuario?.roles ?? []).map((role) => (
              <Badge key={role} variant="surface">
                {role}
              </Badge>
            ))}
          </HStack>
        ),
      },
      {
        id: "estado",
        header: "Estado",
        minW: "80px",
        textAlign: "center",
        cell: (r) => {
          if (r.estado === "ACTIVO") {
            return (<Badge backgroundColor="blue.600" color="white">{toTitleCase(r.estado)}</Badge>)
          } else if (r.estado === "INACTIVO") {
            return (<Badge backgroundColor="red.600" color="white">{toTitleCase(r.estado)}</Badge>)
          }
        },
      },

    ];
  }, []);

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
          <DataTable<EmployeeRow>
            data={isTableLoading ? [] : pagedEmployees}
            columns={columns}
            isDataLoading={isTableLoading}
            size="md"
            selection={{
              enabled: true,
              selectedKeys: selection,
              onChange: setSelection,
              getRowKey: (r) => String(r.usuario?.id_usuario),
            }}
            actionBar={{
              enabled: true,
              renderActions: () => (
                <>
                  <ChakraButton
                    variant="solid"
                    colorPalette="red"
                    size="sm"
                    onClick={() => console.log("Eliminar", selection)}
                  >
                    Desactivar
                  </ChakraButton>
                  <ChakraButton
                    variant="solid"
                    colorPalette="yellow"
                    size="sm"
                    disabled={selection.length !== 1}
                    onClick={() => console.log("Exportar", selection)}
                  >
                    Editar
                  </ChakraButton>
                  <ChakraButton
                    variant="solid"
                    colorPalette="teal"
                    size="sm"
                    disabled={selection.length !== 1}
                    onClick={() => nav(`/mantenimientos-consultas/colaboradores/${selection}`)}
                  >
                    Administrar Vínculo Laboral
                  </ChakraButton>
                </>
              ),
            }}
            pagination={{
              enabled: true,
              page,
              pageSize,
              totalCount: employees.length,
              onPageChange: setPage,
            }}
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
            <SimpleGrid columns={2} gapX="1rem">
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
