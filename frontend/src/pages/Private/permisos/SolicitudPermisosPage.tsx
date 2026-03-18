import { Box, Stack, Wrap } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
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
import { addDaysToDateInput, getCostaRicaTodayDate, toTitleCase } from "../../../utils";
import { PermisoSolicitudCard } from "./components/PermisoSolicitudCard";
import type {
  CreatePermisoFormValues,
  PermisoCreateResponse,
  PermisoListItem,
  PermisoPayload,
  PermisoTipo,
} from "./types";

const PERMISO_TIPOS: Array<{ code: PermisoTipo; label: string }> = [
  { code: "GOCE", label: "Permiso con goce salarial" },
  { code: "SIN_GOCE", label: "Permiso sin goce salarial" },
];

const PermisosDateFields = ({ todayInCostaRica }: { todayInCostaRica: string }) => {
  const { watch } = useFormContext<CreatePermisoFormValues>();
  const startDate = watch("fecha_inicio");
  const minEndDate = startDate ? addDaysToDateInput(startDate, 1) : todayInCostaRica;

  return (
    <>
      <InputField
        fieldType="date"
        label="Fecha de inicio"
        name="fecha_inicio"
        required
        min={todayInCostaRica}
        rules={{
          required: "El campo es obligatorio",
          validate: (value) => {
            const selectedDate = String(value ?? "");
            if (!selectedDate) return true;
            return selectedDate >= todayInCostaRica || "La fecha de inicio no puede ser anterior a hoy.";
          },
        }}
      />
      <InputField
        fieldType="date"
        label="Fecha de finalización"
        name="fecha_fin"
        required
        min={minEndDate}
        rules={{
          required: "El campo es obligatorio",
          validate: (value, formValues) => {
            const endDate = String(value ?? "");
            const start = String(formValues?.fecha_inicio ?? "");

            if (!endDate || !start) return true;
            return endDate > start || "La fecha de finalización debe ser posterior a la fecha de inicio.";
          },
        }}
      />
    </>
  );
};

export const SolicitudPermisosPage = () => {
  const { user } = useAuth();
  const userID = user?.id;
  const todayInCostaRica = useMemo(() => getCostaRicaTodayDate(), []);
  const [openModal, setOpenModal] = useState(false);

  const {
    data: permisosResponse = [],
    refetch: refetchMyPermisos,
  } = useApiQuery<PermisoListItem[]>({
    url: `permisos/colaborador/${userID}`,
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

  const defaultApproverId = useMemo(() => approverOptions[0]?.value ?? "", [approverOptions]);
  const formKey = useMemo(() => `permisos-form-${defaultApproverId}`, [defaultApproverId]);

  const tipoPermisoOptions = useMemo(
    () => PERMISO_TIPOS.map((tipo) => ({ label: tipo.label, value: tipo.code })),
    [],
  );

  const { mutate: createPermiso, isLoading: isSubmitting } = useApiMutation<PermisoPayload, PermisoCreateResponse>({
    url: "/permisos",
    method: "POST",
  });

  const handleCreatePermiso = async (formValues: CreatePermisoFormValues) => {
    if (!userID) {
      console.error("No se pudo determinar el colaborador autenticado");
      return false;
    }

    const approverId = Number(formValues.id_aprobador);
    const expectedApproverId = Number(jefeDirectoId);

    if (!Number.isFinite(approverId) || approverId <= 0) {
      showToast("Seleccione un aprobador válido.", "error", "Solicitud de permisos");
      return false;
    }

    if (!Number.isFinite(expectedApproverId) || expectedApproverId <= 0) {
      showToast("No tienes un jefe directo asignado en tu contrato activo.", "error", "Solicitud de permisos");
      return false;
    }

    if (approverId !== expectedApproverId) {
      showToast("El aprobador debe ser tu jefe directo.", "error", "Solicitud de permisos");
      return false;
    }

    const selectedTipo = PERMISO_TIPOS.find((tipo) => tipo.code === formValues.tipo_permiso);
    if (!selectedTipo) {
      showToast("Seleccione un tipo de permiso válido.", "error", "Solicitud de permisos");
      return false;
    }

    const payload: PermisoPayload = {
      id_colaborador: Number(userID),
      id_aprobador: expectedApproverId,
      fecha_inicio: formValues.fecha_inicio,
      fecha_fin: formValues.fecha_fin,
      tipo_permiso: selectedTipo.code,
      ...(formValues.observaciones ? { observaciones: formValues.observaciones } : {}),
    };

    try {
      const result = await createPermiso(payload);

      if (payload.tipo_permiso === "GOCE" && typeof result?.cantidad_dias === "number") {
        showToast(
          `Esta solicitud cubre ${result.cantidad_dias} ${result.cantidad_dias === 1 ? "día" : "días"} laborables.`,
          "info",
          "Cálculo de permisos",
        );
      }

      if (Array.isArray(result?.warnings)) {
        result.warnings.forEach((warning, index) => {
          if (!warning) return;
          showToast(warning, "warning", index === 0 ? "Avisos del periodo" : undefined);
        });
      }

      await refetchMyPermisos();
      setOpenModal(false);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return (
    <Layout pageTitle="Solicitud de Permisos">
      <Stack gap="5" pb="6">
        <Box>
          <Button appearance="login" size="lg" onClick={() => setOpenModal(true)}>
            Crear Solicitud
          </Button>
        </Box>

        <SolicitudesBoard
          columns={PERSONAL_REQUEST_COLUMNS}
          items={permisosResponse}
          getStatus={(item) => item.estadoSolicitudPermisos?.estado ?? item.estado_solicitud}
          getKey={(item) => item.id_solicitud}
          renderItem={(item) => <PermisoSolicitudCard item={item} />}
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
            onSubmit={handleCreatePermiso}
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
              <InputField
                fieldType="select"
                label="Tipo de permiso"
                name="tipo_permiso"
                required
                disableSelectPortal
                placeholder={tipoPermisoOptions.length ? "Seleccione un tipo" : "Cargando..."}
                options={tipoPermisoOptions}
                rules={{ required: "El campo es obligatorio" }}
                selectRootProps={{ disabled: tipoPermisoOptions.length === 0 }}
              />
              <PermisosDateFields todayInCostaRica={todayInCostaRica} />
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
                disabled={!approverOptions.length}
              >
                Registrar permiso
              </Button>
            </Box>
          </Form>
        }
      />
    </Layout>
  );
};