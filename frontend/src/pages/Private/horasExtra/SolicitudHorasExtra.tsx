import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Stack,
  Wrap,
} from "@chakra-ui/react";
import { Layout } from "../../../components/layout";
import { Form, InputField } from "../../../components/forms";
import { Button } from "../../../components/general/button/Button";
import { Modal } from "../../../components/general";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useAuth } from "../../../context/AuthContext";
import { getCostaRicaTodayDate, toTitleCase } from "../../../utils";
import type { Contrato, EmployeeRow } from "../../../types";
import type { DataConsultaSolicitudes } from "../../../types/Overtime";
import { SolicitudCard } from "./components";
import { SolicitudesBoard } from "../../../components/general/requests/SolicitudesBoard";
import { PERSONAL_REQUEST_COLUMNS } from "../../../utils/requestStatus";

interface TipoJornadaCatalog {
  id: number;
  tipo: string;
  max_horas_diarias: number | string;
  max_horas_semanales: number | string;
}

interface TipoHxRequest {
  id_colaborador: number;
  id_aprobador: number;
  fecha_trabajo: string;
  horas_solicitadas: number;
}

type CreateRequestFormValues = {
  id_aprobador: string;
  fecha_trabajo: string;
  horas_solicitadas: string;
};

export const SolicitudHorasExtra = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const todayInCostaRica = useMemo(() => getCostaRicaTodayDate(), []);
  const [openModal, setOpenModal] = useState(false);

  const { data: tiposJornada = [] } = useApiQuery<TipoJornadaCatalog[]>({ url: "mantenimientos/tipos-jornada" });
  const { data: employees = [], isLoading: isLoadingEmployees } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });
  const { data: myContracts = [] } = useApiQuery<Contrato[]>({
    url: userId ? `empleados/${userId}/contratos` : "",
    enabled: Boolean(userId),
  });
  const {
    data: myRequestsResponse,
    isLoading: isLoadingRequests,
    refetch: refetchMyRequests,
  } = useApiQuery<DataConsultaSolicitudes>({
    url: userId ? `/horas-extra/solicitudes?id_colaborador=${userId}` : "",
    enabled: Boolean(userId),
  });

  const { mutate: createHxRequest, isLoading: isSubmitting } = useApiMutation<TipoHxRequest, void>({
    url: "/horas-extra/solicitud",
    method: "POST",
  });

  const jefeDirectoId = useMemo(() => {
    const activeContracts = myContracts.filter((contract) => String(contract.estado ?? "").toUpperCase() === "ACTIVO");
    const latestContract = (activeContracts.length ? activeContracts : myContracts)
      .slice()
      .sort((a, b) => String(b.fecha_inicio ?? "").localeCompare(String(a.fecha_inicio ?? "")))[0];

    return latestContract?.id_jefe_directo ? Number(latestContract.id_jefe_directo) : null;
  }, [myContracts]);

  const approverOptions = useMemo(() => {
    if (!jefeDirectoId) return [];

    const manager = (employees ?? []).find((colaborador) => Number(colaborador.id) === Number(jefeDirectoId));
    if (!manager) {
      return [{ label: `Colaborador ${jefeDirectoId}`, value: String(jefeDirectoId) }];
    }

    const baseName = [manager.nombre, manager.primer_apellido, manager.segundo_apellido]
      .filter(Boolean)
      .join(" ")
      .trim();
    const displayName = baseName ? toTitleCase(baseName) : `Colaborador ${jefeDirectoId}`;
    return [{ label: displayName, value: String(jefeDirectoId) }];
  }, [employees, jefeDirectoId]);

  const defaultApproverId = useMemo(() => approverOptions[0]?.value ?? "", [approverOptions]);
  const formKey = useMemo(() => `horas-extra-form-${defaultApproverId}`, [defaultApproverId]);

  const latestContract = useMemo(() => {
    const activeContracts = myContracts.filter((contract) => String(contract.estado ?? "").toUpperCase() === "ACTIVO");
    return (activeContracts.length ? activeContracts : myContracts)
      .slice()
      .sort((a, b) => String(b.fecha_inicio ?? "").localeCompare(String(a.fecha_inicio ?? "")))[0] ?? null;
  }, [myContracts]);

  const overtimeAvailability = useMemo(() => {
    if (!latestContract) {
      return {
        blocked: true,
        reason: "No se encontró un contrato para calcular el cupo de horas extra.",
        options: [] as Array<{ label: string; value: string }>,
      };
    }

    const jornadaTipo = String(latestContract.tipo_jornada ?? "").trim();
    if (!jornadaTipo) {
      return {
        blocked: true,
        reason: "El contrato activo no tiene tipo de jornada configurado.",
        options: [] as Array<{ label: string; value: string }>,
      };
    }

    const jornada = tiposJornada.find((item) => String(item.tipo ?? "").toUpperCase() === jornadaTipo.toUpperCase());
    if (!jornada) {
      return {
        blocked: true,
        reason: `No se pudo resolver la jornada "${jornadaTipo}" para calcular horas extra.`,
        options: [] as Array<{ label: string; value: string }>,
      };
    }

    const maxHorasDiarias = Number(jornada.max_horas_diarias);
    if (!Number.isFinite(maxHorasDiarias) || maxHorasDiarias <= 0) {
      return {
        blocked: true,
        reason: "La jornada tiene un máximo diario inválido para calcular horas extra.",
        options: [] as Array<{ label: string; value: string }>,
      };
    }

    const maxExtra = 12 - maxHorasDiarias;
    const maxExtraEntera = Math.floor(maxExtra);

    if (maxExtraEntera < 1) {
      return {
        blocked: true,
        reason: `Con una jornada de ${maxHorasDiarias} horas diarias no hay cupo disponible para horas extra.`,
        options: [] as Array<{ label: string; value: string }>,
      };
    }

    const options = Array.from({ length: maxExtraEntera }, (_, index) => {
      const hour = index + 1;
      return {
        label: `${hour} ${hour === 1 ? "hora" : "horas"}`,
        value: String(hour),
      };
    });

    return {
      blocked: false,
      reason: "",
      options,
    };
  }, [latestContract, tiposJornada]);

  const isOvertimeBlocked = overtimeAvailability.blocked;
  const overtimeHoursOptions = overtimeAvailability.options;
  const myRequests = useMemo(
    () => (myRequestsResponse && "grupos" in myRequestsResponse ? myRequestsResponse.grupos.flatMap((group) => group.items) : myRequestsResponse?.items ?? []),
    [myRequestsResponse],
  );

  const handleCreateRequest = async (solicitud: CreateRequestFormValues) => {
    const employeeId = user?.id;
    const approverId = Number(solicitud.id_aprobador);
    const requestedHours = Number(solicitud.horas_solicitadas);

    if (!Number.isFinite(approverId) || approverId <= 0) {
      return false;
    }

    if (isOvertimeBlocked || !Number.isFinite(requestedHours) || requestedHours <= 0) {
      return false;
    }

    try {
      const payload: TipoHxRequest = {
        fecha_trabajo: solicitud.fecha_trabajo,
        horas_solicitadas: requestedHours,
        id_colaborador: Number(employeeId),
        id_aprobador: approverId,
      };

      await createHxRequest(payload);
      await refetchMyRequests();
      setOpenModal(false);

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  return (
    <Layout pageTitle="Solicitudes de horas extra">
      <Stack gap="5" pb="6">
        <Box>
          <Button appearance="login" size="lg" onClick={() => setOpenModal(true)}>
            Crear Solicitud
          </Button>
        </Box>

        <SolicitudesBoard
          columns={PERSONAL_REQUEST_COLUMNS}
          items={myRequests}
          isLoading={isLoadingRequests}
          getStatus={(item) => item.estado.estado}
          getKey={(item) => item.id_solicitud_hx}
          renderItem={(item) => <SolicitudCard item={item} view="personal" />}
        />
      </Stack>

      <Modal
        title="Crear Solicitud"
        isOpen={openModal}
        onOpenChange={(event) => setOpenModal(event.open)}
        size="lg"
        content={
          <Form<CreateRequestFormValues>
            key={formKey}
            onSubmit={handleCreateRequest}
            resetOnSuccess
            defaultValues={{ id_aprobador: defaultApproverId, horas_solicitadas: "" }}
          >
            <Wrap maxW="600px">
              <InputField
                fieldType="select"
                label="Aprobador"
                name="id_aprobador"
                required
                disableSelectPortal
                placeholder={
                  isLoadingEmployees ? "Cargando jefe directo..." : "Jefe directo no disponible"
                }
                options={approverOptions}
                selectRootProps={{ disabled: true }}
                rules={{ required: "El campo es obligatorio" }}
              />
              <InputField
                fieldType="date"
                label="Fecha de realización"
                name="fecha_trabajo"
                required
                min={todayInCostaRica}
                rules={{
                  required: "El campo es obligatorio",
                  validate: (value) => {
                    const selectedDate = String(value ?? "");
                    if (!selectedDate) return true;
                    return selectedDate >= todayInCostaRica || "La fecha no puede ser anterior a hoy.";
                  },
                }}
              />
              {!isOvertimeBlocked && (
                <InputField
                  fieldType="select"
                  label="Cantidad de horas"
                  name="horas_solicitadas"
                  required
                  disableSelectPortal
                  placeholder={overtimeHoursOptions.length ? "Seleccione una opción" : "Sin opciones disponibles"}
                  options={overtimeHoursOptions}
                  rules={{ required: "El campo es obligatorio" }}
                  selectRootProps={{ disabled: overtimeHoursOptions.length === 0 }}
                />
              )}
            </Wrap>

            {isOvertimeBlocked && (
              <Alert.Root status="warning" mt={4}>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>No se puede registrar la solicitud</Alert.Title>
                  <Alert.Description>{overtimeAvailability.reason}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

            <Box w={{ base: "100%", sm: "250px" }} mt={4}>
              <Button
                loading={isSubmitting}
                loadingText="Enviando"
                appearance="login"
                type="submit"
                size="lg"
                w="100%"
                disabled={!approverOptions.length || isOvertimeBlocked}
              >
                Enviar solicitud
              </Button>
            </Box>
          </Form>
        }
      />
    </Layout>
  );
};
