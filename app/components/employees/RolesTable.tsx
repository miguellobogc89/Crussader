"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/app/components/ui/dropdown-menu";
import { RefreshCw, Plus, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type RoleRow = {
  id: string;
  name: string;
  slug?: string | null;
  color?: string | null;
  active: boolean;
};

type Props = {
  companyId?: string;
  disabled?: boolean;
  className?: string;
  onRowClick?: (role: RoleRow) => void;
  onRefreshed?: (rows: RoleRow[]) => void;
};

const SWATCHES = [
  "#EF4444", "#F59E0B", "#F97316", "#84CC16", "#10B981", "#06B6D4",
  "#3B82F6", "#8B5CF6", "#A855F7", "#EC4899", "#64748B", "#111827",
];

export default function RolesTable({
  companyId,
  disabled = false,
  className,
  onRowClick,
  onRefreshed,
}: Props) {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // añadir rol inline
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  // edición inline de nombre/estado/color
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function fetchRoles() {
    if (!companyId) {
      setRows([]);
      setMsg("Selecciona una empresa");
      return;
    }
    setLoading(true);
    setMsg("Cargando roles…");
    try {
      const res = await fetch(`/api/calendar/staff-roles?companyId=${encodeURIComponent(companyId)}`, { cache: "no-store" });
      const json = await res.json();
      const list: any[] = Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];
      const items: RoleRow[] = list.map((r: any) => ({
        id: String(r.id),
        name: String(r.name ?? ""),
        slug: r.slug ?? null,
        color: r.color ?? null,
        active: Boolean(r.active ?? true),
      }));
      setRows(items);
      setMsg(items.length ? `✅ ${items.length} roles` : "Sin roles");
      onRefreshed?.(items);
    } catch (e: any) {
      setRows([]);
      setMsg(`❌ ${e?.message || "Error"}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  function resetAdd() {
    setAdding(false);
    setNewName("");
    setNewColor("");
    setAddError(null);
    setSaving(false);
  }

  async function handleCreate() {
    if (!newName.trim()) {
      setAddError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setAddError(null);
    try {
      const body: any = { name: newName.trim() };
      if (newColor && /^#?[0-9A-Fa-f]{6}$/.test(newColor.replace("#", ""))) {
        body.color = newColor.startsWith("#") ? newColor : `#${newColor}`;
      }
      const res = await fetch("/api/calendar/staff-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false) throw new Error(json?.error || `HTTP ${res.status}`);
      await fetchRoles();
      resetAdd();
    } catch (e: any) {
      setAddError(e?.message || "No se pudo crear el rol");
    } finally {
      setSaving(false);
    }
  }

  async function updateRole(id: string, patch: Partial<Pick<RoleRow, "name" | "active" | "color">>) {
    setSavingId(id);
    try {
      const res = await fetch("/api/calendar/staff-roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false) throw new Error(json?.error || `HTTP ${res.status}`);
      const updated: RoleRow = {
        id: String(json.item.id),
        name: json.item.name,
        slug: json.item.slug ?? null,
        color: json.item.color ?? null,
        active: Boolean(json.item.active),
      };
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Acciones */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm text-muted-foreground">{msg}</div>

          {!adding ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setAdding(true);
                  setTimeout(() => nameRef.current?.focus(), 0);
                }}
                disabled={disabled || loading}
              >
                <Plus className="h-4 w-4" />
                Añadir rol
              </Button>
              <Button variant="outline" size="sm" onClick={fetchRoles} disabled={disabled || loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refrescar
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                ref={nameRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del rol (p. ej. Recepción)"
                className="h-8 w-56"
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleCreate(); }
                  else if (e.key === "Escape") { e.preventDefault(); resetAdd(); }
                }}
              />
              {/* Color opcional */}
              <input
                type="color"
                value={newColor || "#888888"}
                onChange={(e) => setNewColor(e.target.value)}
                title="Color (opcional)"
                className="h-8 w-10 rounded border p-0"
              />
              <Button size="sm" onClick={handleCreate} disabled={saving || disabled}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetAdd} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Rol</th>
                <th className="px-4 py-2 text-left font-medium">Color</th>
                <th className="px-4 py-2 text-left font-medium">Slug</th>
                <th className="px-4 py-2 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4" colSpan={4}>Cargando…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                    No hay roles.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    {/* Nombre (doble clic para editar) */}
                    <td
                      className="px-4 py-2"
                      onDoubleClick={() => { setEditingId(r.id); setEditName(r.name); }}
                    >
                      {editingId === r.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-64"
                          autoFocus
                          onBlur={() => { if (editName.trim() && editName !== r.name) updateRole(r.id, { name: editName.trim() }); setEditingId(null); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (editName.trim() && editName !== r.name) updateRole(r.id, { name: editName.trim() });
                              setEditingId(null);
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              setEditingId(null);
                            }
                          }}
                          disabled={savingId === r.id}
                        />
                      ) : (
                        <span className={cn("inline-block", savingId === r.id && "opacity-60")}>
                          {r.name}
                        </span>
                      )}
                    </td>

                    {/* Color (dropdown con muestra) */}
                    <td className="px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full border"
                              style={{
                                backgroundColor: r.color || "transparent",
                                borderColor: r.color ? "transparent" : "var(--muted-foreground)",
                              }}
                            />
                            {r.color ?? "—"}
                            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="p-2 w-56">
                          <div className="grid grid-cols-6 gap-2 px-1 pb-2">
                            {SWATCHES.map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                className="h-6 w-6 rounded-full border"
                                style={{ backgroundColor: hex, borderColor: "transparent" }}
                                onClick={() => updateRole(r.id, { color: hex })}
                                title={hex}
                              />
                            ))}
                          </div>
                          <DropdownMenuItem onClick={() => updateRole(r.id, { color: null as any })}>
                            Quitar color
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* Slug (solo lectura) */}
                    <td className="px-4 py-2">{r.slug ?? "—"}</td>

                    {/* Estado (dropdown Activo/Inactivo) */}
                    <td className="px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            {r.active ? <Badge>Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}
                            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => r.active ? null : updateRole(r.id, { active: true })}>
                            Marcar como Activo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => !r.active ? null : updateRole(r.id, { active: false })}>
                            Marcar como Inactivo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
