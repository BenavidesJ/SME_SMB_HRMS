import { Input, type InputProps } from "@chakra-ui/react";
import { useFormContext, type RegisterOptions } from "react-hook-form";

interface MonthFieldVariantProps {
  /** Nombre del campo en React Hook Form. */
  name: string;
  /** Marca el campo como requerido en validación. */
  required?: boolean;
  /** Reglas adicionales para register. */
  rules?: RegisterOptions;
  /** Estado visual de validación. */
  isInvalid: boolean;
  /** Objeto de estilo de foco basado en el estado de validación. */
  focusStyles: { outline: string; outlineColor: string };
  /** Props adicionales enviadas a Chakra Input. */
  restInputProps: InputProps;
}

/**
 * Renderiza un input nativo de mes integrado con react-hook-form.
 */
export function MonthFieldVariant({
  name,
  required,
  rules,
  isInvalid,
  focusStyles,
  restInputProps,
}: MonthFieldVariantProps) {
  const { register } = useFormContext();

  return (
    <Input
      type="month"
      required={required}
      {...restInputProps}
      {...register(name, { required, ...rules })}
      _focusVisible={focusStyles}
      aria-invalid={isInvalid || undefined}
    />
  );
}
