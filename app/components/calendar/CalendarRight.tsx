// app/components/calendar/CalendarRight.tsx
"use client";

import AppointmentDetailsCard from "@/app/components/calendar/AppointmentDetailsCard";

type Appointment = {
  id: string;
  locationId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status?: "PENDING" | "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | null;
  employeeId?: string | null;
  resourceId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
};
type ServiceLite = { id: string; name: string; durationMin: number; color?: string | null };

export default function CalendarRight({
  appointment,
  services,
}: {
  appointment: Appointment | null;
  services: ServiceLite[];
}) {
  return (
    <div className="hidden lg:block w-[360px] shrink-0 overflow-y-auto">
      <AppointmentDetailsCard appointment={appointment} services={services} />
    </div>
  );
}
