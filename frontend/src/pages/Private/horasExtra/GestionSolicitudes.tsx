
import { useEffect, useMemo, useState } from 'react';
import { Layout } from "../../../components/layout";
import { ListaSolicitudes } from './components';
import { Stack } from '@chakra-ui/react';
import { SolicitudesAdminFilters } from '../../../components/general/requests/SolicitudesAdminFilters';
import { useApiQuery } from '../../../hooks/useApiQuery';
import type { DataConsultaSolicitudes } from '../../../types/Overtime';
import { toTitleCase } from '../../../utils';

export const GestionSolicitudes = () => {
  const [estado, setEstado] = useState<string | undefined>(undefined);
  const [colaborador, setColaborador] = useState<string | undefined>(undefined);
  const optionsQueryUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (estado) {
      params.set("estado", estado);
    }

    const qs = params.toString();
    return `/horas-extra/solicitudes${qs ? `?${qs}` : ""}`;
  }, [estado]);

  const { data: optionsResponse } = useApiQuery<DataConsultaSolicitudes>({
    url: optionsQueryUrl,
  });

  const optionItems = useMemo(() => {
    if (!optionsResponse) return [];
    return "grupos" in optionsResponse
      ? optionsResponse.grupos.flatMap((group) => group.items)
      : optionsResponse.items ?? [];
  }, [optionsResponse]);

  const collaboratorOptions = useMemo(
    () => {
      const uniqueOptions = new Map<string, string>();

      for (const item of optionItems) {
        const collaboratorId = Number(item.colaborador?.id ?? 0);
        if (!Number.isInteger(collaboratorId) || collaboratorId <= 0) continue;

        if (uniqueOptions.has(String(collaboratorId))) continue;

        const fullName = String(item.colaborador?.nombre_completo ?? "").trim();
        uniqueOptions.set(
          String(collaboratorId),
          fullName ? toTitleCase(fullName) : `Colaborador ${collaboratorId}`,
        );
      }

      return Array.from(uniqueOptions.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    [optionItems],
  );

  useEffect(() => {
    if (!colaborador) return;
    if (!collaboratorOptions.some((option) => option.value === colaborador)) {
      setColaborador(undefined);
    }
  }, [colaborador, collaboratorOptions]);

  return (
    <Layout pageTitle="Gestión de Solicitudes">
      <Stack gap="5" minH={{ base: "auto", lg: "calc(100vh - 13rem)" }} pb="6">
        <SolicitudesAdminFilters
          estado={estado}
          colaborador={colaborador}
          onEstadoChange={setEstado}
          onColaboradorChange={setColaborador}
          collaboratorOptions={collaboratorOptions}
        />
        <ListaSolicitudes
          estado={estado}
          idColaborador={colaborador ? Number(colaborador) : undefined}
        />
      </Stack>
    </Layout>
  );
};
