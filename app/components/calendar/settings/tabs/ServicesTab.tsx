"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import DataTable from "@/app/components/crussader/UX/table/DataTable";
import ColorDot from "@/app/components/crussader/UX/table/ColorDot";
import type { ColumnDef } from "@/app/components/crussader/UX/table/types";
import { Badge } from "@/app/components/ui/badge";

/* === Tipo de fila para la tabla de servicios === */
type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number | null;
  price: number | null;
  color: string | null;
  active: boolean;
};

export default function ServicesTab({
  companyName,
  locationId,
  locations,
}: {
  companyName: string | null;
  locationId: string; // "all" o location concreta
  locations: { id: string; title: string }[];
}) {
  const [rows, setRows] = React.useState<ServiceRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Adaptador → normaliza lo que venga del API
  const adapt = React.useCallback((items: any[]): ServiceRow[] => {
    return (Array.isArray(items) ? items : []).map((s: any): ServiceRow => ({
      id: String(s.id),
      name: String(s.name ?? ""),
      description: s.description ?? null,
      durationMin: typeof s.durationMin === "number" ? s.durationMin : (typeof s.duration_min === "number" ? s.duration_min : null),
      price: typeof s.price === "number" ? s.price : (typeof s.price_cents === "number" ? s.price_cents / 100 : null),
      color: s.color ?? null,
      active: Boolean(s.active ?? true),
    }));
  }, []);

  const fetchServices = React.useCallback(async () => {
    setLoading(true);
    try {
      if (locationId && locationId !== "all") {
        const res = await fetch(`/api/calendar/services?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || json?.error) { setRows([]); return; }
        setRows(adapt(json.items ?? []));
      } else {
        // all: agregamos servicios de todas las ubicaciones visibles
        const out: ServiceRow[] = [];
        for (const loc of locations.filter((l: { id: string; title: string }) => l.id !== "all")) {
          const res = await fetch(`/api/calendar/services?locationId=${encodeURIComponent(loc.id)}`, { cache: "no-store" });
          const json = await res.json();
          out.push(...adapt(json.items ?? []));
        }
        // orden por nombre para consistencia
        out.sort((a, b) => a.name.localeCompare(b.name));
        setRows(out);
      }
    } catch (e) {
      console.error("[ServicesTab] fetch error", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [locationId, locations, adapt]);

  React.useEffect(() => { fetchServices(); }, [fetchServices]);

  // === Columnas DataTable (Nombre | Descripción | Duración | Precio | Color | Estado) ===
  const columns: ColumnDef<ServiceRow>[] = [
    {
      id: "name",
      label: "Nombre",
      widthPerc: 24,
      align: "left",
      sortable: true,
      filter: "text",
      accessor: (r) => r.name,
    },
    {
      id: "description",
      label: "Descripción",
      widthPerc: 40,
      align: "center",
      sortable: true,
      filter: "text",
      accessor: (r) => r.description ?? "",
      render: (r) => (
        <p className="truncate whitespace-nowrap text-muted-foreground">
          {r.description ?? "—"}
        </p>
      ),
    },
    {
      id: "durationMin",
      label: "Duración",
      widthPerc: 12,
      align: "center",
      sortable: true,
      accessor: (r) => r.durationMin ?? 0,
      render: (r) => (r.durationMin == null ? "—" : `${r.durationMin} min`),
    },
    {
      id: "price",
      label: "Precio",
      widthPerc: 12,
      align: "center",
      sortable: true,
      accessor: (r) => r.price ?? 0,
      render: (r) =>
        r.price == null
          ? "—"
          : Number(r.price).toLocaleString("es-ES", { style: "currency", currency: "EUR" }),
    },
    {
      id: "color",
      label: "Color",
      widthPerc: 8,
      align: "center",
      sortable: false,
      accessor: (r) => r.color ?? "",
      render: (r) => <ColorDot color={r.color} />,
    },
    {
      id: "active",
      label: "Estado",
      widthPerc: 4,
      align: "center",
      sortable: true,
      filter: "boolean",
      accessor: (r) => r.active,
      render: (r) => (r.active ? <Badge>Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Servicios — {companyName ?? "Empresa"}{locationId === "all" ? " (todas las ubicaciones)" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<ServiceRow>
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          withActions={true}
          showGlobalSearch={true}
          searchPlaceholder="Buscar servicio…"
          getRowSearchText={(r) =>
            [
              r.name,
              r.description ?? "",
              r.durationMin == null ? "" : `${r.durationMin} min`,
              r.price == null ? "" : Number(r.price).toLocaleString("es-ES", { style: "currency", currency: "EUR" }),
              r.active ? "activo" : "inactivo",
            ].join(" ")
          }
          className={loading ? "opacity-70 pointer-events-none" : undefined}
        />
      </CardContent>
    </Card>
  );
}
