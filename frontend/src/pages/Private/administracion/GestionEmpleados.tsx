import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, SimpleGrid, Wrap } from "@chakra-ui/react";
import { Layout } from "../../../layouts";
import { Form, InputField } from "../../../components/forms";
import { FiPlus } from "react-icons/fi";
import { Button } from "../../../components/general/button/Button";
import type { Employee } from "../../../types";
import { createEmployee, getAllGenders, getAllMaritalStatuses } from "../../../services/api/employees";
import { showToast } from "../../../services/toast/toastService";
import { getAllRoles } from "../../../services/api/security";


const GestionEmpleados = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [genders, setGenders] = useState<string[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  const toTitleCase = (s: string) =>
    s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mapToOptions = (items: string[]) =>
    items.map((v) => ({ label: toTitleCase(v), value: v.toLowerCase() }));

  const fillGenders = useCallback(async () => {
    try {
      const res = await getAllGenders();
      setGenders(res.data.data ?? []);
    } catch (error) {
      console.log(error);
      showToast(
        "Error al cargar los géneros. Recargue la página o contacte a soporte.",
        "error",
      );
      setGenders([]);
    }
  }, []);

  const fillMaritalStatuses = useCallback(async () => {
    try {
      const res = await getAllMaritalStatuses();
      setMaritalStatuses(res.data.data ?? []);
    } catch (error) {
      console.log(error);
      showToast(
        "Error al cargar los estados civiles. Recargue la página o contacte a soporte.",
        "error",
      );
      setMaritalStatuses([]);
    }
  }, []);

  const fillRoles = useCallback(async () => {
    try {
      const res = await getAllRoles();
      setRoles(res.data.data ?? []);
    } catch (error) {
      console.log(error);
      showToast(
        "Error al cargar los roles. Recargue la página o contacte a soporte.",
        "error",
      );
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    fillGenders();
    fillMaritalStatuses();
    fillRoles();
  }, [fillGenders, fillMaritalStatuses, fillRoles]);

  const genderOptions = useMemo(() => mapToOptions(genders), [genders, mapToOptions]);
  const marStatsOptions = useMemo(() => mapToOptions(maritalStatuses), [maritalStatuses, mapToOptions]);
  const rolesOptions = useMemo(() => mapToOptions(roles), [roles, mapToOptions]);

  const handleCreateEmployee = async (employee: Employee) => {
    try {
      setIsLoading(true)
      const newEmployee = await createEmployee(employee);
      if (newEmployee) setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fillGenders();
  }, [fillGenders])

  return (
    <Layout pageTitle="Creación de Empleados">
      <Wrap>
        <section>
          <Form onSubmit={handleCreateEmployee}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: "24px", md: "1.5rem" }}>
              <InputField
                fieldType="text"
                label="Nombre"
                name="nombre"
                required
                rules={{
                  required: "El campo es obligatorio",
                }}
              />
              <InputField
                fieldType="text"
                label="Primer Apellido"
                name="primer_apellido"
                required
                rules={{
                  required: "El campo es obligatorio",
                }}
              />
              <InputField
                fieldType="text"
                label="Segundo Apellido"
                name="segundo_apellido"
                required
                rules={{
                  required: "El campo es obligatorio",
                }}
              />
              <InputField
                fieldType="select"
                label="Género"
                name="genero"
                required
                options={genderOptions.length ? genderOptions : []}
                rules={{
                  required: "El campo es obligatorio",
                }}
              />
              <InputField
                fieldType="text"
                label="Cédula o DIMEX"
                name="identificacion"
                required
                rules={{
                  required: "El campo es obligatorio",
                }}
              />
              <InputField
                fieldType="email"
                label="Correo Eletrónico"
                name="correo_electronico"
                required
                rules={{
                  required: "El campo es obligatorio",
                }}
              />
              <InputField
                fieldType="date"
                label="Fecha de Ingreso"
                name="fecha_ingreso"
                required
                rules={{
                  required: "El campo es obligatorio",
                }}
              />
              <InputField
                fieldType="date"
                label="Fecha de Nacimiento"
                name="fecha_nacimiento"
                required
                rules={{
                  required: "El campo es obligatorio",
                }}
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
              <InputField
                fieldType="select"
                label="Estado Civil"
                name="estado_civil"
                required
                options={marStatsOptions.length ? marStatsOptions : []}
                rules={{
                  required: "El campo es obligatorio",
                }}
              />
              <InputField
                fieldType="select"
                label="Rol"
                name="rol"
                required
                options={rolesOptions.length ? rolesOptions : []}
                rules={{
                  required: "El campo es obligatorio",
                }}
              />
            </SimpleGrid>
            <Box
              w="300px"
              alignContent="center"
            >
              <Button
                loading={isLoading}
                loadingText="Agregando"
                appearance="login"
                type='submit'
                mt="4"
                size="lg"
                w="100%"
                marginBottom="5"
              >
                Agregar Colaborador <FiPlus />
              </Button>
            </Box>
          </Form>
        </section>
        <div style={{ width: 100, height: 100, background: "red" }} />
      </Wrap>
    </Layout>
  )
}

export default GestionEmpleados;