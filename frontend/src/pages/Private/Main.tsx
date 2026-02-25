import { Alert, Link, Stack, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { LuPercent } from "react-icons/lu";
import { QuarterCalendar } from "../../components/general";
import { Layout } from "../../components/layout"
import { useAuth } from "../../context/AuthContext";
import { useApiQuery } from "../../hooks/useApiQuery";
import { buildCalendarEventsUrl } from "../../services/api";
import type { CalendarEventsResponse } from "../../types";


const formatDateLabel = (date: string) => {
  const parsed = dayjs(date);
  if (!parsed.isValid()) return date;
  const formatted = parsed.locale("es").format("DD [de] MMMM [de] YYYY");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const getEventLink = (eventType?: string | null) => {
  switch (eventType) {
    case "vacaciones":
      return "/vacaciones/solicitud";
    case "permiso":
      return "/permisos/solicitud";
    case "incapacidad":
      return "/incapacidades";
    default:
      return "/";
  }
};



const Main = () => {
  const { user } = useAuth();

  const center = dayjs().startOf("month");
  const from = center.subtract(1, "month").startOf("month").format("YYYY-MM-DD");
  const to = center.add(1, "month").endOf("month").format("YYYY-MM-DD");

  const { data } = useApiQuery<CalendarEventsResponse>({
    url: buildCalendarEventsUrl({ from, to }),
    enabled: Boolean(user?.id),
  });

  const upcoming = data?.upcoming_event ?? null;

  return (
    <Layout pageTitle={`Bienvenido de vuelta ${user?.nombre}`}>
      <Stack gap="4">
        <Text fontWeight="medium">Sistema de Gestión de Recursos Humanos de BioAlquimia</Text>

        <QuarterCalendar days={data?.days ?? []} baseDate={data?.range?.today} todayDate={data?.range?.today} />

        <Alert.Root title="Eventos próximos" status="success">
          <Alert.Indicator>
            <LuPercent />
          </Alert.Indicator>
          <Alert.Content color="fg">
            <Alert.Title>Eventos próximos</Alert.Title>
            <Alert.Description>
              {upcoming
                ? `Eventos próximos: ${upcoming.title} desde ${formatDateLabel(upcoming.start_date)} hasta ${formatDateLabel(upcoming.end_date)}.`
                : "No hay eventos próximos en el rango actual."}
            </Alert.Description>
          </Alert.Content>
          <Link alignSelf="center" fontWeight="medium" href={getEventLink(upcoming?.type ?? null)}>
            Ir al módulo
          </Link>
        </Alert.Root>
      </Stack>
    </Layout>
  )
}

export default Main