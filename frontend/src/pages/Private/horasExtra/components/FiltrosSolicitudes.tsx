/* eslint-disable no-unused-vars */
import React from "react";
import { createListCollection, HStack } from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import type { Modo, SolicitudesQuery } from "../../../../types/Overtime";

type Props = {
  value: SolicitudesQuery;
  onChange: (next: SolicitudesQuery) => void;
};

const modoOptions = [
  { label: "Reciente → Antiguo", value: "reciente" },
  { label: "Agrupar por estado", value: "por_estado" },
  { label: "Agrupar por colaborador", value: "por_colaborador" },
] as const;

const estadoOptions = [
  { label: "PENDIENTE", value: "PENDIENTE" },
  { label: "APROBADO", value: "APROBADO" },
  { label: "CANCELADO", value: "CANCELADO" },
  { label: "RECHAZADO", value: "RECHAZADO" },
] as const;

export const FiltrosSolicitudes = ({ value, onChange }: Props) => {
  const modoCollection = React.useMemo(
    () =>
      createListCollection({
        items: modoOptions.map((o) => ({ label: o.label, value: o.value })),
      }),
    []
  );

  const estadoCollection = React.useMemo(
    () =>
      createListCollection({
        items: estadoOptions.map((o) => ({ label: o.label, value: o.value })),
      }),
    []
  );

  return (
    <HStack gap="3">
      <Select.Root
        value={[value.modo]}
        collection={modoCollection}
        onValueChange={(e) => {
          const nextModo = (e.value?.[0] as Modo) ?? "reciente";
          onChange({
            modo: nextModo,
            estado: undefined,
            id_colaborador: undefined,
          });
        }}
        width="260px"
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Modo de consulta" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
            <Select.ClearTrigger />
          </Select.IndicatorGroup>
        </Select.Control>

        <Select.Positioner>
          <Select.Content>
            {modoCollection.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Select.Root>

      {value.modo === "por_estado" && (
        <Select.Root
          value={value.estado ? [value.estado] : []}
          collection={estadoCollection}
          onValueChange={(e) =>
            onChange({
              ...value,
              estado: e.value?.[0],
            })
          }
          width="220px"
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Filtrar estado" />
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
      )}
    </HStack>
  );
};
