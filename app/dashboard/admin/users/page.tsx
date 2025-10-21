// app/dashboard/admin/users/page.tsx
"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";

import DataTable from "@/app/components/crussader/UX/table/DataTable";
import ColorDot from "@/app/components/crussader/UX/table/ColorDot";
import type { ColumnDef } from "@/app/components/crussader/UX/table/types";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useToast } from "@/app/components/ui/use-toast";

import {
  ChevronDown, ChevronRight, ChevronDownSquare,
  Pencil, RefreshCcw, Trash2,
} from "lucide-react";

// ---------- Tipos ----------
type Role = "system_admin" | "org_admin" | "user" | "test";

type ApiUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  isActive: boolean;
  loginCount: number;
  createdAt: string;
  companyName?: string | null; // opcional si enriqueces el endpoint
};

type ApiListResponse = {
  ok: boolean;
  total: number;
  users: ApiUser[];
  page: number;
  pages: number;
  pageSize: number;
  error?: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyName: string | null;
  loginCount: number;
  color: string | null;
  active: boolean;
};

type Related = {
  companies: { id: string; name: string; plan?: string | null; createdAt: string }[];
  locations: { id: string; title: string; city?: string | null; region?: string | null; country?: string | null; createdAt: string }[];
};

// ---------- Constantes ----------
const ROLE_COLOR: Record<Role, string> = {
  system_admin: "#3B82F6",
  org_admin: "#8B5CF6",
  user: "#6B7280",
  test: "#F59E0B",
};

const AVAILABLE_ROLES: Role[] = ["system_admin", "org_admin", "user", "test"];

