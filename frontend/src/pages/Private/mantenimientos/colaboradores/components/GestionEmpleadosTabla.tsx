import { useMemo, type Dispatch, type SetStateAction } from "react";
import { DataTable } from "../../../../../components/general/table/DataTable";
import type { EmployeeRow } from "../../../../../types";
import type { DataTableColumn, DataTablePagination } from "../../../../../components/general/table/types";
import { Badge, Button as ChakraButton, HStack } from "@chakra-ui/react";
import { toTitleCase } from "../../../../../utils";
import { useNavigate } from "react-router";

interface GestionEmpleadosTablaProps {
  loading: boolean;
  employees: EmployeeRow[];
  selection: string[];
  tablePagination?: DataTablePagination;
  page: number;
  setSelection: Dispatch<SetStateAction<string[]>>;
  edit?: () => void;
}

export const GestionEmpleadosTabla = ({
  employees,
  loading,
  selection,
  tablePagination,
  page,
  setSelection,
  edit,
}: GestionEmpleadosTablaProps) => {
  const nav = useNavigate();
  const pageSize = 10;

  console.log(selection)

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
        cell: (r) => (
          <HStack gap="2" wrap="wrap">
            {(r.usuario?.roles ?? []).map((role) => (
              <Badge key={role} variant="surface">
                {role}
              </Badge>
            ))}
          </HStack>
        ),
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
      selection={{
        enabled: true,
        selectedKeys: selection,
        onChange: setSelection,
        getRowKey: (r) => String(r.id),
      }}
      actionBar={{
        enabled: true,
        renderActions: () => (
          <>
            <ChakraButton
              variant="solid"
              colorPalette="red"
              size="sm"
              onClick={() => console.log("Eliminar", selection)}
            >
              Desactivar
            </ChakraButton>

            <ChakraButton
              variant="solid"
              colorPalette="yellow"
              size="sm"
              disabled={selection.length !== 1}
              onClick={() => edit?.()}
            >
              Editar
            </ChakraButton>

            <ChakraButton
              variant="solid"
              colorPalette="teal"
              size="sm"
              disabled={selection.length !== 1}
              onClick={() => nav(`/mantenimientos-consultas/colaboradores/${selection[0]}`)}
            >
              Administrar Vínculo Laboral
            </ChakraButton>
          </>
        ),
      }}
      pagination={tablePagination}
    />
  );
};
