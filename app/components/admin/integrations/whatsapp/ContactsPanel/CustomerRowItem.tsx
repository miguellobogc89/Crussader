// app/components/admin/integrations/whatsapp/ContactsPanel/CustomerRowItem.tsx
"use client";

import { User } from "lucide-react";
import type { CustomerListItem } from "@/app/components/admin/integrations/whatsapp/CustomersListPanel";

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

export default function CustomerRowItem({
  customer,
  active,
  onClick,
}: {
  customer: CustomerListItem;
  active: boolean;
  onClick: () => void;
}) {
  const phoneDigits = normalizePhone(customer.phone);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left",
        "px-3 py-3",
        "hover:bg-muted/40",
        active ? "bg-muted/50" : "bg-transparent",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border bg-background">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-semibold">{customer.name}</div>
          </div>

          <div className="mt-1 text-[11px] text-muted-foreground">{phoneDigits}</div>
        </div>
      </div>
    </button>
  );
}