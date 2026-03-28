import { useMemo } from "react";
import {
  Portal,
  Select,
  createListCollection,
  type SelectRootProps,
} from "@chakra-ui/react";
import { Controller, useFormContext, type RegisterOptions } from "react-hook-form";
import type { SelectOption } from "../types";

interface SelectFieldVariantProps {
  /** Nombre del campo en React Hook Form. */
  name: string;
  /** Placeholder mostrado cuando no hay opción seleccionada. */
  placeholder?: string;
  /** Marca el campo como requerido en validación. */
  required?: boolean;
  /** Reglas adicionales para controller. */
  rules?: RegisterOptions;
  /** Opciones renderizadas por el componente select. */
  options: SelectOption[];
  /** Props adicionales enviadas a Select.Root. */
  selectRootProps?: Omit<SelectRootProps, "collection" | "value" | "onValueChange" | "name">;
  /** Muestra el botón para limpiar en el select cuando es true. */
  clearable: boolean;
  /** Renderiza el contenido del select sin Portal cuando es true. */
  disableSelectPortal: boolean;
  /** Objeto de estilo de foco basado en el estado de validación. */
  focusStyles: { outline: string; outlineColor: string };
}

/**
 * Renderiza Chakra Select integrado con react-hook-form, incluyendo modo simple y múltiple.
 */
export function SelectFieldVariant({
  name,
  placeholder,
  required,
  rules,
  options,
  selectRootProps,
  clearable,
  disableSelectPortal,
  focusStyles,
}: SelectFieldVariantProps) {
  const { control } = useFormContext();

  const collection = useMemo(() => {
    return createListCollection({
      items: options.map((option) => ({
        label: option.label,
        value: option.value,
        disabled: option.disabled,
      })),
    });
  }, [options]);

  const positioner = (
    <Select.Positioner>
      <Select.Content>
        {collection.items.map((item) => (
          <Select.Item item={item} key={item.value}>
            {item.label}
            <Select.ItemIndicator />
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Positioner>
  );

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required, ...rules }}
      defaultValue={selectRootProps?.multiple ? [] : ""}
      render={({ field }) => {
        const isMultiple = Boolean(selectRootProps?.multiple);

        const value = isMultiple
          ? Array.isArray(field.value)
            ? field.value.map(String)
            : []
          : field.value
            ? [String(field.value)]
            : [];

        return (
          <Select.Root
            collection={collection}
            value={value}
            onValueChange={(details) => {
              if (isMultiple) {
                field.onChange(details.value ?? []);
              } else {
                const next = details.value?.[0] ?? "";
                field.onChange(next);
              }
            }}
            name={field.name}
            disabled={field.disabled}
            {...selectRootProps}
          >
            <Select.HiddenSelect onBlur={field.onBlur} />

            <Select.Control _focusWithin={focusStyles}>
              <Select.Trigger _focusVisible={focusStyles}>
                <Select.ValueText placeholder={placeholder ?? "Seleccione una opción"} />
              </Select.Trigger>

              <Select.IndicatorGroup>
                <Select.Indicator />
                {clearable && <Select.ClearTrigger />}
              </Select.IndicatorGroup>
            </Select.Control>

            {disableSelectPortal ? positioner : <Portal>{positioner}</Portal>}
          </Select.Root>
        );
      }}
    />
  );
}
