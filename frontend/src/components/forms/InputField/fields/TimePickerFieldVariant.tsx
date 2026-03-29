import { Input } from "@chakra-ui/react";
import {
  Controller,
  useFormContext,
  type RegisterOptions,
} from "react-hook-form";
import type { InputProps } from "@chakra-ui/react";

interface TimePickerFieldVariantProps {
  name: string;
  required?: boolean;
  rules?: RegisterOptions;
  isInvalid: boolean;
  focusStyles: { outline: string; outlineColor: string };
  restInputProps: InputProps;
}

export function TimePickerFieldVariant({
  name,
  required,
  rules,
  isInvalid,
  focusStyles,
  restInputProps,
}: TimePickerFieldVariantProps) {
  const { control } = useFormContext();
  const isDisabled = Boolean(restInputProps.disabled);

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required, ...rules }}
      render={({ field }) => (
        <Input
          type="time"
          required={required}
          {...restInputProps}
          name={field.name}
          value={field.value ? String(field.value) : ""}
          onChange={(event) => field.onChange(event.currentTarget.value)}
          onBlur={field.onBlur}
          disabled={isDisabled}
          aria-invalid={isInvalid || undefined}
          _focus={focusStyles}
          _focusVisible={focusStyles}
        />
      )}
    />
  );
}
