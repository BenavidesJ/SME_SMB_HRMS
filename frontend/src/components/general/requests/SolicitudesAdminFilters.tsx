import { HStack, Select, createListCollection } from "@chakra-ui/react";
import { useMemo } from "react";
import { ADMIN_REQUEST_STATUS_ORDER } from "../../../utils/requestStatus";

interface SelectOption {
  label: string;
  value: string;
}

interface SolicitudesAdminFiltersProps {
  estado?: string;
  colaborador?: string;
  // eslint-disable-next-line no-unused-vars
  onEstadoChange: (value?: string) => void;
  // eslint-disable-next-line no-unused-vars
  onColaboradorChange: (value?: string) => void;
  collaboratorOptions: SelectOption[];
}

export function SolicitudesAdminFilters({
  estado,
  colaborador,
  onEstadoChange,
  onColaboradorChange,
  collaboratorOptions,
}: SolicitudesAdminFiltersProps) {
  const estadoCollection = useMemo(
    () =>
      createListCollection({
        items: ADMIN_REQUEST_STATUS_ORDER.map((status) => ({
          label: status.charAt(0) + status.slice(1).toLowerCase(),
          value: status,
        })),
      }),
    [],
  );

  const collaboratorCollection = useMemo(
    () =>
      createListCollection({
        items: collaboratorOptions,
      }),
    [collaboratorOptions],
  );

  return (
    <HStack gap="3" wrap="wrap" align="stretch">
      <Select.Root
        value={estado ? [estado] : []}
        collection={estadoCollection}
        onValueChange={(event) => onEstadoChange(event.value?.[0] || undefined)}
        width={{ base: "100%", md: "240px" }}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Filtrar por estado" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
            <Select.ClearTrigger />
          </Select.IndicatorGroup>
        </Select.Control>
        <Select.Positioner>
          <Select.Content>
            {estadoCollection.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Select.Root>

      <Select.Root
        value={colaborador ? [colaborador] : []}
        collection={collaboratorCollection}
        onValueChange={(event) => onColaboradorChange(event.value?.[0] || undefined)}
        width={{ base: "100%", md: "320px" }}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Filtrar por colaborador" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
            <Select.ClearTrigger />
          </Select.IndicatorGroup>
        </Select.Control>
        <Select.Positioner>
          <Select.Content>
            {collaboratorCollection.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Select.Root>
    </HStack>
  );
}