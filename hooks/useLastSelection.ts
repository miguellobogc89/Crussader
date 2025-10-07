"use client";

import { usePersistentSelection } from "./usePersistentSelection";

export function useLastCompanyId() {
  return usePersistentSelection<string>("company:last", null, {
    version: 1,
    ttlDays: 180,
    isValid: (v): v is string => typeof v === "string" && v.length > 0,
  });
}

export function useLastLocationId(companyId?: string | null) {
  // Key por empresa, así cada una recuerda su última location distinta
  const key = companyId ? `location:last:${companyId}` : "location:last";
  return usePersistentSelection<string>(key, null, {
    version: 1,
    ttlDays: 180,
    isValid: (v): v is string => typeof v === "string" && v.length > 0,
  });
}
