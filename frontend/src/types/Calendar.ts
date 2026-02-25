export type CalendarEventType =
  | "laboral"
  | "permiso"
  | "vacaciones"
  | "incapacidad"
  | "cumpleanios"
  | "aniversario";

export interface CalendarEvent {
  id: string;
  type: Exclude<CalendarEventType, "laboral">;
  title: string;
  start_date: string;
  end_date: string;
}

export interface CalendarDay {
  date: string;
  is_workday: boolean;
  event_types: Array<Exclude<CalendarEventType, "laboral">>;
  event_labels: string[];
  top_event_type: CalendarEventType | null;
}

export interface CalendarUpcomingEvent {
  id: string;
  type: Exclude<CalendarEventType, "laboral">;
  title: string;
  start_date: string;
  end_date: string;
}

export interface CalendarEventsResponse {
  range: {
    from: string;
    to: string;
    today: string;
  };
  collaborator: {
    id_colaborador: number;
    nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    fecha_nacimiento: string | null;
    fecha_ingreso: string | null;
    dias_laborales: string;
  };
  events: CalendarEvent[];
  days: CalendarDay[];
  upcoming_event: CalendarUpcomingEvent | null;
}
