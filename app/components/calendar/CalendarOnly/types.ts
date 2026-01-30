// app/components/calendar/CalendarOnly/types.ts

export type CalendarAppt = {
  id: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  serviceName?: string | null;
  serviceColor?: string | null;
  employeeName?: string | null;
  resourceName?: string | null;

  // 👇 añadidos para SchedulerCalendar
  status?: string | null;
  serviceId?: string | null;
  customerName?: string | null;
};

// Alias para compatibilidad
export type Appointment = CalendarAppt;

export type View = "day" | "threeDays" | "workingWeek" | "week" | "month";


export type HolidayLite = {
  id: string;
  date: string;       // ISO
  name: string;
  scope?: string | null;
};