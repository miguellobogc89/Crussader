export type View = "day" | "week" | "month";

export type CalendarAppt = {
  id: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  serviceName?: string | null;
  serviceColor?: string | null;
  employeeName?: string | null;
  resourceName?: string | null;
};
