// app/components/integrations/ConnectionsTable.tsx
// Server Component: consulta Prisma y pinta DataTable (client) con columnas personalizadas.

import { prisma } from "@/app/server/db";
import DataTable from "@/app/components/crussader/UX/table/DataTable";
import type { ColumnDef } from "@/app/components/crussader/UX/table/types";

type Row = {
  id: string;
  provider: string;
  connection: string;
  status: string;
  account: string;
  scope: string;
  syncedAt: string; // ISO string
};

// Util: recorta scopes largos a algo legible
function compactScope(scope?: string | null) {
  if (!scope) return "—";
  const parts = scope.split(/\s+/).filter(Boolean);
  // nos quedamos con los "names" del final de cada scope para abreviar
  return parts
    .map((s) => {
      try {
        const u = new URL(s);
        return u.pathname.split("/").pop() || s;
      } catch {
        return s.split("/").pop() || s;
      }
    })
    .join(", ");
}

// Construye filas a partir de ExternalConnection
function buildRows(ecList: {
  id: string;
  provider: string;
  accountEmail: string | null;
  accountName: string | null;
  scope: string | null;
  updatedAt: Date;
}[]): Row[] {
  const rows: Row[] = [];

  for (const ec of ecList) {
    const baseEmail = ec.accountEmail ?? "—";
    const baseScope = compactScope(ec.scope);
    const synced = ec.updatedAt.toISOString();

    // 1) Fila: Google — User Info (si provider === google)
    if (ec.provider.toLowerCase() === "google") {
      rows.push({
        id: `${ec.id}-userinfo`,
        provider: "Google",
        connection: "User Info",
        status: "Activa",
        account: baseEmail,
        scope: baseScope,
        syncedAt: synced,
      });

      // 2) Fila: Google — Business Profile (depende de tener scope de GBP)
      const hasGBP =
        ec.scope?.includes("business.manage") ||
        ec.scope?.includes("businessprofile") ||
        ec.scope?.includes("mybusiness");

      rows.push({
        id: `${ec.id}-gbp`,
        provider: "Google",
        connection: "Business Profile",
        status: hasGBP ? "Activa" : "Sin cuota",
        account: baseEmail,
        scope: baseScope,
        syncedAt: synced,
      });
    } else {
      // Otros proveedores (gmail, calendar, yelp…) si existieran en BBDD
      rows.push({
        id: `${ec.id}-generic`,
        provider: ec.provider,
        connection: "OAuth",
        status: "Activa",
        account: baseEmail,
        scope: baseScope,
        syncedAt: synced,
      });
    }
  }

  // Orden: más recientes primero
  rows.sort((a, b) => (a.syncedAt > b.syncedAt ? -1 : 1));
  return rows;
}

export default async function ConnectionsTable() {
  const external = await prisma.externalConnection.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      provider: true,
      accountEmail: true,
      accountName: true,
      scope: true,
      updatedAt: true,
    },
  });

  const rows = buildRows(external);

  const columns: ColumnDef<Row>[] = [
    { id: "provider", label: "Proveedor", widthPerc: 14, align: "left", sortable: true, accessor: (r) => r.provider },
    { id: "connection", label: "Conexión", widthPerc: 20, align: "left", sortable: true, accessor: (r) => r.connection },
    { id: "status", label: "Estado", widthPerc: 12, align: "center", sortable: true, accessor: (r) => r.status },
    { id: "account", label: "Cuenta", widthPerc: 24, align: "left", sortable: true, accessor: (r) => r.account },
    { id: "scope", label: "Scope", widthPerc: 18, align: "left", sortable: false, accessor: (r) => r.scope },
    {
      id: "syncedAt",
      label: "Última sync",
      widthPerc: 12,
      align: "center",
      sortable: true,
      accessor: (r) => r.syncedAt,
      render: (r) =>
        new Date(r.syncedAt).toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold mb-3">Conexiones realizadas</h2>
      <DataTable<Row>
        className="rounded-md border"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        withActions={false}          // ⬅️ sin icono/columna de acciones
        showGlobalSearch={false}     // ⬅️ sin buscador global
      />
    </div>
  );
}
