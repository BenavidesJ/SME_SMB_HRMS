import { EmptyState, Spinner, Text, VStack } from "@chakra-ui/react";
import { FiFileMinus } from "react-icons/fi";

interface TableEmptyStateProps {
  isLoading: boolean;
}

export const TableEmptyState = ({ isLoading }: TableEmptyStateProps) => {

  if (isLoading) {
    return (<VStack colorPalette="blue">
      <Spinner size="lg" color="colorPalette.600" />
      <Text color="colorPalette.600" fontSize="lg">Cargando datos...</Text>
    </VStack>)
  } else {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiFileMinus />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>No hay elementos disponibles para mostrar</EmptyState.Title>
            <EmptyState.Description>
              Empiece a agregar nuevos registros, recargue la página o contacte a administración.
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }
}
