export type Appointment = {
  id: string;
  locationId: string;
  serviceId: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  status?: "PENDING" | "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | null;
  employeeId?: string | null;
  resourceId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
};
