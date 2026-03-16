// lib/crussader-assistant/actions/index.ts

import { identifyCustomer } from "../domains/events/actions/identifyCustomer";
import { assureCustomer } from "../domains/events/actions/assureCustomer";

export const ACTIONS = {
  identify_assistant_customer: identifyCustomer,
  assure_assistant_customer: assureCustomer,
} as const;

export type ActionName = keyof typeof ACTIONS;