// ---------- Página ----------
export default function AdminUsersPage() {
  const { toast } = useToast();

  // listado
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [take, setTake] = useState(20);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  // edición/acciones
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingRoleForId, setSavingRoleForId] = useState<string | null>(null);

  // expansión inline
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [relatedCache, setRelatedCache] = useState<
    Record<string, { loading: boolean; error?: string | null; data?: Related }>
  >({});

  // ------- Carga de usuarios -------
  async function fetchUsers(opts?: { page?: number; take?: number; uq?: string }) {
    const p = opts?.page ?? page;
    const t = opts?.take ?? take;
    const uq = opts?.uq ?? appliedQuery;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("upage", String(p));
      params.set("take", String(t));
      if (uq.trim()) params.set("uq", uq.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      const json: ApiListResponse = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP_${res.status}`);
      setUsers(json.users);
      setPage(json.page);
    } catch (e: any) {
      setError(e?.message || "FETCH_USERS_ERROR");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchUsers({ page: 1, take, uq: appliedQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [take, appliedQuery]);

  // map a filas de tabla
  const rows: UserRow[] = useMemo(
    () =>
      users.map((u) => ({
        id: u.id,
        name: u.name ?? u.email ?? "(sin nombre)",
        email: u.email ?? "—",
        role: u.role,
        companyName: u.companyName ?? null,
        loginCount: u.loginCount ?? 0,
        color: ROLE_COLOR[u.role] ?? null,
        active: u.isActive,
      })),
    [users],
  );

  // ------- Acciones -------
  function onEdit(id: string) {
    window.location.href = `/dashboard/admin/users/${id}`;
  }

  async function updateRole(userId: string, newRole: Role) {
    setSavingRoleForId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP_${res.status}`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast({
        title: "Rol actualizado",
        description: `Nuevo rol: ${newRole.replace("_", " ")}`,
        variant: "success",
      });
    } catch (e: any) {
      toast({
        title: "No se pudo actualizar el rol",
        description: e?.message ?? "Inténtalo de nuevo más tarde.",
        variant: "error",
      });
    } finally {
      setSavingRoleForId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${confirmDeleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP_${res.status}`);
      setUsers((prev) => prev.filter((u) => u.id !== confirmDeleteId));
      setConfirmDeleteId(null);
      toast({
        title: "Usuario eliminado",
        description: "La operación se realizó correctamente.",
        variant: "success",
      });
    } catch (e: any) {
      toast({
        title: "Error al eliminar",
        description: e?.message ?? "No se pudo completar la operación.",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  }

// expansión: toggle + carga perezosa del relacionado
async function onToggleExpand(id: string) {
  // si estaba abierto, lo cerramos y NO cargamos nada
  const wasOpen = expandedRowIds.includes(id);
  setExpandedRowIds((prev) => (wasOpen ? prev.filter((x) => x !== id) : [...prev, id]));
  if (wasOpen) return;

  // si ya tenemos cache o ya está cargando, no volvemos a pedir
  const cache = relatedCache[id];
  if (cache?.data || cache?.loading) return;

  setRelatedCache((prev) => ({ ...prev, [id]: { loading: true } }));

  try {
    const res = await fetch(`/api/admin/users/${id}/related`, { cache: "no-store" });
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        `Unexpected content-type: ${ct}. Status ${res.status}. Body: ${text.slice(0, 120)}`
      );
    }

    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || `HTTP_${res.status}`);

    // 👇 AQUÍ estaba el fallo: guardar data + marcar loading=false
    setRelatedCache((prev) => ({
      ...prev,
      [id]: {
        loading: false,
        data: {
          companies: json.companies || [],
          locations: json.locations || [],
        },
      },
    }));
  } catch (e: any) {
    console.error("RELATED_ERROR", e);
    setRelatedCache((prev) => ({
      ...prev,
      [id]: { loading: false, error: e?.message || "RELATED_ERROR" },
    }));
  }
}


  // ---------- Columnas sub-tablas ----------
  const companyCols: ColumnDef<{ id: string; name: string; plan?: string | null; createdAt: string }>[] = [
    { id: "name", label: "Nombre", widthPerc: 40, align: "left", accessor: (r) => r.name },
    { id: "plan", label: "Plan", widthPerc: 20, align: "left", accessor: (r) => r.plan ?? "—" },
    {
      id: "createdAt",
      label: "Alta",
      widthPerc: 20,
      align: "left",
      accessor: (r) => r.createdAt,
      render: (r) => <span>{new Date(r.createdAt).toLocaleDateString("es-ES")}</span>,
    },
  ];

  const locationCols: ColumnDef<{ id: string; title: string; city?: string | null; region?: string | null; country?: string | null; createdAt: string }>[] = [
    { id: "title", label: "Título", widthPerc: 30, align: "left", accessor: (r) => r.title },
    { id: "city", label: "Ciudad", widthPerc: 20, align: "left", accessor: (r) => r.city ?? "—" },
    { id: "region", label: "Región", widthPerc: 20, align: "left", accessor: (r) => r.region ?? "—" },
    { id: "country", label: "País", widthPerc: 10, align: "left", accessor: (r) => r.country ?? "—" },
    {
      id: "createdAt",
      label: "Alta",
      widthPerc: 20,
      align: "left",
      accessor: (r) => r.createdAt,
      render: (r) => <span>{new Date(r.createdAt).toLocaleDateString("es-ES")}</span>,
    },
  ];

  // ---------- Columnas tabla principal ----------
  const columns: ColumnDef<UserRow>[] = useMemo(
    () => [
      // Nombre + lápiz en hover
      {
        id: "name",
        label: "Nombre",
        widthPerc: 20,
        align: "left",
        sortable: true,
        filter: "text",
        accessor: (r) => r.name,
        render: (r) => (
          <div className="group relative flex items-center gap-2">
            <span className="truncate">{r.name}</span>
            <button
              aria-label="Editar usuario"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
              onClick={() => onEdit(r.id)}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ),
      },

      // Rol editable con dropdown en hover
      {
        id: "role",
        label: "Rol",
        widthPerc: 16,
        align: "left",
        sortable: true,
        filter: "text",
        accessor: (r) => r.role,
        render: (r) => {
          const saving = savingRoleForId === r.id;
          return (
            <div className="group inline-flex items-center gap-2">
              <div className="flex items-center gap-2">
                <ColorDot color={r.color} />
                <span className="text-sm capitalize">{r.role.replace("_", " ")}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Cambiar rol"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted disabled:opacity-50"
                    disabled={saving}
                  >
                    <ChevronDown className={`h-4 w-4 ${saving ? "animate-pulse" : ""}`} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {AVAILABLE_ROLES.map((roleOpt) => (
                    <DropdownMenuCheckboxItem
                      key={roleOpt}
                      checked={r.role === roleOpt}
                      onCheckedChange={() => {
                        if (r.role !== roleOpt) void updateRole(r.id, roleOpt);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <ColorDot color={ROLE_COLOR[roleOpt]} />
                        <span className="capitalize">{roleOpt.replace("_", " ")}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },

      // Empresa
      {
        id: "company",
        label: "Empresa",
        widthPerc: 22,
        align: "left",
        sortable: true,
        filter: "text",
        accessor: (r) => r.companyName ?? "",
        render: (r) => (
          <p className="truncate whitespace-nowrap text-muted-foreground">
            {r.companyName ?? "—"}
          </p>
        ),
      },

      // Email
      {
        id: "email",
        label: "Email",
        widthPerc: 22,
        align: "left",
        sortable: true,
        filter: "text",
        accessor: (r) => r.email,
        render: (r) => <p className="truncate whitespace-nowrap">{r.email}</p>,
      },

      // Estado
      {
        id: "active",
        label: "Estado",
        widthPerc: 8,
        align: "center",
        sortable: true,
        filter: "boolean",
        accessor: (r) => r.active,
        render: (r) =>
          r.active ? <Badge>Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>,
      },

      // Expandir (antes de borrar)
      {
        id: "expand",
        label: "",
        widthPerc: 6,
        align: "right",
        sortable: false,
        accessor: (r) => r.id,
        render: (r) => {
          const open = expandedRowIds.includes(r.id);
          return (
            <button
              aria-label="Expandir"
              className="p-2 rounded hover:bg-muted"
              onClick={() => onToggleExpand(r.id)}
              title={open ? "Contraer" : "Expandir"}
            >
              {open ? <ChevronDownSquare className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          );
        },
      },

      // Borrar
      {
        id: "actions",
        label: "",
        widthPerc: 6,
        align: "right",
        sortable: false,
        accessor: (r) => r.id,
        render: (r) => (
          <button
            aria-label="Borrar usuario"
            className="p-2 rounded hover:bg-destructive/10 text-destructive"
            onClick={() => setConfirmDeleteId(r.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savingRoleForId, expandedRowIds],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Usuarios (Admin)</CardTitle>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Tamaño</label>
              <select
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={take}
                onChange={(e) => setTake(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setAppliedQuery(query);
                void fetchUsers({ page: 1, take, uq: query });
              }}
            >
              <Input
                placeholder="Buscar por nombre/email/empresa…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-[240px]"
              />
              <Button type="submit" variant="secondary">
                Buscar
              </Button>
            </form>

            <Button
              onClick={() => void fetchUsers()}
              variant="outline"
              disabled={loading}
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Refrescar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <p className="text-sm text-red-600">Error: {error}</p>
          ) : (
            <DataTable<UserRow>
              className={loading ? "opacity-60 pointer-events-none" : ""}
              columns={columns}
              rows={rows}
              rowKey={(r) => r.id}
              withActions={false}
              showGlobalSearch={true}
              searchPlaceholder="Buscar en esta tabla…"
              getRowSearchText={(r) =>
                [r.name, r.email, r.companyName ?? "", r.role, r.active ? "activo" : "inactivo"].join(" ")
              }
              // 👇 NUEVO: expansión inline
              expandedRowIds={expandedRowIds}
              onToggleExpand={onToggleExpand}
              renderExpandedRow={(r) => {
                const state = relatedCache[r.id] || { loading: true };
                if (state.loading) {
                  return <p className="text-sm text-muted-foreground">Cargando datos relacionados…</p>;
                }
                if (state.error) {
                  return <p className="text-sm text-red-600">Error: {state.error}</p>;
                }
                const data = state.data!;
                return (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-medium">Empresas</h3>
                      <DataTable
                        columns={companyCols}
                        rows={data.companies}
                        rowKey={(x) => x.id}
                        withActions={false}
                        showGlobalSearch={false}
                      />
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-medium">Ubicaciones</h3>
                      <DataTable
                        columns={locationCols}
                        rows={data.locations}
                        rowKey={(x) => x.id}
                        withActions={false}
                        showGlobalSearch={false}
                      />
                    </div>
                  </div>
                );
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal confirmación borrado */}
      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => {
          if (!o && !deleting) setConfirmDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también sus sesiones, conexiones externas y relaciones básicas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
