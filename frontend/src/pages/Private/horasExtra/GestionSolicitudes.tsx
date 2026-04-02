
import { useCallback, useMemo, useState } from 'react';
import { Layout } from "../../../components/layout";
import { ListaSolicitudes } from './components';
import { Stack } from '@chakra-ui/react';
import { SolicitudesAdminFilters } from '../../../components/general/requests/SolicitudesAdminFilters';
import { useApiQuery } from '../../../hooks/useApiQuery';
import type { EmployeeRow, EmployeeUserInfo } from '../../../types';
import { toTitleCase } from '../../../utils';

export const GestionSolicitudes = () => {
  const [estado, setEstado] = useState<string | undefined>(undefined);
  const [colaborador, setColaborador] = useState<string | undefined>(undefined);
  const { data: employees = [] } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });

  const isUsuarioActivo = useCallback((usuario?: EmployeeUserInfo | null) => {
    if (!usuario) return false;
    if (typeof usuario.estado === "string") return usuario.estado.toUpperCase() === "ACTIVO";
    if (typeof usuario.estado === "number") return usuario.estado === 1;
    return Boolean(usuario.estado);
  }, []);

  const colaboradoresActivos = useMemo(
    () =>
      (employees ?? []).filter((employee) => {
        const estadoNombre = (employee.estado?.nombre ?? "").toUpperCase();
        return estadoNombre === "ACTIVO" && isUsuarioActivo(employee.usuario);
      }),
    [employees, isUsuarioActivo],
  );

  const collaboratorOptions = useMemo(
    () =>
      colaboradoresActivos.map((employee) => {
        const baseName = [employee.nombre, employee.primer_apellido, employee.segundo_apellido]
          .filter(Boolean)
          .join(" ")
          .trim();
        return {
          label: baseName ? toTitleCase(baseName) : `Colaborador ${employee.id}`,
          value: String(employee.id),
        };
      }),
    [colaboradoresActivos],
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
