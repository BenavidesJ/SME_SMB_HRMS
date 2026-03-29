import { useMemo } from "react";
import { DatePicker, HStack, Portal, parseDate } from "@chakra-ui/react";
import type { DateValue } from "@chakra-ui/react";
import {
  Controller,
  useFormContext,
  type RegisterOptions,
} from "react-hook-form";
import type { InputProps } from "@chakra-ui/react";
import { LuCalendar } from "react-icons/lu";

interface DatePickerFieldVariantProps {
  name: string;
  required?: boolean;
  rules?: RegisterOptions;
  isInvalid: boolean;
  focusStyles: { outline: string; outlineColor: string };
  restInputProps: InputProps;
}

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

export function DatePickerFieldVariant({
  name,
  required,
  rules,
  isInvalid,
  focusStyles,
  restInputProps,
}: DatePickerFieldVariantProps) {
  const { control } = useFormContext();

  const minDate = useMemo(() => {
    const v = restInputProps.min as string | undefined;
    return v ? toDateValue(v) : undefined;
  }, [restInputProps.min]);

  const maxDate = useMemo(() => {
    const v = restInputProps.max as string | undefined;
    return v ? toDateValue(v) : undefined;
  }, [restInputProps.max]);

  const isReadOnly = Boolean(restInputProps.readOnly);
  const isDisabled = Boolean(restInputProps.disabled);

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required, ...rules }}
      render={({ field }) => {
        const currentValue = field.value
          ? toDateValue(String(field.value))
          : undefined;
        const pickerValue: DateValue[] = currentValue ? [currentValue] : [];

        return (
          <DatePicker.Root
            locale="es-CR"
            startOfWeek={1}
            value={pickerValue}
            onValueChange={(details) => {
              const selected = details.value[0];
              field.onChange(selected ? toIsoString(selected) : "");
            }}
            min={minDate}
            max={maxDate}
            disabled={isDisabled || isReadOnly}
            name={field.name}
          >
            <DatePicker.Control _focusWithin={focusStyles}>
              <DatePicker.Input
                onBlur={field.onBlur}
                aria-invalid={isInvalid || undefined}
                _focus={focusStyles}
                _focusVisible={focusStyles}
              />
              <DatePicker.IndicatorGroup>
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
      }}
    />
  );
}
