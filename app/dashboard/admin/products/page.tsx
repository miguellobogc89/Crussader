// app/dashboard/products/page.tsx
"use client";

import * as React from "react";
import DataTable from "@/app/components/crussader/UX/table/DataTable";
import type { ColumnDef } from "@/app/components/crussader/UX/table/types";
import { Badge } from "@/app/components/ui/badge";

type Price = {
  id: string;
  billing_period: "ONCE" | "DAY" | "WEEK" | "MONTH" | "YEAR";
  amount_cents: number;
  currency: string;
  is_active: boolean;
  started_at: string | Date;
  ended_at: string | Date | null;
};

type ApiItem = {
  id: string;
  sku: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  type: "STANDALONE" | "ADDON" | "SEAT" | "USAGE" | "LOCATION";
  visibility: "PUBLIC" | "HIDDEN" | "INTERNAL";
  active: boolean;
  visible: boolean;
  launch_at: string | Date | null;
  trial_days: number;
  meta: any;
  created_at: string | Date;
  updated_at: string | Date;
  prices: Price[];
  requirements: any[]; // product_requirement[] (este producto requiere...)
  requiredBy: any[];   // product_requirement[] (otros requieren a este)
};
type ApiResp = { ok: true; items: ApiItem[] } | { ok: false; error: string };

type Row = {
  id: string;
  sku: string | null;
  name: string;
  slug: string | null;
  type: ApiItem["type"];
  visibility: ApiItem["visibility"];
  active: boolean;
  visible: boolean;
  trialDays: number;
  launchAt: string; // formateado
  pricesCount: number;
  monthlyPrice: string; // “12,00 € / mes” o “—”
  reqCount: number;     // cuántos requiere
  reqByCount: number;   // cuántos lo requieren
};

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(dt);
}
function fmtMoneyCents(amount_cents: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount_cents / 100);
}
function pickMonthlyActive(prices: Price[]) {
  const monthlies = prices.filter(
    (p) => p.billing_period === "MONTH" && p.is_active && (p.ended_at === null || p.ended_at === undefined)
  );
  if (!monthlies.length) return null;
  // el más reciente por started_at
  return monthlies.sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  )[0];
}

const COLUMNS: ColumnDef<Row>[] = [
  { id: "sku", label: "SKU", widthPerc: 14, align: "left", sortable: true, filter: "text",
    accessor: r => r.sku ?? "", render: r => <span className="tabular-nums text-muted-foreground">{r.sku ?? "—"}</span> },
  { id: "name", label: "Nombre", widthPerc: 20, align: "left", sortable: true, filter: "text",
    accessor: r => r.name },
  { id: "slug", label: "Slug", widthPerc: 16, align: "left", sortable: true, filter: "text",
    accessor: r => r.slug ?? "", render: r => <span className="text-muted-foreground">{r.slug ?? "—"}</span> },
  { id: "type", label: "Tipo", widthPerc: 12, align: "center", sortable: true, filter: "text",
    accessor: r => r.type, render: r => <Badge variant="outline">{r.type}</Badge> },
  { id: "visibility", label: "Visibilidad", widthPerc: 12, align: "center", sortable: true, filter: "text",
    accessor: r => r.visibility, render: r => <Badge variant="secondary">{r.visibility}</Badge> },
  { id: "active", label: "Activo", widthPerc: 8, align: "center", sortable: true, filter: "boolean",
    accessor: r => r.active, render: r => r.active ? <Badge>Activo</Badge> : <Badge variant="secondary">Inactivo</Badge> },
  { id: "visible", label: "Listable", widthPerc: 10, align: "center", sortable: true, filter: "boolean",
    accessor: r => r.visible, render: r => r.visible ? <Badge variant="outline">Sí</Badge> : <Badge variant="secondary">No</Badge> },
  { id: "trialDays", label: "Trial (días)", widthPerc: 10, align: "center", sortable: true, filter: "text",
    accessor: r => String(r.trialDays) },
  { id: "launchAt", label: "Lanzamiento", widthPerc: 14, align: "center", sortable: true, filter: "text",
    accessor: r => r.launchAt },
  { id: "pricesCount", label: "# precios", widthPerc: 10, align: "center", sortable: true, filter: "text",
    accessor: r => String(r.pricesCount) },
  { id: "monthlyPrice", label: "Mensual activo", widthPerc: 16, align: "center", sortable: true, filter: "text",
    accessor: r => r.monthlyPrice, render: r => <span className="font-medium">{r.monthlyPrice}</span> },
  { id: "reqCount", label: "Requiere", widthPerc: 10, align: "center", sortable: true, filter: "text",
    accessor: r => String(r.reqCount) },
  { id: "reqByCount", label: "Requerido por", widthPerc: 12, align: "center", sortable: true, filter: "text",
    accessor: r => String(r.reqByCount) },
];

export default function ProductsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/products?scope=all", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ApiResp = await res.json();
        if (!("ok" in data) || !data.ok) throw new Error((data as any).error ?? "API_ERROR");

        const mapped: Row[] = (data.items ?? []).map((p) => {
          const monthly = pickMonthlyActive(p.prices);
          const monthlyStr = monthly
            ? `${fmtMoneyCents(monthly.amount_cents, monthly.currency)} / mes`
            : "—";

          return {
            id: p.id,
            sku: p.sku,
            name: p.name,
            slug: p.slug,
            type: p.type,
            visibility: p.visibility,
            active: p.active,
            visible: p.visible,
            trialDays: p.trial_days,
            launchAt: fmtDate(p.launch_at),
            pricesCount: p.prices.length,
            monthlyPrice: monthlyStr,
            reqCount: p.requirements.length,
            reqByCount: p.requiredBy.length,
          };
        });

        if (alive) setRows(mapped);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Catálogo, precios y relaciones.</p>
        </div>
        <a
          href="/dashboard/products/new"
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium
                       bg-primary text-primary-foreground hover:opacity-90 transition"
        >
          Nuevo producto
        </a>
      </div>

      {/* wrapper con scroll horizontal */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Cargando productos…</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-400">Error: {String(error)}</div>
        ) : (
          <div className="min-w-[1200px]"> {/* fuerza ancho para scroll si hace falta */}
            <DataTable<Row>
              columns={COLUMNS}
              rows={rows}
              rowKey={(r) => r.id}
              withActions={true}
              showGlobalSearch={true}
              searchPlaceholder="Buscar productos…"
              getRowSearchText={(r) =>
                [
                  r.sku ?? "",
                  r.name,
                  r.slug ?? "",
                  r.type,
                  r.visibility,
                  r.active ? "activo" : "inactivo",
                  r.visible ? "visible" : "oculto",
                  r.trialDays,
                  r.launchAt,
                  r.monthlyPrice,
                ].join(" ")
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
