import { type InputProps } from "@chakra-ui/react";
import { useFormContext, type RegisterOptions } from "react-hook-form";
import { PasswordInput } from "../../../ui/password-input";

interface PasswordFieldVariantProps {
  /** Nombre del campo en React Hook Form. */
  name: string;
  /** Placeholder mostrado por el input de contraseña. */
  placeholder?: string;
  /** Marca el campo como requerido en validación. */
  required?: boolean;
  /** Reglas adicionales para register. */
  rules?: RegisterOptions;
  /** Estado visual de validación. */
  isInvalid: boolean;
  /** Objeto de estilo de foco basado en el estado de validación. */
  focusStyles: { outline: string; outlineColor: string };
  /** Props adicionales enviadas a PasswordInput. */
  restInputProps: InputProps;
}

/**
 * Renderiza el input de contraseña preservando el comportamiento original de register.
 */
export function PasswordFieldVariant({
  name,
  placeholder,
  required,
  rules,
  isInvalid,
  focusStyles,
  restInputProps,
}: PasswordFieldVariantProps) {
  const { register } = useFormContext();

  return (
    <PasswordInput
      placeholder={placeholder}
      required={required}
      {...restInputProps}
      {...register(name, { required, ...rules })}
      _focusVisible={focusStyles}
      aria-invalid={isInvalid || undefined}
    />
  );
}
