// app/components/slots/SendToContactsModal/hooks/useSlotCustomers.ts

import { useCallback, useEffect, useState } from "react";
import type { CustomerListItem } from "@/app/components/slots/helpers/slotsCustomersPickerHelpers";

type CustomersCacheEntry = {
  items: CustomerListItem[];
  cachedAt: number;
};

const CACHE_TTL_MS = 60_000;
const customersCache = new Map<string, CustomersCacheEntry>();

export function getCacheKey(
  companyId: string,
  slotId: string,
  query: string
): string {
  return `${companyId}::${slotId}::${query.trim().toLowerCase()}`;
}

export function setCachedCustomers(
  cacheKey: string,
  items: CustomerListItem[]
): void {
  customersCache.set(cacheKey, {
    items,
    cachedAt: Date.now(),
  });
}

function getCachedCustomers(cacheKey: string): CustomerListItem[] | null {
  const entry = customersCache.get(cacheKey);

  if (!entry) return null;

  const isExpired = Date.now() - entry.cachedAt > CACHE_TTL_MS;

  if (isExpired) {
    customersCache.delete(cacheKey);
    return null;
  }

  return entry.items;
}

type Params = {
  open: boolean;
  companyId: string;
  slotId: string;
  query: string;
};

export function useSlotCustomers({
  open,
  companyId,
  slotId,
  query,
}: Params) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CustomerListItem[]>([]);

  const fetchCustomers = useCallback(
    async (searchValue: string, signal?: AbortSignal) => {
      const params = new URLSearchParams();
      params.set("companyId", companyId);
      params.set("slotId", slotId);
      params.set("limit", "50");

      if (searchValue.trim()) {
        params.set("q", searchValue.trim());
      }

      const response = await fetch(
        `/api/slots/customers/list?${params.toString()}`,
        {
          method: "GET",
          signal,
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "No se pudieron cargar los clientes");
      }

      const nextItems = Array.isArray(data.items)
        ? (data.items as CustomerListItem[])
        : [];

      setCachedCustomers(getCacheKey(companyId, slotId, searchValue), nextItems);
      setItems(nextItems);
    },
    [companyId, slotId]
  );

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const cacheKey = getCacheKey(companyId, slotId, query);
    const cachedItems = getCachedCustomers(cacheKey);

    if (cachedItems) {
      setItems(cachedItems);
      setLoading(false);
    } else {
      setLoading(true);
    }

    async function run() {
      try {
        await fetchCustomers(query, controller.signal);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("SlotsCustomersPickerModal fetch error", error);

        if (!cachedItems) {
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timeout = window.setTimeout(run, cachedItems ? 0 : 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [open, query, companyId, slotId, fetchCustomers]);

  return {
    loading,
    items,
    setItems,
    fetchCustomers,
  };
}