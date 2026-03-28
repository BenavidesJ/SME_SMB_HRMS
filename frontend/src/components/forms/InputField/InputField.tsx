import { forwardRef } from "react";
import { Badge, Field, type InputProps } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import {
  DatePickerFieldVariant,
  MonthPickerFieldVariant,
  NumberFieldVariant,
  PasswordFieldVariant,
  SelectFieldVariant,
  TextFieldVariant,
  TimePickerFieldVariant,
  YearPickerFieldVariant,
} from "./fields";
import { getFocusStyles } from "./internal/focusStyles";
import type { FieldProps } from "./types";

export type { FieldProps, FieldType, SelectOption } from "./types";

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
    startElement,
    endElement,
    numericOnly = false,
    textOnly = false,
    allowHyphen = false,
    maxDigits,
    currencyMask = false,
    currencyMaxDecimals = 2,

    numberProps,

    options = [],
    selectRootProps,
    clearable = true,
    disableSelectPortal = false,

    ...restInputProps
  } = props;

  const { getFieldState, formState } = useFormContext();

  const { error } = getFieldState(name, formState);
  const errorMessage = (error?.message as string | undefined) ?? undefined;
  const isInvalid = Boolean(errorMessage);

  const focusStyles = getFocusStyles(isInvalid);

  const restInputPropsTyped = restInputProps as InputProps;

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
        <TextFieldVariant
          name={name}
          fieldType={fieldType}
          placeholder={placeholder}
          required={required}
          rules={rules}
          startElement={startElement}
          endElement={endElement}
          numericOnly={numericOnly}
          textOnly={textOnly}
          allowHyphen={allowHyphen}
          maxDigits={maxDigits}
          currencyMask={currencyMask}
          currencyMaxDecimals={currencyMaxDecimals}
          isInvalid={isInvalid}
          focusStyles={focusStyles}
          restInputProps={restInputPropsTyped}
        />
      )}

      {fieldType === "password" && (
        <PasswordFieldVariant
          name={name}
          placeholder={placeholder}
          required={required}
          rules={rules}
          isInvalid={isInvalid}
          focusStyles={focusStyles}
          restInputProps={restInputPropsTyped}
        />
      )}

      {fieldType === "date" && (
        <DatePickerFieldVariant
          name={name}
          required={required}
          rules={rules}
          isInvalid={isInvalid}
          focusStyles={focusStyles}
          restInputProps={restInputPropsTyped}
        />
      )}

      {fieldType === "month" && (
        <MonthPickerFieldVariant
          name={name}
          required={required}
          rules={rules}
          isInvalid={isInvalid}
          focusStyles={focusStyles}
          restInputProps={restInputPropsTyped}
        />
      )}

      {fieldType === "year" && (
        <YearPickerFieldVariant
          name={name}
          required={required}
          rules={rules}
          isInvalid={isInvalid}
          focusStyles={focusStyles}
          restInputProps={restInputPropsTyped}
        />
      )}

      {fieldType === "time" && (
        <TimePickerFieldVariant
          name={name}
          required={required}
          rules={rules}
          isInvalid={isInvalid}
          focusStyles={focusStyles}
          restInputProps={restInputPropsTyped}
        />
      )}

      {fieldType === "select" && (
        <SelectFieldVariant
          name={name}
          placeholder={placeholder}
          required={required}
          rules={rules}
          options={options}
          selectRootProps={selectRootProps}
          clearable={clearable}
          disableSelectPortal={disableSelectPortal}
          focusStyles={focusStyles}
        />
      )}

      {fieldType === "number" && (
        <NumberFieldVariant
          name={name}
          placeholder={placeholder}
          required={required}
          rules={rules}
          isInvalid={isInvalid}
          focusStyles={focusStyles}
          numberProps={numberProps}
        />
      )}

      {errorMessage ? (
        <Field.ErrorText>{errorMessage}</Field.ErrorText>
      ) : (
        <Field.HelperText fontSize="small">{helperText}</Field.HelperText>
      )}
    </Field.Root>
  );
});
