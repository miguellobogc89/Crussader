// app/components/calendar/CalendarOnly/types.ts

// ✅ Tipo de cita que usamos en las vistas
export type CalendarAppt = {
  id: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  serviceName?: string | null;
  serviceColor?: string | null;
  employeeName?: string | null;
  resourceName?: string | null;
};

// ✅ Tipo de vista (lo usan ViewControls y el wrapper)
export type View = "day" | "threeDays" | "workingWeek" | "week" | "month";
