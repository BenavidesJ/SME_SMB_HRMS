import { useMemo, useState } from "react";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { Layout } from "../../../layouts";
import { Button as ChakraButton } from "@chakra-ui/react";
import type { EmployeeRow } from "../../../types";
import type { DataTableColumn } from "../../../components/general/table/types";
import { DataTable } from "../../../components/general/table/DataTable";
import { useNavigate } from "react-router";

export const GestionarAsistencias = () => {
  const nav = useNavigate();
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<string[]>([]);
  const { data: employees = [], isLoading: employeesLoading } = useApiQuery<EmployeeRow[]>({ url: "/empleados" });
  const pageSize = 10;
  const pagedEmployees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return employees.slice(start, start + pageSize);
  }, [employees, page]);
  const columns = useMemo<DataTableColumn<EmployeeRow>[]>(() => {
    return [
      {
        id: "nombre",
        header: "Nombre",
        minW: "80px",
        textAlign: "center",
        cell: (r) => `${r.nombre} ${r.primer_apellido} ${r.segundo_apellido}`,
      },
      {
        id: "identificacion",
        header: "Identificación",
        minW: "80px",
        textAlign: "center",
        cell: (r) => String(r.identificacion),
      },
      {
        id: "correo",
        header: "Correo",
        minW: "220px",
        textAlign: "center",
        cell: (r) => r.correo_electronico,
      },
    ];
  }, []);
  return (
    <Layout pageTitle='Gestión de Marcas de Asistencia de los Empleados'>
      <DataTable<EmployeeRow>
        data={employeesLoading ? [] : pagedEmployees}
        columns={columns}
        isDataLoading={employeesLoading}
        size="md"
        selection={{
          enabled: true,
          selectedKeys: selection,
          onChange: setSelection,
          getRowKey: (r) => String(r.identificacion),
        }}
        actionBar={{
          enabled: true,
          renderActions: () => (
            <>
              <ChakraButton
                variant="solid"
                colorPalette="green"
                size="sm"
                onClick={() => nav(`colaborador/${selection}`)}
              >
                Ver marcas
              </ChakraButton>
            </>
          ),
        }}
        pagination={{
          enabled: true,
          page,
          pageSize,
          totalCount: employees.length,
          onPageChange: setPage,
        }}
      />
    </Layout>
  )
}
