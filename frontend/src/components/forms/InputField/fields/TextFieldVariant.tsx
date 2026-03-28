import React from "react";
import { Input, InputGroup, type InputProps } from "@chakra-ui/react";
import { Controller, useFormContext, type RegisterOptions } from "react-hook-form";
import { applyTextInputFilters } from "../internal/textFilters";
import { getCurrencyMaskedValue } from "../internal/currencyFormat";

interface TextFieldVariantProps {
  /** Nombre del campo en React Hook Form. */
  name: string;
  /** Variante de texto a renderizar. */
  fieldType: "text" | "email";
  /** Placeholder mostrado por el input. */
  placeholder?: string;
  /** Marca el campo como requerido en validación. */
  required?: boolean;
  /** Reglas adicionales para register/controller. */
  rules?: RegisterOptions;
  /** Elemento opcional renderizado al inicio del InputGroup. */
  startElement?: React.ReactNode;
  /** Elemento opcional renderizado al final del InputGroup. */
  endElement?: React.ReactNode;
  /** Permite solo dígitos cuando es true. */
  numericOnly: boolean;
  /** Permite solo texto cuando es true. */
  textOnly: boolean;
  /** Permite guion cuando textOnly es true. */
  allowHyphen: boolean;
  /** Máximo de dígitos usados por numericOnly. */
  maxDigits?: number;
  /** Habilita máscara monetaria cuando es true y fieldType="text". */
  currencyMask: boolean;
  /** Precisión decimal para la máscara monetaria. */
  currencyMaxDecimals: number;
  /** Estado visual de validación. */
  isInvalid: boolean;
  /** Objeto de estilo de foco basado en el estado de validación. */
  focusStyles: { outline: string; outlineColor: string };
  /** Props adicionales enviadas a Chakra Input. */
  restInputProps: InputProps;
}

/**
 * Renderiza inputs de texto/email incluyendo filtros de texto y máscara monetaria opcional.
 */
export function TextFieldVariant({
  name,
  fieldType,
  placeholder,
  required,
  rules,
  startElement,
  endElement,
  numericOnly,
  textOnly,
  allowHyphen,
  maxDigits,
  currencyMask,
  currencyMaxDecimals,
  isInvalid,
  focusStyles,
  restInputProps,
}: TextFieldVariantProps) {
  const { register, control } = useFormContext();

  if (fieldType === "text" && currencyMask) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required, ...rules }}
        defaultValue=""
        render={({ field }) => {
          const value = getCurrencyMaskedValue(
            String(field.value ?? ""),
            currencyMaxDecimals,
          );

          return (
            <InputGroup startElement={startElement} endElement={endElement}>
              <Input
                type="text"
                placeholder={placeholder}
                required={required}
                {...restInputProps}
                name={field.name}
                value={value}
                onChange={(event) => {
                  const maskedValue = getCurrencyMaskedValue(
                    event.target.value,
                    currencyMaxDecimals,
                  );

                  field.onChange(maskedValue);
                }}
                onBlur={field.onBlur}
                inputMode="decimal"
                _focusVisible={focusStyles}
                aria-invalid={isInvalid || undefined}
              />
            </InputGroup>
          );
        }}
      />
    );
  }

  const registeredTextField = register(name, { required, ...rules });

  const onTextFieldChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    event.target.value = applyTextInputFilters(event.target.value, {
      numericOnly,
      textOnly,
      allowHyphen,
      maxDigits,
    });

    registeredTextField.onChange(event);
  };

  return (
    <InputGroup startElement={startElement} endElement={endElement}>
      <Input
        type={fieldType}
        placeholder={placeholder}
        required={required}
        {...restInputProps}
        {...registeredTextField}
        onChange={onTextFieldChange}
        inputMode={numericOnly ? "numeric" : restInputProps.inputMode}
        _focusVisible={focusStyles}
        aria-invalid={isInvalid || undefined}
      />
    </InputGroup>
  );
}
