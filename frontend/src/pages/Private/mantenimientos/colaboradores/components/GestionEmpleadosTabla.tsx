import { useMemo } from "react";
import { DataTable } from "../../../../../components/general/table/DataTable";
import type { EmployeeRow } from "../../../../../types";
import type { DataTableColumn, DataTablePagination } from "../../../../../components/general/table/types";
import { Badge, Button as ChakraButton, HStack } from "@chakra-ui/react";
import { FiEdit2, FiEye } from "react-icons/fi";
import { toTitleCase } from "../../../../../utils";
import { useNavigate } from "react-router";

interface GestionEmpleadosTablaProps {
  loading: boolean;
  employees: EmployeeRow[];
  tablePagination?: DataTablePagination;
  page: number;
  // eslint-disable-next-line no-unused-vars
  onEdit?: (_id: number) => void;
}

export const GestionEmpleadosTabla = ({
  employees,
  loading,
  tablePagination,
  page,
  onEdit,
}: GestionEmpleadosTablaProps) => {
  const nav = useNavigate();
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
      {
        id: "estado_civil",
        header: "Estado civil",
        minW: "80px",
        textAlign: "center",
        cell: (r) => toTitleCase(r.estado_civil?.nombre ?? ""),
      },
      {
        id: "telefono",
        header: "Teléfono",
        minW: "80px",
        textAlign: "center",
        cell: (r) => toTitleCase(r.telefono ? String(r.telefono) : ""),
      },
      {
        id: "rol",
        header: "Rol",
        minW: "80px",
        textAlign: "center",
        cell: (r) => {
          const roleName = r.usuario?.rol;
          return roleName ? (
            <HStack gap="2" wrap="wrap">
              <Badge variant="surface">{roleName}</Badge>
            </HStack>
          ) : null;
        },
      },
      {
        id: "estado",
        header: "Estado",
        minW: "80px",
        textAlign: "center",
        cell: (r) => {
          const estado = r.estado?.nombre ?? "";
          if (estado === "ACTIVO") {
            return (
              <Badge backgroundColor="blue.600" color="white">
                {toTitleCase(estado)}
              </Badge>
            );
          }
          if (estado === "INACTIVO") {
            return (
              <Badge backgroundColor="red.600" color="white">
                {toTitleCase(estado)}
              </Badge>
            );
          }
          return null;
        },
      },
    ];
  }, []);

  return (
    <DataTable<EmployeeRow>
      data={loading ? [] : pagedEmployees}
      columns={columns}
      isDataLoading={loading}
      size="md"
      actionColumn={{
        header: "Acciones",
        w: "300px",
        cell: (row) => (
          <HStack gap="2" justifyContent="flex-end" wrap="wrap">
            <ChakraButton
              variant="subtle"
              colorPalette="yellow"
              size="sm"
              onClick={() => onEdit?.(row.id)}
            >
              <FiEdit2 /> Editar
            </ChakraButton>

            <ChakraButton
              variant="subtle"
              colorPalette="blue"
              size="sm"
              onClick={() => nav(`/mantenimientos-consultas/colaboradores/${row.id}`)}
            >
              <FiEye /> Ver detalle
            </ChakraButton>
          </HStack>
        ),
      }}
      pagination={tablePagination}
    />
  );
};
