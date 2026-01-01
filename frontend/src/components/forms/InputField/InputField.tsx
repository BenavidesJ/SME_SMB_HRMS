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

type FieldType = "text" | "password" | "email" | "number" | "select" | "date";

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
  numberProps?: Omit<
    NumberInputRootProps,
    "name" | "value" | "onValueChange" | "disabled"
  >;

  // select 
  options?: SelectOption[];
  selectRootProps?: Omit<SelectRootProps, "collection" | "value" | "onValueChange" | "name">;
  clearable?: boolean;
}

const TextField = (props: Omit<FieldProps, "fieldType">) => <Input {...props} />;
const PasswordField = (props: Omit<FieldProps, "fieldType">) => <PasswordInput {...props} />;

export const InputField = forwardRef<HTMLDivElement, FieldProps>(function InputField(
  props,
  ref,
) {
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

    ...restInputProps
  } = props;

  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;
  const isInvalid = Boolean(error);
  const focusOutline = { outlineColor: !isInvalid ? "blue.600" : "red.600" };

  const collection = useMemo(() => {
    return createListCollection({
      items: options.map((o) => ({
        label: o.label,
        value: o.value,
        disabled: o.disabled,
      })),
    });
  }, [options]);

  return (
    <Field.Root minW="200px" ref={ref} required={required} invalid={isInvalid} minH="90px">
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
          _focus={focusOutline}
        />
      )}


      {fieldType === "password" && (
        <PasswordField
          placeholder={placeholder}
          required={required}
          {...restInputProps}
          {...register(name, { required, ...rules })}
          _focus={focusOutline}
        />
      )}

      {fieldType === "date" && (
        <Input
          type="date"
          required={required}
          {...restInputProps}
          {...register(name, { required, ...rules })}
          _focus={focusOutline}
        />
      )}

      {fieldType === "select" && (
        <Controller
          name={name}
          control={control}
          rules={{ required, ...rules }}
          render={({ field }) => (
            <Select.Root
              collection={collection}
              value={field.value ? [String(field.value)] : []}
              onValueChange={(details) => {
                const next = details.value?.[0] ?? "";
                field.onChange(next);
              }}
              name={field.name}
              disabled={field.disabled}
              {...selectRootProps}
              _focusVisible={{ outline: !isInvalid ? "blue.600" : "red.600" }}
            >
              <Select.HiddenSelect onBlur={field.onBlur} />

              <Select.Control >
                <Select.Trigger >
                  <Select.ValueText placeholder={placeholder ?? "Seleccione una opción"} />
                </Select.Trigger>

                <Select.IndicatorGroup>
                  <Select.Indicator />
                  {clearable && <Select.ClearTrigger />}
                </Select.IndicatorGroup>
              </Select.Control>

              <Portal>
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
              </Portal>
            </Select.Root>
          )}
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
                const next =
                  value === "" ? undefined : Number(value);

                field.onChange(Number.isNaN(next as number) ? undefined : next);
              }}
              min={0}
            >
              <NumberInput.Control>
                <NumberInput.IncrementTrigger />
                <NumberInput.DecrementTrigger />
              </NumberInput.Control>
              <NumberInput.Input placeholder={placeholder} onBlur={field.onBlur} _focusVisible={{ borderColor: !isInvalid ? "blue.600" : "red.600" }} />
            </NumberInput.Root>
          )}
        />
      )}

      {error ? (
        <Field.ErrorText>{error}</Field.ErrorText>
      ) : (
        <Field.HelperText fontSize="medium">{helperText}</Field.HelperText>
      )}
    </Field.Root>
  );
});
