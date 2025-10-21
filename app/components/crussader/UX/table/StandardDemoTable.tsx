"use client";

import * as React from "react";
import DataTable from "@/app/components/crussader/UX/table/DataTable";
import ColorDot from "@/app/components/crussader/UX/table/ColorDot";
import type { ColumnDef } from "@/app/components/crussader/UX/table/types";
import { Badge } from "@/app/components/ui/badge";

export type StandardRow = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
  color: string | null;
  active: boolean;
};

const DEFAULT_ROWS: StandardRow[] = [
  { id: "1", name: "Corte clásico", description: "Corte básico con acabado", durationMin: 30, price: 15, color: "#3B82F6", active: true },
  { id: "2", name: "Manicura", description: "Limpieza + esmaltado", durationMin: 45, price: 22.5, color: "#EC4899", active: true },
  { id: "3", name: "Masaje 60", description: "Relajante cuerpo entero", durationMin: 60, price: 49.9, color: "#10B981", active: false },
  { id: "4", name: "Peinado evento", description: "Recogido o moldeado", durationMin: 40, price: 30, color: null, active: true },
];

const COLUMNS: ColumnDef<StandardRow>[] = [
  {
    id: "name",
    label: "Nombre",
    widthPerc: 18,
    align: "left",
    sortable: true,
    filter: "text",
    accessor: (r) => r.name,
  },
  {
    id: "description",
    label: "Descripción",
    widthPerc: 38,
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
    accessor: (r) => r.durationMin,
    render: (r) => <span>{r.durationMin} min</span>,
  },
  {
    id: "price",
    label: "Precio",
    widthPerc: 12,
    align: "center",
    sortable: true,
    accessor: (r) => r.price,
    render: (r) => (
      <span>
        {Number(r.price).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
      </span>
    ),
  },
  {
    id: "color",
    label: "Color",
    widthPerc: 12,
    align: "center",
    sortable: false,
    accessor: (r) => r.color ?? "",
    render: (r) => <ColorDot color={r.color} />,
  },
  {
    id: "active",
    label: "Estado",
    widthPerc: 8,
    align: "center",
    sortable: true,
    filter: "boolean",
    accessor: (r) => r.active,
    render: (r) => (r.active ? <Badge>Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>),
  },
];

export default function StandardDemoTable({
  rows = DEFAULT_ROWS,
  className,
  withActions = true,
}: {
  rows?: StandardRow[];
  className?: string;
  withActions?: boolean;
}) {
  return (
    <DataTable<StandardRow>
      className={className}
      columns={COLUMNS}
      rows={rows}
      rowKey={(r) => r.id}
      withActions={withActions}
      showGlobalSearch={true}
      searchPlaceholder="Buscar en esta tabla…"
      // opcional: cómo indexar el texto buscable de cada fila
      getRowSearchText={(r) =>
        [
          r.name,
          r.description ?? "",
          `${r.durationMin} min`,
          Number(r.price).toLocaleString("es-ES", { style: "currency", currency: "EUR" }),
          r.active ? "activo" : "inactivo",
        ].join(" ")
      }
    />
  );
}
