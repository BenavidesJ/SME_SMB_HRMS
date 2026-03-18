
import { useMemo, useState } from 'react';
import { Layout } from "../../../components/layout";
import { ListaSolicitudes } from './components';
import { Stack } from '@chakra-ui/react';
import { SolicitudesAdminFilters } from '../../../components/general/requests/SolicitudesAdminFilters';
import { useApiQuery } from '../../../hooks/useApiQuery';
import type { EmployeeRow } from '../../../types';
import { toTitleCase } from '../../../utils';

export const GestionSolicitudes = () => {
  const [estado, setEstado] = useState<string | undefined>(undefined);
  const [colaborador, setColaborador] = useState<string | undefined>(undefined);
  const { data: employees = [] } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const collaboratorOptions = useMemo(
    () =>
      (employees ?? []).map((employee) => {
        const baseName = [employee.nombre, employee.primer_apellido, employee.segundo_apellido]
          .filter(Boolean)
          .join(" ")
          .trim();
        return {
          label: baseName ? toTitleCase(baseName) : `Colaborador ${employee.id}`,
          value: String(employee.id),
        };
      }),
    [employees],
  );

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
