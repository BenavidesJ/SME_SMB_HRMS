import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Grid,
  GridItem,
  Heading,
  Stack,
  Tabs,
  Wrap,
} from "@chakra-ui/react";
import { LuUser, LuUsers } from "react-icons/lu";
import { Layout } from "../../../components/layout";
import { Form, InputField } from "../../../components/forms";
import { Button } from "../../../components/general/button/Button";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useAuth } from "../../../context/AuthContext";
import { getCostaRicaTodayDate, toTitleCase } from "../../../utils";
import type { Contrato, EmployeeRow } from "../../../types";
import type { SolicitudesQuery } from "../../../types/Overtime";
import { ListaSolicitudes } from "./components";
import { FiltrosSolicitudes } from "./components/FiltrosSolicitudes";

interface TipoHx {
  id: number;
  nombre: string;
  descripcion: string;
  multiplicador: string;
}

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
  id_tipo_hx: number;
}

type CreateRequestFormValues = {
  id_aprobador: string;
  fecha_trabajo: string;
  horas_solicitadas: string;
  id_tipo_hx: string;
};

type CollaboratorForm = { id_colaborador: string };

export const SolicitudHorasExtra = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const todayInCostaRica = useMemo(() => getCostaRicaTodayDate(), []);

  const hasAdminPermission = useMemo(
    () => {
      const userRoles = user?.usuario?.rol ? [user.usuario.rol] : [];
      return userRoles.some((role) => role === "ADMINISTRADOR" || role === "SUPER_ADMIN");
    },
    [user]
  );

  const { data: tipoHx = [] } = useApiQuery<TipoHx[]>({ url: "mantenimientos/tipos-hora-extra" });
  const { data: tiposJornada = [] } = useApiQuery<TipoJornadaCatalog[]>({ url: "mantenimientos/tipos-jornada" });
  const { data: employees = [], isLoading: isLoadingEmployees } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });
  const { data: myContracts = [] } = useApiQuery<Contrato[]>({
    url: userId ? `empleados/${userId}/contratos` : "",
    enabled: Boolean(userId),
  });

  const { mutate: createHxRequest, isLoading: isSubmitting } = useApiMutation<TipoHxRequest, void>({
    url: "/horas-extra/solicitud",
    method: "POST",
  });

  const tipoHxOptions = useMemo(
    () => tipoHx.map((item) => ({ label: toTitleCase(item.nombre), value: String(item.id) })),
    [tipoHx]
  );

  const [myFilters, setMyFilters] = useState<SolicitudesQuery>({
    modo: "reciente",
    id_colaborador: userId ? Number(userId) : undefined,
  });
  const [othersFilters, setOthersFilters] = useState<SolicitudesQuery>({ modo: "reciente" });
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>("");

  useEffect(() => {
    if (userId) {
      setMyFilters((prev) => ({ ...prev, id_colaborador: Number(userId) }));
    }
  }, [userId]);

  useEffect(() => {
    setOthersFilters((prev) => ({
      ...prev,
      id_colaborador: selectedCollaboratorId ? Number(selectedCollaboratorId) : undefined,
    }));
  }, [selectedCollaboratorId]);

  const handleMyFiltersChange = useCallback(
    (next: SolicitudesQuery) => {
      setMyFilters({
        ...next,
        id_colaborador: userId ? Number(userId) : undefined,
      });
    },
    [userId]
  );

  const handleOthersFiltersChange = useCallback(
    (next: SolicitudesQuery) => {
      setOthersFilters({
        ...next,
        id_colaborador: selectedCollaboratorId ? Number(selectedCollaboratorId) : undefined,
      });
    },
    [selectedCollaboratorId]
  );

  const collaboratorOptions = useMemo(() => {
    return (employees ?? []).map((employee) => {
      const baseName = [employee.nombre, employee.primer_apellido, employee.segundo_apellido]
        .filter(Boolean)
        .join(" ")
        .trim();
      const label = baseName ? toTitleCase(baseName) : `Colaborador ${employee.id}`;
      return { label, value: String(employee.id) };
    });
  }, [employees]);

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
        id_tipo_hx: Number(solicitud.id_tipo_hx),
        id_colaborador: Number(employeeId),
        id_aprobador: approverId,
      };

      await createHxRequest(payload);

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleOtherCollaboratorSubmit = async (values: CollaboratorForm) => {
    setSelectedCollaboratorId(values.id_colaborador ?? "");
    return true;
  };

  return (
    <Layout pageTitle="Solicitudes de horas extra">
      <Grid templateColumns={{ base: "1fr", lg: "800px 1fr" }} gap={{ base: 4, lg: 6 }}>
        <GridItem>
          <Box bg="white" borderRadius="xl" boxShadow="md" p={6} h={{ base: "auto", lg: "full" }}>
            <Heading size="sm" mb={4}>
              Solicitudes registradas
            </Heading>

            <Tabs.Root variant="line" defaultValue="mine">
              <Tabs.List>
                <Tabs.Trigger value="mine">
                  <LuUser />
                  Mis solicitudes
                </Tabs.Trigger>
                {hasAdminPermission && (
                  <Tabs.Trigger value="others">
                    <LuUsers />
                    Otros colaboradores
                  </Tabs.Trigger>
                )}
              </Tabs.List>

              <Tabs.Content value="mine">
                <Stack gap={4} mt={4}>
                  <FiltrosSolicitudes value={myFilters} onChange={handleMyFiltersChange} />
                  <ListaSolicitudes filtros={myFilters} />
                </Stack>
              </Tabs.Content>

              {hasAdminPermission && (
                <Tabs.Content value="others">
                  <Stack gap={4} mt={4}>
                    <Form<CollaboratorForm>
                      onSubmit={handleOtherCollaboratorSubmit}
                      resetOnSuccess={false}
                      defaultValues={{ id_colaborador: selectedCollaboratorId }}
                    >
                      <Stack
                        direction={{ base: "column", md: "row" }}
                        gap={{ base: 1, md: 2 }}
                        align={{ base: "stretch", md: "flex-end" }}
                        flexWrap="wrap"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Box w={{ base: "100%", md: "200px" }}>
                          <InputField
                            fieldType="select"
                            label="Colaborador"
                            name="id_colaborador"
                            required
                            disableSelectPortal
                            placeholder={isLoadingEmployees ? "Cargando colaboradores..." : "Seleccione un colaborador"}
                            options={collaboratorOptions}
                            selectRootProps={{
                              disabled: isLoadingEmployees || collaboratorOptions.length === 0,
                            }}
                            rules={{ required: "El campo es obligatorio" }}
                          />
                        </Box>

                        <Box flex="1" minW={{ base: "100%", md: "260px" }}>
                          <FiltrosSolicitudes value={othersFilters} onChange={handleOthersFiltersChange} />
                        </Box>

                        <Box w={{ base: "100%", sm: "100px" }}>
                          <Button appearance="login" type="submit" size="lg" w="100%">
                            Consultar
                          </Button>
                        </Box>
                      </Stack>
                    </Form>

                    <ListaSolicitudes filtros={othersFilters} />
                  </Stack>
                </Tabs.Content>
              )}
            </Tabs.Root>
          </Box>
        </GridItem>

        <GridItem>
          <Box bg="white" borderRadius="xl" boxShadow="md" p={6}>
            <Heading size="sm" mb={4}>
              Registrar nueva solicitud
            </Heading>

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
                <InputField
                  fieldType="select"
                  label="Tipo de hora extra"
                  name="id_tipo_hx"
                  required
                  disableSelectPortal
                  placeholder={tipoHxOptions.length ? "Seleccione una opción" : "Cargando..."}
                  options={tipoHxOptions}
                  rules={{
                    required: "El campo es obligatorio",
                    setValueAs: (value) => String(value ?? "").trim(),
                  }}
                  selectRootProps={{ disabled: tipoHxOptions.length === 0 }}
                />
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
          </Box>
        </GridItem>
      </Grid>
    </Layout>
  );
};
