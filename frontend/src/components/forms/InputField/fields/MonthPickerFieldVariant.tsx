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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

const REFERENCE_YEAR = 2000;

const formatMonth = (date: DateValue) => {
  const month = date.month.toString().padStart(2, "0");
  const year = date.year.toString();
  return `${month}/${year}`;
};

const formatMonthOnly = (date: DateValue) =>
  MONTH_NAMES[date.month - 1] ?? "";

const parseMonth = (value: string) => {
  const match = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, month, year] = match.map(Number);
    return new CalendarDate(year, month, 1);
  }
  return undefined;
};

const parseMonthOnly = (value: string) => {
  const idx = MONTH_NAMES.findIndex(
    (n) => n.toLowerCase() === value.trim().toLowerCase(),
  );
  if (idx !== -1) return new CalendarDate(REFERENCE_YEAR, idx + 1, 1);
  const num = Number(value);
  if (Number.isInteger(num) && num >= 1 && num <= 12)
    return new CalendarDate(REFERENCE_YEAR, num, 1);
  return undefined;
};

function toDateValueFromYYYYMM(value: string): DateValue | undefined {
  if (!value) return undefined;
  try {
    return parseDate(`${value}-01`);
  } catch {
    return undefined;
  }
}

function toDateValueFromMM(value: string): DateValue | undefined {
  if (!value) return undefined;
  const m = Number(value);
  if (!Number.isInteger(m) || m < 1 || m > 12) return undefined;
  return new CalendarDate(REFERENCE_YEAR, m, 1);
}

function toYYYYMM(dateValue: DateValue): string {
  const y = String(dateValue.year).padStart(4, "0");
  const m = String(dateValue.month).padStart(2, "0");
  return `${y}-${m}`;
}

function toMM(dateValue: DateValue): string {
  return String(dateValue.month).padStart(2, "0");
}

/* ------------------------------------------------------------------ */
/*  MonthPickerBase – standalone (no react-hook-form)                  */
/* ------------------------------------------------------------------ */

interface MonthPickerBaseProps {
  value: string;
  // eslint-disable-next-line no-unused-vars
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** When true the picker only selects a month (01-12), no year. */
  monthOnly?: boolean;
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

export function MonthPickerBase({
  value,
  onChange,
  onBlur,
  monthOnly = false,
  placeholder = "mm/yyyy",
  clearable = false,
  disabled = false,
  label,
  min,
  max,
  isInvalid,
  focusStyles,
  name,
}: MonthPickerBaseProps) {
  const currentValue = monthOnly
    ? toDateValueFromMM(value)
    : toDateValueFromYYYYMM(value);
  const pickerValue: DateValue[] = currentValue ? [currentValue] : [];

  return (
    <DatePicker.Root
      locale="es-CR"
      startOfWeek={1}
      format={monthOnly ? formatMonthOnly : formatMonth}
      parse={monthOnly ? parseMonthOnly : parseMonth}
      defaultView="month"
      minView="month"
      placeholder={placeholder}
      value={pickerValue}
      onValueChange={(details) => {
        const selected = details.value[0];
        if (!selected) {
          onChange("");
          return;
        }
        onChange(monthOnly ? toMM(selected) : toYYYYMM(selected));
      }}
      min={min}
      max={max}
      disabled={disabled}
      name={name}
    >
      {label && <DatePicker.Label>{label}</DatePicker.Label>}
      <DatePicker.Control {...(focusStyles ? { _focusWithin: focusStyles } : {})}>
        <DatePicker.Input
          onBlur={onBlur}
          aria-invalid={isInvalid || undefined}
          {...(focusStyles ? { _focusVisible: focusStyles } : {})}
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
            <DatePicker.View view="month">
              {!monthOnly && <DatePicker.Header />}
              <DatePicker.MonthTable />
            </DatePicker.View>
            {!monthOnly && (
              <DatePicker.View view="year">
                <DatePicker.Header />
                <DatePicker.YearTable />
              </DatePicker.View>
            )}
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
}

interface MonthPickerFieldVariantProps {
  name: string;
  required?: boolean;
  rules?: RegisterOptions;
  isInvalid: boolean;
  focusStyles: { outline: string; outlineColor: string };
  restInputProps: InputProps;
}

export function MonthPickerFieldVariant({
  name,
  required,
  rules,
  isInvalid,
  focusStyles,
  restInputProps,
}: MonthPickerFieldVariantProps) {
  const { control } = useFormContext();

  const minDate = useMemo(() => {
    const v = restInputProps.min as string | undefined;
    return v ? toDateValueFromYYYYMM(v) : undefined;
  }, [restInputProps.min]);

  const maxDate = useMemo(() => {
    const v = restInputProps.max as string | undefined;
    return v ? toDateValueFromYYYYMM(v) : undefined;
  }, [restInputProps.max]);

  const isDisabled = Boolean(restInputProps.disabled);

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required, ...rules }}
      render={({ field }) => (
        <MonthPickerBase
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
