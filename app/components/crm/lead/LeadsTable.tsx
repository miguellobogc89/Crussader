// app/components/crm/lead/LeadsTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, RefreshCw, Pencil } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "WON";

type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  rating: string | null;
  reviewCount: number | null;
  createdAt: string;
};

const STATUSES: Array<{ value: LeadStatus; label: string }> = [
  { value: "NEW", label: "Nuevo" },
  { value: "CONTACTED", label: "Contactado" },
  { value: "QUALIFIED", label: "Cualificado" },
  { value: "WON", label: "Ganado" },
  { value: "LOST", label: "Perdido" },
];

function statusBadgeVariant(s: LeadStatus) {
  if (s === "WON") return "default";
  if (s === "LOST") return "destructive";
  if (s === "QUALIFIED") return "secondary";
  return "outline";
}

function statusLabel(s: LeadStatus) {
  const hit = STATUSES.find((x) => x.value === s);
  return hit ? hit.label : s;
}

async function fetchLeads(): Promise<LeadRow[]> {
  const res = await fetch("/api/admin/leads", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json?.ok) {
    throw new Error(json?.message || "Error cargando leads");
  }
  return (json.leads || []).map((l: any) => ({
    id: l.id,
    name: l.name,
    email: l.email ?? null,
    phone: l.phone ?? null,
    status: l.status,
    rating: l.rating ?? null,
    reviewCount: l.reviewCount ?? null,
    createdAt: l.createdAt,
  }));
}

async function patchLeadStatus(leadId: string, status: LeadStatus) {
  const res = await fetch(`/api/admin/leads/${leadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok || !json?.ok) {
    throw new Error(json?.message || "No se pudo actualizar el estado");
  }
}

function formatRating(rating: string | null) {
  if (!rating) return "—";
  const n = Number(rating);
  if (Number.isNaN(n)) return "—";
  return n.toFixed(2);
}

export default function LeadsTable() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeads();
      setRows(data);
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const hasRows = useMemo(() => rows.length > 0, [rows]);

  const onChangeStatus = async (leadId: string, next: LeadStatus) => {
    const prev = rows;
    setBusyId(leadId);
    setRows((cur) =>
      cur.map((r) => (r.id === leadId ? { ...r, status: next } : r))
    );
    try {
      await patchLeadStatus(leadId, next);
    } catch (e: any) {
      setRows(prev);
      setError(e?.message || "No se pudo actualizar el estado");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="text-sm text-muted-foreground">
          {loading
            ? "Cargando..."
            : hasRows
            ? `${rows.length} leads`
            : "Sin leads"}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => window.dispatchEvent(new Event("leads:new"))}
          >
            + Nuevo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="w-full overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Rating</th>
              <th className="px-3 py-2 font-medium">Volumen</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Teléfono</th>
              <th className="px-3 py-2 font-medium">Creado</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() =>
                    window.open(
                      `/dashboard/leads/${r.id}`,
                      "_blank"
                    )
                  }
                  onMouseDown={() => setSelectedId(r.id)}
                  className={`border-t cursor-pointer hover:bg-muted/40 ${
                    selectedId === r.id ? "bg-muted" : ""
                  }`}
                >
                  <td className="px-3 py-2 group relative">
                    {r.name}
                    <Pencil className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                  </td>

                  <td className="px-3 py-2">{formatRating(r.rating)}</td>
                  <td className="px-3 py-2">{r.reviewCount ?? "—"}</td>
                  <td className="px-3 py-2">{r.email ?? "—"}</td>
                  <td className="px-3 py-2">{r.phone ?? "—"}</td>

                  <td className="px-3 py-2">
                    {new Date(r.createdAt).toLocaleDateString("es-ES")}
                  </td>

                  <td className="px-3 py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 px-2 gap-2"
                          disabled={busyId === r.id}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge variant={statusBadgeVariant(r.status) as any}>
                            {statusLabel(r.status)}
                          </Badge>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        {STATUSES.map((s) => (
                          <DropdownMenuItem
                            key={s.value}
                            onClick={() => onChangeStatus(r.id, s.value)}
                          >
                            {s.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
