// lib/agents/actions/index.ts
import { identifyCustomer } from "./idetinfyCustomer";
import { assureCustomer } from "./assureCustomer";
import { customerDataUpsert } from "./customerDataUpsert";
import { appointmentServiceLookup } from "./appointmentServiceLookup";

export const ACTIONS = {
  identify_customer: identifyCustomer,
  assure_customer: assureCustomer,
  customer_data_upsert: customerDataUpsert,
  appointment_service_lookup: appointmentServiceLookup,
} as const;

export type ActionName = keyof typeof ACTIONS;