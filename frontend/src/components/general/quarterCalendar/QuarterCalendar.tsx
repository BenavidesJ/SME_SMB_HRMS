import { Box, Grid, HStack, Stack, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useNavigate } from "react-router";
import { Tooltip } from "../../ui/tooltip";
import type { CalendarDay, CalendarEventType } from "../../../types";

const WEEK_HEADERS = ["L", "K", "M", "J", "V", "S", "D"];

type QuarterCalendarProps = {
  days: CalendarDay[];
  baseDate?: string;
  todayDate?: string;
  todayRedirectTo?: string;
};

type Cell = {
  date: string;
  dayOfMonth: number;
  dayData: CalendarDay | null;
};

const toWeekIndex = (dayjsWeekDay: number) => {
  if (dayjsWeekDay === 0) return 6;
  return dayjsWeekDay - 1;
};

const colorByType: Record<Exclude<CalendarEventType, "cumpleanios" | "aniversario"> | "cumpleanios" | "aniversario" | "none", string> = {
  laboral: "brand.blue.25",
  permiso: "yellow.100",
  vacaciones: "brand.green.25",
  incapacidad: "red.100",
  cumpleanios: "purple.100",
  aniversario: "orange.100",
  none: "gray.50",
};

const getMonthLabel = (monthDate: dayjs.Dayjs) => {
  const month = monthDate.locale("es").format("MMMM");
  return month.charAt(0).toUpperCase() + month.slice(1);
};

const buildMonthCells = (monthDate: dayjs.Dayjs, daysMap: Map<string, CalendarDay>): Cell[] => {
  const start = monthDate.startOf("month");
  const totalDays = monthDate.daysInMonth();
  const leading = toWeekIndex(start.day());
  const cells: Cell[] = [];

  for (let i = 0; i < leading; i += 1) {
    cells.push({
      date: `empty-${monthDate.format("YYYY-MM")}-${i}`,
      dayOfMonth: 0,
      dayData: null,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = monthDate.date(day).format("YYYY-MM-DD");
    cells.push({
      date,
      dayOfMonth: day,
      dayData: daysMap.get(date) ?? null,
    });
  }

  return cells;
};

const resolveCellBg = (topType: CalendarEventType | null) => {
  if (!topType) return colorByType.none;
  return colorByType[topType] ?? colorByType.none;
};

const resolveTooltipContent = (dayData: CalendarDay | null) => {
  if (!dayData || dayData.event_labels.length === 0) return "";
  return Array.from(new Set(dayData.event_labels)).join(" · ");
};

const legendItems: Array<{ label: string; color: string }> = [
  { label: "Día laboral", color: colorByType.laboral },
  { label: "Permiso", color: colorByType.permiso },
  { label: "Incapacidad", color: colorByType.incapacidad },
  { label: "Vacaciones", color: colorByType.vacaciones },
  { label: "Cumpleaños", color: colorByType.cumpleanios },
  { label: "Aniversario", color: colorByType.aniversario },
];

const MonthGrid = ({
  monthDate,
  daysMap,
  todayDate,
  onTodayClick,
}: {
  monthDate: dayjs.Dayjs;
  daysMap: Map<string, CalendarDay>;
  todayDate: string;
  onTodayClick: () => void;
}) => {
  const cells = buildMonthCells(monthDate, daysMap);

  return (
    <Stack gap="2" minW="0" flex="1" h="full">
      <Text textAlign="center" fontWeight="semibold" color="brand.blue.100">
        {getMonthLabel(monthDate)}
      </Text>

      <Grid templateColumns="repeat(7, minmax(0, 1fr))" gap="1">
        {WEEK_HEADERS.map((label) => (
          <Box key={`${monthDate.format("YYYY-MM")}-${label}`} textAlign="center">
            <Text fontSize="xs" fontWeight="bold" color="gray.600">
              {label}
            </Text>
          </Box>
        ))}
      </Grid>

      <Grid templateColumns="repeat(7, minmax(0, 1fr))" gap="1" alignContent="start" flex="1">
        {cells.map((cell) => {
          if (cell.dayOfMonth === 0) {
            return <Box key={cell.date} borderRadius="sm" bg="transparent" minH="30px" />;
          }

          const tooltipText = resolveTooltipContent(cell.dayData);
          const hasTooltip = tooltipText.length > 0;
          const isToday = cell.date === todayDate;

          return (
            <Tooltip key={cell.date} content={tooltipText} disabled={!hasTooltip} showArrow>
              <Box
                borderRadius="sm"
                minH="30px"
                px="1"
                py="0.5"
                bg={isToday ? "blue.200" : resolveCellBg(cell.dayData?.top_event_type ?? null)}
                borderWidth="1px"
                borderColor={isToday ? "brand.blue.100" : "gray.200"}
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
                flexDir="column"
                gap="0"
                cursor={isToday ? "pointer" : "default"}
                onClick={isToday ? onTodayClick : undefined}
              >
                <Text
                  fontSize="2xs"
                  fontWeight="medium"
                  lineHeight="1"
                  color={isToday ? "brand.blue.100" : "inherit"}
                >
                  {cell.dayOfMonth}
                </Text>
                {isToday && (
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    lineHeight="1"
                    color="brand.blue.100"
                  >
                    Hoy
                  </Text>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Grid>
    </Stack>
  );
};

export const QuarterCalendar = ({
  days,
  baseDate,
  todayDate,
  todayRedirectTo = "/asistencia/marca",
}: QuarterCalendarProps) => {
  const navigate = useNavigate();
  const daysMap = new Map(days.map((day) => [day.date, day]));
  const reference = baseDate ? dayjs(baseDate) : dayjs();
  const today = todayDate ? dayjs(todayDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
  const center = reference.startOf("month");
  const months = [center.subtract(1, "month"), center, center.add(1, "month")];

  const handleTodayClick = () => {
    navigate(todayRedirectTo);
  };

  return (
    <Box
      w="full"
      h={{ base: "44vh", md: "40vh" }}
      minH="240px"
      p="3"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      overflowX="auto"
      overflowY="hidden"
      bg="white"
    >
      <HStack wrap="wrap" gap="2" mb="3">
        {legendItems.map((item) => (
          <HStack key={item.label} gap="1" align="center">
            <Box w="12px" h="12px" borderRadius="sm" borderWidth="1px" borderColor="gray.300" bg={item.color} />
            <Text fontSize="xs" color="gray.700">
              {item.label}
            </Text>
          </HStack>
        ))}
      </HStack>

      <HStack align="stretch" gap="3" minW="900px" h="full">
        {months.map((monthDate) => (
          <MonthGrid
            key={monthDate.format("YYYY-MM")}
            monthDate={monthDate}
            daysMap={daysMap}
            todayDate={today}
            onTodayClick={handleTodayClick}
          />
        ))}
      </HStack>
    </Box>
  );
};
