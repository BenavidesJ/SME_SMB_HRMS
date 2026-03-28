import {
  NumberInput,
  type NumberInputRootProps,
} from "@chakra-ui/react";
import { Controller, useFormContext, type RegisterOptions } from "react-hook-form";

interface NumberFieldVariantProps {
  /** Nombre del campo en React Hook Form. */
  name: string;
  /** Placeholder mostrado por el input numérico. */
  placeholder?: string;
  /** Marca el campo como requerido en validación. */
  required?: boolean;
  /** Reglas adicionales para controller. */
  rules?: RegisterOptions;
  /** Estado visual de validación. */
  isInvalid: boolean;
  /** Objeto de estilo de foco basado en el estado de validación. */
  focusStyles: { outline: string; outlineColor: string };
  /** Props adicionales enviadas a NumberInput.Root. */
  numberProps?: Omit<
    NumberInputRootProps,
    "name" | "value" | "onValueChange" | "disabled"
  >;
}

/**
 * Renderiza Chakra NumberInput integrado con react-hook-form.
 */
export function NumberFieldVariant({
  name,
  placeholder,
  required,
  rules,
  isInvalid,
  focusStyles,
  numberProps,
}: NumberFieldVariantProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required, ...rules }}
      defaultValue={0}
      render={({ field }) => (
        <NumberInput.Root
          {...numberProps}
          disabled={field.disabled}
          name={field.name}
          value={field.value ?? ""}
          onValueChange={({ value }) => {
            const next = value === "" ? undefined : Number(value);
            field.onChange(Number.isNaN(next as number) ? undefined : next);
          }}
          min={0}
        >
          <NumberInput.Control>
            <NumberInput.IncrementTrigger />
            <NumberInput.DecrementTrigger />
          </NumberInput.Control>

          <NumberInput.Input
            placeholder={placeholder}
            onBlur={field.onBlur}
            _focusVisible={focusStyles}
            aria-invalid={isInvalid || undefined}
          />
        </NumberInput.Root>
      )}
    />
  );
}
