// app/components/employees/EditEmployeeModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { X } from "lucide-react";

/** Tipo local para no depender de EmployeesTable.tsx */
type EmployeeRowLocal = {
  id: string;
  name: string;
  active: boolean;
  /** multi-location (preferente) */
  locationIds?: string[];
  locationNames?: string[];
  /** compat: single */
  locationId?: string | null;
  locationName?: string | null;
  /** multi-rol */
  roleIds?: string[];
  roleNames?: string[];
};

export function EditEmployeeModal({
  open,
  onOpenChange,
  employee,
  onSaved,
  availableLocations,
  availableRoles = [],
  filterLocationId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee?: EmployeeRowLocal;
  onSaved?: () => void;
  availableLocations: { id: string; title: string }[];
  availableRoles?: { id: string; name: string }[];
  /** si viene (y !== "all") se usa para filtrar el catálogo remoto de roles */
  filterLocationId?: string;
}) {
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ===== Ubicaciones =====
  const [locIds, setLocIds] = useState<string[]>([]);
  const [locQuery, setLocQuery] = useState("");
  const [showLocSuggest, setShowLocSuggest] = useState(false);
  const locSuggestRef = useRef<HTMLDivElement | null>(null);

  // ===== Roles =====
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [roleQuery, setRoleQuery] = useState("");
  const [showRoleSuggest, setShowRoleSuggest] = useState(false);
  const roleSuggestRef = useRef<HTMLDivElement | null>(null);

  const effectiveLocationId = useMemo(() => {
    if (filterLocationId && filterLocationId !== "all") return filterLocationId;
    if (employee?.locationIds && employee.locationIds.length > 0) return String(employee.locationIds[0]);
    if (employee?.locationId) return String(employee.locationId);
    return undefined;
  }, [filterLocationId, employee]);

  // Catálogo remoto de roles (si no viene por props)
  const [localRoles, setLocalRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // ===== Init al abrir / cambiar empleado =====
  useEffect(() => {
    if (!employee) return;

    setName(employee.name || "");
    setActive(!!employee.active);

    // ubicaciones iniciales
    const initialLocs =
      employee.locationIds && employee.locationIds.length > 0
        ? employee.locationIds.map(String)
        : employee.locationId
        ? [String(employee.locationId)]
        : [];
    setLocIds(initialLocs);

    // roles iniciales
    const initialRoleIds: string[] = Array.isArray(employee.roleIds) ? employee.roleIds.map(String) : [];
    setRoleIds(initialRoleIds);

    setLocQuery("");
    setShowLocSuggest(false);
    setRoleQuery("");
    setShowRoleSuggest(false);
    setErrorMsg(null);
  }, [employee]);

  // ===== Fallback: cargar roles al abrir si no hay disponibles en props =====
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!open) return;

      const hasRolesProp = (availableRoles?.length ?? 0) > 0;
      if (hasRolesProp) {
        setLocalRoles([]); // usamos los de props
        return;
      }

      try {
        setLoadingRoles(true);
        const url = effectiveLocationId
          ? `/api/calendar/staff-roles?locationId=${encodeURIComponent(effectiveLocationId)}`
          : `/api/calendar/staff-roles`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        const rows: Array<{ id: string; name: string }> = Array.isArray(json?.items)
          ? json.items.map((r: any) => ({ id: String(r.id), name: String(r.name) }))
          : [];
        setLocalRoles(rows);
      } catch {
        if (!cancelled) setLocalRoles([]);
      } finally {
        if (!cancelled) setLoadingRoles(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [open, availableRoles, effectiveLocationId]);

  // ===== Cerrar dropdowns al clicar fuera =====
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (showLocSuggest && locSuggestRef.current && !locSuggestRef.current.contains(e.target as Node)) {
        setShowLocSuggest(false);
      }
      if (showRoleSuggest && roleSuggestRef.current && !roleSuggestRef.current.contains(e.target as Node)) {
        setShowRoleSuggest(false);
      }
    }
    if (showLocSuggest || showRoleSuggest) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showLocSuggest, showRoleSuggest]);

  // ===== Fuente de verdad de roles para sugerencias/nombres =====
  const rolesSource = (availableRoles?.length ?? 0) > 0 ? availableRoles : localRoles;

  // Maps de nombre
  const locNameById = useMemo(() => new Map(availableLocations.map((l) => [l.id, l.title])), [availableLocations]);
  const roleNameById = useMemo(() => new Map(rolesSource.map((r) => [r.id, r.name])), [rolesSource]);

  // Chips (ubicaciones)
  const locChips = useMemo(
    () => locIds.map((id) => ({ id, title: locNameById.get(id) ?? id })),
    [locIds, locNameById]
  );

  // Chips (roles)—si falta el nombre en el catálogo actual, cae al que venga en employee.roleNames
  const roleChips = useMemo(() => {
    const fromEmployee = new Map<string, string>();
    if (employee?.roleIds && employee?.roleNames) {
      employee.roleIds.forEach((id, i) => {
        const nm = employee.roleNames![i];
        if (id && nm) fromEmployee.set(String(id), String(nm));
      });
    }
    return roleIds.map((id) => ({
      id,
      name: roleNameById.get(id) ?? fromEmployee.get(id) ?? id,
    }));
  }, [roleIds, roleNameById, employee]);

  // Sugerencias
  const locSuggestions = useMemo(() => {
    const needle = locQuery.trim().toLowerCase();
    const pool = availableLocations.filter((l) => !locIds.includes(l.id));
    if (!needle) return pool.slice(0, 8);
    return pool
      .filter((l) => l.title.toLowerCase().includes(needle) || l.id.toLowerCase().includes(needle))
      .slice(0, 10);
  }, [availableLocations, locIds, locQuery]);

  const roleSuggestions = useMemo(() => {
    const needle = roleQuery.trim().toLowerCase();
    const pool = rolesSource.filter((r) => !roleIds.includes(r.id));
    if (!needle) return pool.slice(0, 8);
    return pool
      .filter((r) => r.name.toLowerCase().includes(needle) || r.id.toLowerCase().includes(needle))
      .slice(0, 10);
  }, [rolesSource, roleIds, roleQuery]);

  // Mutadores
  function addLoc(id: string) {
    if (!locIds.includes(id)) setLocIds((prev) => [...prev, id]);
    setLocQuery("");
    setShowLocSuggest(false);
  }
  function removeLoc(id: string) {
    setLocIds((prev) => prev.filter((x) => x !== id));
  }
  function addRole(id: string) {
    if (!roleIds.includes(id)) setRoleIds((prev) => [...prev, id]);
    setRoleQuery("");
    setShowRoleSuggest(false);
  }
  function removeRole(id: string) {
    setRoleIds((prev) => prev.filter((x) => x !== id));
  }

  // Guardar
  async function handleSave() {
    if (!employee) return;
    setErrorMsg(null);
    setSaving(true);
    try {
      const payload = {
        id: employee.id,
        name: name.trim(),
        active,
        locationIds: Array.from(new Set(locIds)),
        roleIds: Array.from(new Set(roleIds)),
      };

      const res = await fetch("/api/calendar/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status < 200 || res.status >= 300) {
        let txt = "";
        try {
          txt = await res.text();
        } catch {}
        setErrorMsg(`No se pudo guardar (HTTP ${res.status}${txt ? `: ${txt}` : ""})`);
        return;
      }

      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Error desconocido al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar empleado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {errorMsg && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Nombre */}
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" />
          </div>

          {/* Estado */}
          <div className="flex items-center justify-between">
            <Label>Activo</Label>
            <Switch checked={active} onCheckedChange={(v: boolean) => setActive(v)} />
          </div>

          {/* Ubicaciones */}
          <div>
            <Label>Ubicaciones asignadas</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {locChips.length === 0 && <span className="text-xs text-muted-foreground">Sin ubicaciones</span>}
              {locChips.map((chip) => (
                <span
                  key={chip.id}
                  className="group inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs"
                  title={chip.title}
                >
                  {chip.title}
                  <button
                    className="opacity-60 group-hover:opacity-100 hover:text-destructive transition"
                    onClick={() => removeLoc(chip.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="relative mt-3" ref={locSuggestRef}>
              <Input
                placeholder="Añadir ubicación…"
                value={locQuery}
                onChange={(e) => {
                  setLocQuery(e.target.value);
                  setShowLocSuggest(true);
                }}
                onFocus={() => setShowLocSuggest(true)}
              />
              {showLocSuggest && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow max-h-64 overflow-auto">
                  {locSuggestions.length > 0 ? (
                    locSuggestions.map((s) => (
                      <button
                        key={s.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => addLoc(s.id)}
                      >
                        {s.title}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Roles */}
          <div>
            <Label>Roles asignados</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {roleChips.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  {loadingRoles ? "Cargando roles…" : "Sin roles"}
                </span>
              )}
              {roleChips.map((chip) => (
                <span
                  key={chip.id}
                  className="group inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs"
                  title={chip.name}
                >
                  {chip.name}
                  <button
                    className="opacity-60 group-hover:opacity-100 hover:text-destructive transition"
                    onClick={() => removeRole(chip.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="relative mt-3" ref={roleSuggestRef}>
              <Input
                placeholder={loadingRoles ? "Cargando roles…" : "Añadir rol…"}
                value={roleQuery}
                onChange={(e) => {
                  setRoleQuery(e.target.value);
                  setShowRoleSuggest(true);
                }}
                onFocus={() => setShowRoleSuggest(true)}
                disabled={loadingRoles}
              />

              {showRoleSuggest && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow max-h-64 overflow-auto">
                  {roleSuggestions.length > 0 ? (
                    roleSuggestions.map((r) => (
                      <button
                        key={r.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => addRole(r.id)}
                      >
                        {r.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {loadingRoles ? "Cargando…" : "Sin resultados"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
