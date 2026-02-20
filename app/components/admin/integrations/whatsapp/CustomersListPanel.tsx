// app/components/admin/integrations/whatsapp/CustomersListPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import { Search, User } from "lucide-react";

type CustomerItem = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  createdAt: string;
};

type ContactItem = {
  id: string;
  name: string;
  phoneE164: string;
  lastMessagePreview: string;
  lastAt: number;
  unread: number;
};

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

function fmtTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function fetchCustomers(args: {
  companyId: string;
  q: string;
  limit: number;
  cursor?: string | null;
}): Promise<{ ok: boolean; items: CustomerItem[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  params.set("companyId", args.companyId);
  if (args.q) params.set("q", args.q);
  params.set("limit", String(args.limit));
  if (args.cursor) params.set("cursor", args.cursor);

  const res = await fetch(`/api/mybusiness/customers?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) return { ok: false, items: [], nextCursor: null };

  const data = (await res.json()) as {
    ok: boolean;
    items: CustomerItem[];
    nextCursor: string | null;
  };

  return data;
}

export default function CustomersListPanel({
  companyId,
  selectedPhone,
  onSelectPhone,
  initialMockWhenEmpty = true,
}: {
  companyId: string | null;
  selectedPhone: string;
  onSelectPhone: (phoneE164: string) => void;
  initialMockWhenEmpty?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Fetch (debounce suave)
  useEffect(() => {
    if (!companyId) {
      setItems([]);
      setNextCursor(null);
      return;
    }

    let alive = true;
    const q = search.trim();

    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchCustomers({
          companyId,
          q,
          limit: 30,
          cursor: null,
        });

        if (!alive) return;

        if (data.ok) {
          setItems(data.items);
          setNextCursor(data.nextCursor);
        } else {
          setItems([]);
          setNextCursor(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [companyId, search]);

  const contacts = useMemo<ContactItem[]>(() => {
    const mapped = items
      .map((c) => {
        const phone = normalizePhone(c.phone || "");
        const nameRaw = `${c.firstName || ""} ${c.lastName || ""}`.trim();
        const name = nameRaw.length > 0 ? nameRaw : `Contacto ${phone.slice(-4)}`;
        const lastAt = c.createdAt ? new Date(c.createdAt).getTime() : Date.now();

        return {
          id: c.id,
          name,
          phoneE164: phone,
          lastMessagePreview: c.email ? c.email : c.phone,
          lastAt,
          unread: 0,
        };
      })
      .filter((x) => x.phoneE164.length > 0);

    if (mapped.length === 0 && initialMockWhenEmpty) {
      const now = Date.now();
      return [
        {
          id: "mock-0001",
          name: "Mock 0001",
          phoneE164: "34600000001",
          lastMessagePreview: "Hola 👋 (mock)",
          lastAt: now - 1000 * 60 * 12,
          unread: 1,
        },
      ];
    }

    return mapped.sort((a, b) => b.lastAt - a.lastAt);
  }, [items, initialMockWhenEmpty]);

  return (
    <div className="h-full border-b lg:border-b-0 lg:border-r">
      <div className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar contacto..."
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      <div className="h-[calc(100%-57px-1px)] overflow-auto">
        {!companyId ? (
          <div className="p-4 text-sm text-muted-foreground">
            Falta <span className="font-mono">companyId</span> en la URL.
          </div>
        ) : loading && contacts.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Cargando...</div>
        ) : contacts.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Sin contactos todavía.</div>
        ) : (
          <div className="divide-y">
            {contacts.map((c) => {
              const active = normalizePhone(selectedPhone) === c.phoneE164;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectPhone(c.phoneE164)}
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
                        <div className="truncate text-sm font-semibold">{c.name}</div>
                        <div className="shrink-0 text-xs text-muted-foreground">
                          {fmtTime(c.lastAt)}
                        </div>
                      </div>

                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <div className="truncate text-xs text-muted-foreground">
                          {c.lastMessagePreview}
                        </div>
                      </div>

                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {c.phoneE164}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}