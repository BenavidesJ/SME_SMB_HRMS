import { useMemo } from "react";
import { DatePicker, Portal, parseDate } from "@chakra-ui/react";
import type { DateValue } from "@chakra-ui/react";
import {
  Controller,
  useFormContext,
  type RegisterOptions,
} from "react-hook-form";
import type { InputProps } from "@chakra-ui/react";
import { CalendarDate } from "@internationalized/date";
import { LuCalendar } from "react-icons/lu";
import { getFocusStyles } from "../internal/focusStyles";

const formatYear = (date: DateValue) => date.year.toString();

const parseYear = (value: string) => {
  const year = Number(value);
  if (Number.isInteger(year) && year >= 1900 && year <= 2100) {
    return new CalendarDate(year, 1, 1);
  }
  return undefined;
};

function toDateValueFromYYYY(value: string): DateValue | undefined {
  if (!value) return undefined;
  try {
    return parseDate(`${value}-01-01`);
  } catch {
    return undefined;
  }
}

function toYYYY(dateValue: DateValue): string {
  return String(dateValue.year);
}

interface YearPickerBaseProps {
  value: string;
  // eslint-disable-next-line no-unused-vars
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  label?: string;
  min?: DateValue;
  max?: DateValue;
  isInvalid?: boolean;
  focusStyles?: { outline: string; outlineColor: string };
  name?: string;
}

export function YearPickerBase({
  value,
  onChange,
  onBlur,
  placeholder = "yyyy",
  clearable = false,
  disabled = false,
  label,
  min,
  max,
  isInvalid,
  focusStyles,
  name,
}: YearPickerBaseProps) {
  const resolvedFocusStyles = focusStyles ?? getFocusStyles(Boolean(isInvalid));

  const currentValue = toDateValueFromYYYY(value);
  const pickerValue: DateValue[] = currentValue ? [currentValue] : [];

  return (
    <DatePicker.Root
      locale="es-CR"
      format={formatYear}
      parse={parseYear}
      defaultView="year"
      minView="year"
      placeholder={placeholder}
      value={pickerValue}
      onValueChange={(details) => {
        const selected = details.value[0];
        onChange(selected ? toYYYY(selected) : "");
      }}
      min={min}
      max={max}
      disabled={disabled}
      name={name}
    >
      {label && <DatePicker.Label>{label}</DatePicker.Label>}
      <DatePicker.Control _focusWithin={resolvedFocusStyles}>
        <DatePicker.Input
          onBlur={onBlur}
          aria-invalid={isInvalid || undefined}
          _focus={resolvedFocusStyles}
          _focusVisible={resolvedFocusStyles}
        />
        <DatePicker.IndicatorGroup>
          {clearable && <DatePicker.ClearTrigger />}
          <DatePicker.Trigger>
            <LuCalendar />
          </DatePicker.Trigger>
        </DatePicker.IndicatorGroup>
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content>
            <DatePicker.View view="year">
              <DatePicker.Header />
              <DatePicker.YearTable />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
}

interface YearPickerFieldVariantProps {
  name: string;
  required?: boolean;
  rules?: RegisterOptions;
  isInvalid: boolean;
  focusStyles: { outline: string; outlineColor: string };
  restInputProps: InputProps;
}

export function YearPickerFieldVariant({
  name,
  required,
  rules,
  isInvalid,
  focusStyles,
  restInputProps,
}: YearPickerFieldVariantProps) {
  const { control } = useFormContext();

  const minDate = useMemo(() => {
    const v = restInputProps.min as string | undefined;
    return v ? toDateValueFromYYYY(v) : undefined;
  }, [restInputProps.min]);

  const maxDate = useMemo(() => {
    const v = restInputProps.max as string | undefined;
    return v ? toDateValueFromYYYY(v) : undefined;
  }, [restInputProps.max]);

  const isDisabled = Boolean(restInputProps.disabled);

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required, ...rules }}
      render={({ field }) => (
        <YearPickerBase
          value={field.value ? String(field.value) : ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          isInvalid={isInvalid}
          focusStyles={focusStyles}
          min={minDate}
          max={maxDate}
          disabled={isDisabled}
        />
      )}
    />
  );
}
