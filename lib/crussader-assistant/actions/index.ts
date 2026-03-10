// lib/crussader-assistant/actions/index.ts

import { identifyCustomer } from "./identifyCustomer";
import { assureCustomer } from "./assureCustomer";

export const ACTIONS = {
  identify_assistant_customer: identifyCustomer,
  assure_assistant_customer: assureCustomer,
} as const;

export type ActionName = keyof typeof ACTIONS;