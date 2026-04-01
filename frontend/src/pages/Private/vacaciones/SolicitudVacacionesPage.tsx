import { Alert, Box, Stack, Wrap } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { Form, InputField } from "../../../components/forms";
import { Modal } from "../../../components/general";
import { Button } from "../../../components/general/button/Button";
import { SolicitudesBoard } from "../../../components/general/requests/SolicitudesBoard";
import { Layout } from "../../../components/layout";
import { useAuth } from "../../../context/AuthContext";
import { useApiMutation } from "../../../hooks/useApiMutations";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { showToast } from "../../../services/toast/toastService";
import type { Contrato, EmployeeRow } from "../../../types";
import { PERSONAL_REQUEST_COLUMNS } from "../../../utils/requestStatus";
import { getCostaRicaTodayDate, toTitleCase } from "../../../utils";
import { VacacionSolicitudCard } from "./components/VacacionSolicitudCard";
import type {
  CreateVacacionFormValues,
  VacacionCreateResponse,
  VacacionListItem,
  VacacionPayload,
  VacacionSaldoData,
} from "./types";
import { DateRangeField } from "../../../components/forms/InputField/fields";



export const SolicitudVacacionesPage = () => {
  const { user } = useAuth();
  const userID = user?.id;
  const todayInCostaRica = useMemo(() => getCostaRicaTodayDate(), []);
  const [openModal, setOpenModal] = useState(false);

  const {
    data: vacacionesResponse = [],
    isLoading: isLoadingVacaciones,
    refetch: refetchMyVacaciones,
  } = useApiQuery<VacacionListItem[]>({
    url: `vacaciones/colaborador/${userID}`,
    enabled: Boolean(userID),
  });

  const {
    data: saldoVacaciones,
    isLoading: isLoadingSaldoVacaciones,
  } = useApiQuery<VacacionSaldoData>({
    url: userID ? `vacaciones/saldo/${userID}` : "",
    enabled: Boolean(userID),
  });

  const { data: employees = [], isLoading: isLoadingEmployees } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });
  const { data: myContracts = [] } = useApiQuery<Contrato[]>({
    url: userID ? `empleados/${userID}/contratos` : "",
    enabled: Boolean(userID),
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

  const availableBalance = useMemo(() => {
    if (!userID || isLoadingSaldoVacaciones) return null;
    return Number(saldoVacaciones?.dias_disponibles ?? 0);
  }, [userID, isLoadingSaldoVacaciones, saldoVacaciones]);

  const hasNoBalance = availableBalance !== null && availableBalance <= 0;

  const defaultApproverId = useMemo(() => approverOptions[0]?.value ?? "", [approverOptions]);
  const formKey = useMemo(() => `vacaciones-form-${defaultApproverId}`, [defaultApproverId]);

  const { mutate: createVacacion, isLoading: isSubmitting } = useApiMutation<VacacionPayload, VacacionCreateResponse>({
    url: "/vacaciones",
    method: "POST",
  });

  const handleCreateVacacion = async (formValues: CreateVacacionFormValues) => {
    if (!userID) {
      console.error("No se pudo determinar el colaborador autenticado");
      return false;
    }

    const approverId = Number(formValues.id_aprobador);
    const expectedApproverId = Number(jefeDirectoId);

    if (!Number.isFinite(approverId) || approverId <= 0) {
      showToast("Seleccione un aprobador válido.", "error", "Solicitud de vacaciones");
      return false;
    }

    if (!Number.isFinite(expectedApproverId) || expectedApproverId <= 0) {
      showToast("No tienes un jefe directo asignado en tu contrato activo.", "error", "Solicitud de vacaciones");
      return false;
    }

    if (approverId !== expectedApproverId) {
      showToast("El aprobador debe ser tu jefe directo.", "error", "Solicitud de vacaciones");
      return false;
    }

    const payload: VacacionPayload = {
      id_colaborador: Number(userID),
      id_aprobador: expectedApproverId,
      fecha_inicio: formValues.fecha_inicio,
      fecha_fin: formValues.fecha_fin,
      observaciones: formValues.observaciones,
    };

    try {
      const result = await createVacacion(payload);

      if (result?.meta_engine?.chargeableDays !== undefined) {
        showToast(
          `Esta solicitud descuenta ${result.meta_engine.chargeableDays} ${result.meta_engine.chargeableDays === 1 ? "día" : "días"} del saldo.`,
          "info",
          "Cálculo de vacaciones",
        );
      }

      if (Array.isArray(result?.warnings)) {
        result.warnings.forEach((warning, index) => {
          if (!warning) return;
          showToast(warning, "warning", index === 0 ? "Avisos del periodo" : undefined);
        });
      }

      await refetchMyVacaciones();
      setOpenModal(false);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return (
    <Layout pageTitle="Solicitud de Vacaciones">
      <Stack gap="5" pb="6">
        <Box>
          <Button appearance="login" size="lg" onClick={() => setOpenModal(true)}>
            Crear Solicitud
          </Button>
        </Box>

        {Boolean(userID) && !isLoadingSaldoVacaciones && (
          hasNoBalance ? (
            <Alert.Root status="warning">
              <Alert.Indicator />
              <Alert.Title>En este momento no tienes saldo de vacaciones.</Alert.Title>
            </Alert.Root>
          ) : (
            <Alert.Root status="success">
              <Alert.Indicator />
              <Alert.Title>
                {availableBalance !== null && availableBalance > 0
                  && `Tienes saldo de ${availableBalance} ${availableBalance === 1 ? "día disponible" : "días disponibles"}.`}
              </Alert.Title>
            </Alert.Root>
          )
        )}

        <SolicitudesBoard
          columns={PERSONAL_REQUEST_COLUMNS}
          items={vacacionesResponse}
          isLoading={isLoadingVacaciones}
          getStatus={(item) => item.estadoSolicitudVacaciones?.estado}
          getKey={(item) => item.id_solicitud_vacaciones}
          renderItem={(item) => <VacacionSolicitudCard item={item} />}
        />
      </Stack>

      <Modal
        title="Crear Solicitud"
        isOpen={openModal}
        onOpenChange={(event) => setOpenModal(event.open)}
        size="lg"
        content={
          <Form
            key={formKey}
            onSubmit={handleCreateVacacion}
            resetOnSuccess
            defaultValues={{ id_aprobador: defaultApproverId }}
          >
            <Wrap maxW="600px">
              <InputField
                fieldType="select"
                label="Aprobador"
                name="id_aprobador"
                required
                disableSelectPortal
                placeholder={isLoadingEmployees ? "Cargando jefe directo..." : "Jefe directo no disponible"}
                options={approverOptions}
                selectRootProps={{ disabled: true }}
                rules={{ required: "El campo es obligatorio" }}
              />
              <DateRangeField
                startName="fecha_inicio"
                endName="fecha_fin"
                label="Período de vacaciones"
                required
                min={todayInCostaRica}
                startRules={{
                  validate: (value: string) => {
                    if (!value) return true;
                    return value >= todayInCostaRica || "La fecha de inicio no puede ser anterior a hoy.";
                  },
                }}
              />
              <InputField
                fieldType="text"
                label="Observaciones"
                name="observaciones"
                placeholder="Detalle adicional (opcional)"
                rules={{
                  setValueAs: (v) => (typeof v === "string" ? v.trim() || undefined : undefined),
                }}
                required={false}
              />
            </Wrap>

            <Box w={{ base: "100%", sm: "250px" }} mt={4}>
              <Button
                loading={isSubmitting}
                loadingText="Enviando"
                appearance="login"
                type="submit"
                size="lg"
                w="100%"
                disabled={!approverOptions.length || isLoadingSaldoVacaciones || hasNoBalance}
              >
                Registrar vacaciones
              </Button>
            </Box>
          </Form>
        }
      />
    </Layout>
  );
};