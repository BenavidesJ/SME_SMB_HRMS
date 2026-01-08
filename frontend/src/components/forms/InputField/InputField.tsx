import React, { forwardRef, useMemo } from "react";
import {
  Badge,
  Field,
  Input,
  NumberInput,
  Select,
  Portal,
  createListCollection,
  type InputProps,
  type NumberInputRootProps,
  type SelectRootProps,
} from "@chakra-ui/react";
import { PasswordInput } from "../../ui/password-input";
import { Controller, useFormContext, type RegisterOptions } from "react-hook-form";

type FieldType = "text" | "password" | "email" | "number" | "select" | "date" | "time";

export type SelectOption = { label: string; value: string; disabled?: boolean };

interface FieldProps extends InputProps {
  fieldType: FieldType;
  label?: string;
  name: string;
  placeholder?: string;
  helperText?: React.ReactNode | string;
  required?: boolean;
  noIndicator?: boolean;
  rules?: RegisterOptions;

  // number
  numberProps?: Omit<NumberInputRootProps, "name" | "value" | "onValueChange" | "disabled">;

  // select
  options?: SelectOption[];
  selectRootProps?: Omit<SelectRootProps, "collection" | "value" | "onValueChange" | "name">;
  clearable?: boolean;
  disableSelectPortal?: boolean;
}


function getFocusStyles(isInvalid: boolean) {
  if (isInvalid) {
    return {
      outline: "2px solid",
      outlineColor: "red.600",
    } as const;
  }

  return {
    outline: "1px solid",
    outlineColor: "brand.blue.100",
  } as const;
}

const TextField = (props: Omit<FieldProps, "fieldType">) => <Input {...props} />;
const PasswordField = (props: Omit<FieldProps, "fieldType">) => <PasswordInput {...props} />;

export const InputField = forwardRef<HTMLDivElement, FieldProps>(function InputField(props, ref) {
  const {
    name,
    fieldType = "text",
    label,
    helperText,
    required,
    placeholder,
    rules,
    noIndicator = false,

    numberProps,

    options = [],
    selectRootProps,
    clearable = true,
    disableSelectPortal = false,

    ...restInputProps
  } = props;

  const { register, control, getFieldState, formState } = useFormContext();

  const { error } = getFieldState(name, formState);
  const errorMessage = (error?.message as string | undefined) ?? undefined;
  const isInvalid = Boolean(errorMessage);

  const focusStyles = getFocusStyles(isInvalid);

  const collection = useMemo(() => {
    return createListCollection({
      items: options.map((o) => ({
        label: o.label,
        value: o.value,
        disabled: o.disabled,
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
    <Field.Root
      minW="200px"
      ref={ref}
      required={required}
      invalid={isInvalid}
      minH="90px"
    >
      <Field.Label>
        {label}
        {!noIndicator && (
          <>
            {required ? (
              <Field.RequiredIndicator />
            ) : (
              <Field.RequiredIndicator
                fallback={
                  <Badge size="sm" variant="subtle">
                    Opcional
                  </Badge>
                }
              />
            )}
          </>
        )}
      </Field.Label>

      {(fieldType === "text" || fieldType === "email") && (
        <TextField
          type={fieldType}
          placeholder={placeholder}
          required={required}
          {...restInputProps}
          {...register(name, { required, ...rules })}
          _focusVisible={focusStyles}
          aria-invalid={isInvalid || undefined}
        />
      )}

      {fieldType === "password" && (
        <PasswordField
          placeholder={placeholder}
          required={required}
          {...restInputProps}
          {...register(name, { required, ...rules })}
          _focusVisible={focusStyles}
          aria-invalid={isInvalid || undefined}
        />
      )}

      {fieldType === "date" && (
        <Input
          type="date"
          required={required}
          {...restInputProps}
          {...register(name, { required, ...rules })}
          _focusVisible={focusStyles}
          aria-invalid={isInvalid || undefined}
        />
      )}

      {fieldType === "time" && (
        <Input
          type="time"
          required={required}
          {...restInputProps}
          {...register(name, { required, ...rules })}
          _focusVisible={focusStyles}
          aria-invalid={isInvalid || undefined}
        />
      )}

      {fieldType === "select" && (
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

                {/* ✅ Para el focus ring: aplica al Control/Trigger */}
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
      )}

      {fieldType === "number" && (
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
      )}

      {errorMessage ? (
        <Field.ErrorText>{errorMessage}</Field.ErrorText>
      ) : (
        <Field.HelperText fontSize="medium">{helperText}</Field.HelperText>
      )}
    </Field.Root>
  );
});
