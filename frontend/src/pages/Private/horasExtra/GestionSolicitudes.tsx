
import { useState } from 'react';
import { Layout } from '../../../layouts';
import { ListaSolicitudes } from './components';
import type { SolicitudesQuery } from '../../../types/Overtime';
import { Stack } from '@chakra-ui/react';
import { FiltrosSolicitudes } from './components/FiltrosSolicitudes';

export const GestionSolicitudes = () => {

  const [filters, setFilters] = useState<SolicitudesQuery>({ modo: "reciente" });

  return (
    <Layout pageTitle="Gestión de Solicitudes">
      <Stack gap="5">
        <FiltrosSolicitudes value={filters} onChange={setFilters} />
        <ListaSolicitudes filtros={filters} />
      </Stack>
    </Layout>
  )
}
