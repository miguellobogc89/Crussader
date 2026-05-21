// app/components/calendar/calendar/types.ts

export type CalendarAppt = {
  id: string;

  locationId: string;

  startAt: string;
  endAt: string;

  serviceId?: string | null;
  serviceName?: string | null;
  serviceColor?: string | null;

  employeeId?: string | null;
  employeeName?: string | null;
  employeeColor?: string | null;

  resourceId?: string | null;
  resourceName?: string | null;

  status?: string | null;

  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;

  notes?: string | null;

  source?: "internal" | "crussader" | "google";
  externalProvider?: string | null;
  externalCalendarId?: string | null;
  externalEventId?: string | null;
  isUrgent?: boolean;
  hasRecoverySlot?: boolean;
};

export type Appointment = CalendarAppt;

export type View = "day" | "threeDays" | "workingWeek" | "week" | "month";