// app/components/slots/SendToContactsModal/constants/customerTabs.ts

import type { CustomerTabId } from "../../SendToContactsModal/types";

export const customerTabs: Array<{
  id: CustomerTabId;
  label: string;
}> = [
  { id: "all", label: "Todos" },
  { id: "available", label: "Disponibles" },
  { id: "unavailable", label: "No contactar" },
  { id: "upcoming", label: "Cita próxima" },
  { id: "recent", label: "Cita reciente" },
  { id: "waitlist", label: "Lista espera" },
];