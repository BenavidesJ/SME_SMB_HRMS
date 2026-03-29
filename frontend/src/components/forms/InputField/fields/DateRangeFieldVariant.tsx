import { useMemo } from "react";
import { Badge, DatePicker, Field, HStack, Portal, parseDate } from "@chakra-ui/react";
import type { DateValue } from "@chakra-ui/react";
import { useController, useFormContext } from "react-hook-form";
import type { RegisterOptions, Validate, FieldValues } from "react-hook-form";
import { LuCalendar } from "react-icons/lu";
import { getFocusStyles } from "../internal/focusStyles";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toDateValue(iso: string): DateValue | undefined {
  if (!iso) return undefined;
  try {
    return parseDate(iso);
  } catch {
    return undefined;
  }
}

function toIsoString(dateValue: DateValue): string {
  const y = String(dateValue.year).padStart(4, "0");
  const m = String(dateValue.month).padStart(2, "0");
  const d = String(dateValue.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* ------------------------------------------------------------------ */
/*  DateRangePickerBase – standalone (no react-hook-form)              */
/* ------------------------------------------------------------------ */

interface DateRangePickerBaseProps {
  startValue: string;
  endValue: string;
  // eslint-disable-next-line no-unused-vars
  onChange: (start: string, end: string) => void;
  onBlur?: () => void;
  min?: DateValue;
  max?: DateValue;
  disabled?: boolean;
  isInvalid?: boolean;
  focusStyles?: { outline: string; outlineColor: string };
  name?: string;
  label?: string;
  clearable?: boolean;
}

export function DateRangePickerBase({
  startValue,
  endValue,
  onChange,
  onBlur,
  min,
  max,
  disabled = false,
  isInvalid,
  focusStyles,
  name,
  label,
  clearable = false,
}: DateRangePickerBaseProps) {
  const resolvedFocusStyles = focusStyles ?? getFocusStyles(Boolean(isInvalid));

  const start = toDateValue(startValue);
  const end = toDateValue(endValue);
  const pickerValue: DateValue[] = [];
  if (start) pickerValue.push(start);
  if (start && end) pickerValue.push(end);

  return (
    <DatePicker.Root
      locale="es-CR"
      startOfWeek={1}
      selectionMode="range"
      value={pickerValue}
      onValueChange={(details) => {
        const [s, e] = details.value;
        onChange(s ? toIsoString(s) : "", e ? toIsoString(e) : "");
      }}
      min={min}
      max={max}
      disabled={disabled}
      name={name}
    >
      {label && <DatePicker.Label>{label}</DatePicker.Label>}
      <DatePicker.Control>
        <DatePicker.Input
          index={0}
          onBlur={onBlur}
          aria-invalid={isInvalid || undefined}
          _focus={resolvedFocusStyles}
          _focusVisible={resolvedFocusStyles}
        />
        <DatePicker.Input
          index={1}
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
            <DatePicker.View view="day">
              <DatePicker.ViewControl>
                <DatePicker.PrevTrigger />
                <HStack>
                  <DatePicker.MonthSelect />
                  <DatePicker.YearSelect />
                </HStack>
                <DatePicker.NextTrigger />
              </DatePicker.ViewControl>
              <DatePicker.DayTable />
            </DatePicker.View>
            <DatePicker.View view="month">
              <DatePicker.Header />
              <DatePicker.MonthTable />
            </DatePicker.View>
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

/* ------------------------------------------------------------------ */
/*  DateRangeField – form-bound (react-hook-form)                      */
/* ------------------------------------------------------------------ */

interface DateRangeFieldProps {
  startName: string;
  endName: string;
  label?: string;
  required?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  /** When true, end date can equal start date. Default false (end must be strictly after start). */
  allowSameDay?: boolean;
  startRules?: RegisterOptions;
  endRules?: RegisterOptions;
  noIndicator?: boolean;
}

export function DateRangeField({
  startName,
  endName,
  label,
  required = false,
  min,
  max,
  disabled = false,
  allowSameDay = false,
  startRules,
  endRules,
  noIndicator = false,
}: DateRangeFieldProps) {
  const { control, getValues } = useFormContext();

  const endValidators: Record<string, Validate<string, FieldValues>> = {
    afterStart: (value: string) => {
      const sv = String(getValues(startName) ?? "");
      if (!value || !sv) return true;
      if (allowSameDay)
        return value >= sv || "La fecha de fin no puede ser anterior a la fecha de inicio.";
      return value > sv || "La fecha de fin debe ser posterior a la fecha de inicio.";
    },
  };

  if (endRules?.validate) {
    if (typeof endRules.validate === "function") {
      endValidators._custom = endRules.validate;
    } else if (typeof endRules.validate === "object") {
      Object.assign(endValidators, endRules.validate);
    }
  }

  const { field: startField, fieldState: startFieldState } = useController({
    name: startName,
    control,
    rules: {
      required: required ? "La fecha de inicio es obligatoria" : false,
      ...startRules,
    },
  });

  const { field: endField, fieldState: endFieldState } = useController({
    name: endName,
    control,
    rules: {
      required: required ? "La fecha de fin es obligatoria" : false,
      ...(endRules
        ? Object.fromEntries(
          Object.entries(endRules).filter(([k]) => k !== "validate" && k !== "required"),
        )
        : {}),
      validate: endValidators,
    },
  });

  const startError = startFieldState.error;
  const endError = endFieldState.error;
  const errorMessage = (startError?.message ?? endError?.message) as string | undefined;
  const isInvalid = Boolean(errorMessage);
  const focusStyles = getFocusStyles(isInvalid);

  const minDate = useMemo(() => (min ? toDateValue(min) : undefined), [min]);
  const maxDate = useMemo(() => (max ? toDateValue(max) : undefined), [max]);

  return (
    <Field.Root invalid={isInvalid} required={required} minW="200px" minH="90px">
      {label && (
        <Field.Label>
          {label}
          {!noIndicator &&
            (required ? (
              <Field.RequiredIndicator />
            ) : (
              <Field.RequiredIndicator
                fallback={
                  <Badge size="sm" variant="subtle">
                    Opcional
                  </Badge>
                }
              />
            ))}
        </Field.Label>
      )}
      <DateRangePickerBase
        startValue={startField.value ? String(startField.value) : ""}
        endValue={endField.value ? String(endField.value) : ""}
        onChange={(start, end) => {
          startField.onChange(start);
          endField.onChange(end);
        }}
        onBlur={() => {
          startField.onBlur();
          endField.onBlur();
        }}
        min={minDate}
        max={maxDate}
        disabled={disabled}
        isInvalid={isInvalid}
        focusStyles={focusStyles}
      />
      {errorMessage ? (
        <Field.ErrorText>{errorMessage}</Field.ErrorText>
      ) : (
        <Field.HelperText fontSize="small" />
      )}
    </Field.Root>
  );
}
