import {
  Button,
  DatePicker,
  Input,
  Portal,
} from "@chakra-ui/react";
import {
  Controller,
  useFormContext,
  type RegisterOptions,
} from "react-hook-form";
import type { InputProps } from "@chakra-ui/react";
import {
  CalendarDateTime,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";
import { LuCalendar } from "react-icons/lu";

interface TimePickerFieldVariantProps {
  name: string;
  required?: boolean;
  rules?: RegisterOptions;
  isInvalid: boolean;
  focusStyles: { outline: string; outlineColor: string };
  restInputProps: InputProps;
}

const formatter = new DateFormatter("es-CR", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const TODAY_YEAR = new Date().getFullYear();
const TODAY_MONTH = new Date().getMonth() + 1;
const TODAY_DAY = new Date().getDate();

function parseHHmm(value: string): { hour: number; minute: number } | null {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function toHHmm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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
      render={({ field }) => {
        const parsed = parseHHmm(String(field.value ?? ""));
        const calDateTime = parsed
          ? new CalendarDateTime(
            TODAY_YEAR,
            TODAY_MONTH,
            TODAY_DAY,
            parsed.hour,
            parsed.minute,
          )
          : null;
        const pickerValue: CalendarDateTime[] = calDateTime
          ? [calDateTime]
          : [];
        const timeInputValue = parsed
          ? toHHmm(parsed.hour, parsed.minute)
          : "";

        const displayText = calDateTime
          ? formatter.format(calDateTime.toDate(getLocalTimeZone()))
          : "Seleccione hora";

        return (
          <DatePicker.Root
            locale="es-CR"
            value={pickerValue}
            onValueChange={(details) => {
              const selected = details.value[0];
              if (!selected || !("hour" in selected)) return;
              const dt = selected as CalendarDateTime;
              field.onChange(toHHmm(dt.hour, dt.minute));
            }}
            closeOnSelect={false}
            disabled={isDisabled}
            name={field.name}
          >
            <DatePicker.Control _focusWithin={focusStyles}>
              <DatePicker.Trigger asChild unstyled>
                <Button
                  variant="outline"
                  width="full"
                  justifyContent="space-between"
                  aria-invalid={isInvalid || undefined}
                  _focusVisible={focusStyles}
                  onBlur={field.onBlur}
                >
                  {displayText}
                  <LuCalendar />
                </Button>
              </DatePicker.Trigger>
            </DatePicker.Control>
            <Portal>
              <DatePicker.Positioner>
                <DatePicker.Content>
                  <DatePicker.View view="day">
                    <Input
                      type="time"
                      value={timeInputValue}
                      onChange={(e) => {
                        const newParsed = parseHHmm(e.currentTarget.value);
                        if (newParsed) {
                          field.onChange(
                            toHHmm(newParsed.hour, newParsed.minute),
                          );
                        }
                      }}
                    />
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
