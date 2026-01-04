import { useParams } from "react-router";
import { Layout } from "../../../layouts";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { EmployeeRow, Puesto, TipoJornada } from "../../../types";
import { getAllContractTypes, getAllJobPositions, getAllScheduleTypes, getEmployeeByID } from "../../../services/api/employees";
import { Button, ButtonGroup, EmptyState, SimpleGrid, VStack } from "@chakra-ui/react";
import { FiFilePlus, FiFileText } from "react-icons/fi";
import { Form, InputField } from "../../../components/forms";
import { getAllPaymentCycles } from "../../../services/api/planillas";
import { toTitleCase } from "../../../utils";
import { showToast } from "../../../services/toast/toastService";

export default function ColaboradorDetalle() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<EmployeeRow | null>(null);
  const [ciclosPago, setCiclosPago] = useState<string[]>([]);
  const [tiposJornada, setTiposJornada] = useState<TipoJornada[]>([]);
  const [positions, setPositions] = useState<Puesto[]>([]);
  const [tipoContratos, setTipoContratos] = useState<string[]>([]);
  // const [isSubmitting, setIsSubmitting] = useState(false);

  const mapToOptions = useCallback(
    (items: string[]) => items.map((v) => ({ label: toTitleCase(v), value: v })),
    [],
  );

  const fillPaymentCycles = useCallback(async () => {
    try {
      const res = await getAllPaymentCycles();
      setCiclosPago(res.data.data ?? []);
    } catch (error) {
      console.log(error);
      showToast("Error al cargar los géneros. Recargue la página o contacte a soporte.", "error");
      setCiclosPago([]);
    }
  }, []);

  const fillScheduleTypes = useCallback(async () => {
    try {
      const res = await getAllScheduleTypes();
      setTiposJornada(res.data.data ?? []);
    } catch (error) {
      console.log(error);
      showToast("Error al cargar los géneros. Recargue la página o contacte a soporte.", "error");
      setTiposJornada([]);
    }
  }, []);

  const fillPositions = useCallback(async () => {
    try {
      const res = await getAllJobPositions();
      setPositions(res.data.data ?? []);
    } catch (error) {
      console.log(error);
      showToast("Error al cargar los géneros. Recargue la página o contacte a soporte.", "error");
      setPositions([]);
    }
  }, []);

  const fillContractTypes = useCallback(async () => {
    try {
      const res = await getAllContractTypes();
      setTipoContratos(res.data.data);
    } catch (error) {
      console.log(error);
      showToast("Error al cargar los géneros. Recargue la página o contacte a soporte.", "error");
      setPositions([]);
    }
  }, []);

  useEffect(() => {
    const getEmployeeData = async () => {
      const userID = Number(id);
      const res = await getEmployeeByID(userID);
      const data = res.data;
      setEmployee(data.data)
    }
    getEmployeeData();
  }, [id]);

  useEffect(() => {
    fillPaymentCycles();
    fillScheduleTypes();
    fillPositions();
    fillContractTypes();
  }, [fillPaymentCycles, fillScheduleTypes, fillPositions, fillContractTypes]);

  const positionsOptions = useMemo(() => mapToOptions(positions.map(p => p.puesto)), [positions, mapToOptions]);
  const contractTypesOptions = useMemo(() => mapToOptions(tipoContratos), [tipoContratos, mapToOptions]);
  const paymentCyclesOptions = useMemo(() => mapToOptions(ciclosPago), [ciclosPago, mapToOptions]);
  const tipoJornadaOptions = useMemo(() => mapToOptions(tiposJornada.map(t => t.tipo)), [tiposJornada, mapToOptions]);


  const computeFullName = useCallback(() => {
    if (!employee) return "";
    const { nombre, primer_apellido, segundo_apellido } = employee;
    return `${nombre} ${primer_apellido} ${segundo_apellido}`;
  }, [employee])

  return (
    <Layout pageTitle={`Vínculo laboral de ${computeFullName()} con BioAlquimia`}>
      <Form onSubmit={() => { }}>
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 2, xl: 4 }}
          gapX="1rem"
        >
          <InputField
            fieldType="select"
            label="Puesto"
            name="puesto"
            required
            placeholder={positions.length ? "Seleccione una opción" : "Cargando..."}
            options={positionsOptions}
            rules={{ required: "El campo es obligatorio" }}
            selectRootProps={{ disabled: positions.length === 0 }}
          />
          <InputField
            fieldType="select"
            label="Tipo de Contrato"
            name="tipo_contrato"
            required
            placeholder={tipoContratos.length ? "Seleccione una opción" : "Cargando..."}
            options={contractTypesOptions}
            rules={{ required: "El campo es obligatorio" }}
            selectRootProps={{ disabled: tipoContratos.length === 0 }}
          />
          <InputField
            fieldType="select"
            label="Tipo de Jornada"
            name="tipo_jornada"
            required
            placeholder={tiposJornada.length ? "Seleccione una opción" : "Cargando..."}
            options={tipoJornadaOptions}
            rules={{ required: "El campo es obligatorio" }}
            selectRootProps={{ disabled: tiposJornada.length === 0 }}
          />
          <InputField
            fieldType="select"
            label="Ciclo de Pago"
            name="ciclo_pago"
            required
            placeholder={ciclosPago.length ? "Seleccione una opción" : "Cargando..."}
            options={paymentCyclesOptions}
            rules={{ required: "El campo es obligatorio" }}
            selectRootProps={{ disabled: ciclosPago.length === 0 }}
          />
          <InputField
            fieldType="text"
            label="Primer Apellido"
            name="primer_apellido"
            required
            rules={{ required: "El campo es obligatorio" }}
          />
          <InputField
            fieldType="text"
            label="Segundo Apellido"
            name="segundo_apellido"
            required
            rules={{ required: "El campo es obligatorio" }}
          />
          <InputField
            fieldType="text"
            label="Cédula o DIMEX"
            name="identificacion"
            required
            rules={{ required: "El campo es obligatorio" }}
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
            rules={{ required: "El campo es obligatorio" }}
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
            fieldType="number"
            label="Cantidad de Hijos"
            name="cantidad_hijos"
            required
            rules={{
              required: "El campo es obligatorio",
            }}
          />
        </SimpleGrid>
      </Form>
      <EmptyState.Root colorPalette="blue" h="500px" border="0.15rem dashed" borderColor="blue.600" alignContent="center" mt="2rem">
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiFileText />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>
              {computeFullName()} aún no tiene contratos para mostrar.
            </EmptyState.Title>
            <EmptyState.Description>
              Empieza llenando los datos para asignarle un contrato a {computeFullName()}
            </EmptyState.Description>
          </VStack>
          <ButtonGroup>
            <Button onClick={() => { }}>Crear contrato <FiFilePlus /></Button>
          </ButtonGroup>
        </EmptyState.Content>
      </EmptyState.Root>
    </Layout>
  );
}
