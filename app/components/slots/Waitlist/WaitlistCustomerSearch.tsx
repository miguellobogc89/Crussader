// app/components/slots/Waitlist/WaitlistCustomerSearch.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Check, UserPlus, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SearchBar } from "@/app/components/ui/search-bar";

type CustomerSuggestion = {
  customerId: string;
  displayName: string;
  fullName: string;
  phone: string | null;
};

type Props = {
  companyId: string | null;
  value: string;
  selectedCustomerId: string | null;
  selectedCustomerPhone: string | null;
  onChangeValue: (value: string) => void;
  onSelectCustomer: (item: CustomerSuggestion) => void;
  onRequestCreate: (draftName: string) => void;
};

const CUSTOMER_SEARCH_ENDPOINT = "/api/slots/customers/list";

function buildFullName(item: any): string {
  const firstName = String(item?.customer?.firstName ?? "").trim();
  const lastName = String(item?.customer?.lastName ?? "").trim();
  const joined = `${firstName} ${lastName}`.trim();

  if (joined.length > 0) {
    return joined;
  }

  return String(item?.customer?.displayName ?? "Sin nombre");
}

export function WaitlistCustomerSearch({
  companyId,
  value,
  selectedCustomerId,
  selectedCustomerPhone,
  onChangeValue,
  onSelectCustomer,
  onRequestCreate,
}: Props) {
  const [items, setItems] = useState<CustomerSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!companyId) {
      setItems([]);
      return;
    }

    if (selectedCustomerId) {
      setItems([]);
      return;
    }

    const safeCompanyId = companyId;
    const trimmed = value.trim();

    if (trimmed.length < 2) {
      setItems([]);
      return;
    }

    const controller = new AbortController();

    async function run() {
      try {
        const params = new URLSearchParams();
        params.set("companyId", safeCompanyId);
        params.set("limit", "8");
        params.set("q", trimmed);

        const response = await fetch(
          `${CUSTOMER_SEARCH_ENDPOINT}?${params.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.ok || !Array.isArray(data.items)) {
          setItems([]);
          return;
        }

        const nextItems: CustomerSuggestion[] = data.items.map((item: any) => ({
          customerId: String(item.customerId),
          displayName: String(item?.customer?.displayName ?? "Sin nombre"),
          fullName: buildFullName(item),
          phone: item?.customer?.phone ? String(item.customer.phone) : null,
        }));

        setItems(nextItems);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("[WaitlistCustomerSearch] search", error);
          setItems([]);
        }
      }
    }

    const timeout = window.setTimeout(() => {
      void run();
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [companyId, value, selectedCustomerId]);

  const trimmedValue = value.trim();
  const hasSelectedCustomer = Boolean(selectedCustomerId);
  const showDropdown = trimmedValue.length >= 2 && !hasSelectedCustomer;

  function handleClearSelected() {
    onChangeValue("");
  }

  return (
    <div className="space-y-2">
      {hasSelectedCustomer ? (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 shrink-0 text-blue-700" />
              <p className="truncate text-sm font-medium text-blue-900">
                {value}
              </p>
            </div>

            <p className="mt-0.5 text-[11px] text-blue-700/80">
              {selectedCustomerPhone || "Sin teléfono"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearSelected}
            className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-blue-700 transition hover:bg-blue-100"
            aria-label="Quitar cliente seleccionado"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <SearchBar
          ref={inputRef}
          value={value}
          onChange={onChangeValue}
          placeholder="Buscar por nombre, apellido o teléfono..."
        />
      )}

      {showDropdown ? (
        <div className="rounded-xl border border-border bg-card p-1 shadow-sm">
          {items.length > 0 ? (
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.customerId}
                  type="button"
                  onClick={() => {
                    onSelectCustomer(item);
                    setItems([]);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-muted/50"
                >
                  <span className="truncate text-sm font-medium text-foreground">
                    {item.fullName}
                  </span>

                  <span className="ml-3 shrink-0 text-[11px] text-muted-foreground">
                    {item.phone || "Sin teléfono"}
                  </span>
                </button>
              ))}

              <div className="border-t border-border px-1 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setItems([]);
                    onRequestCreate(trimmedValue);
                  }}
                  className="h-8 w-full justify-start rounded-lg px-2 text-xs font-medium text-muted-foreground"
                >
                  <UserPlus className="mr-2 h-3.5 w-3.5" />
                  Crear cliente nuevo
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 px-2 py-2">
              <p className="text-[11px] text-muted-foreground">
                No se encontraron clientes.
              </p>

              <Button
                type="button"
                variant="ghost"
                onClick={() => onRequestCreate(trimmedValue)}
                className="h-8 w-full justify-start rounded-lg px-2 text-xs font-medium"
              >
                <UserPlus className="mr-2 h-3.5 w-3.5" />
                Crear "{trimmedValue}"
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}