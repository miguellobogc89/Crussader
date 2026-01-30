// app/components/calendar/resources/employees/CreateUpdateEmployeeModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import RoleAutocomplete from "@/app/components/calendar/resources/employees/RoleAutocomplete";
import type { StaffRoleLite } from "./types";

export type CreateEmployeeMode = "create" | "edit";

export type CreateEmployeeInitialData = {
  id: string;
  name: string;
  roleText?: string;
};

export type CreateEmployeeDraft = {
  id?: string;
  name: string;
  roleText: string | null;
};

export default function CreateEmployeeModal({
  open,
  onOpenChange,
  mode,
  initialData,
  roles,
  isSaving,
  errorText,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: CreateEmployeeMode;
  initialData?: CreateEmployeeInitialData;
  roles: StaffRoleLite[];
  isSaving: boolean;
  errorText: string | null;
  onSubmit: (draft: CreateEmployeeDraft) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState("");
  const [roleText, setRoleText] = useState<string>("");

  // reset / hydrate al abrir
  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      setName(initialData.name ?? "");
      setRoleText(initialData.roleText ?? "");
      return;
    }

    setName("");
    setRoleText("");
  }, [open, mode, initialData]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    return true;
  }, [name]);

  function submit() {
    if (!canSubmit) return;

    const role = roleText.trim();

    onSubmit({
      id: mode === "edit" ? initialData?.id : undefined,
      name: name.trim(),
      roleText: role ? role : null,
    });
  }

  const title = mode === "edit" ? "Editar empleado" : "Crear empleado";
  const primaryBtn = mode === "edit" ? "Guardar" : "Crear";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ana García"
              className="h-9 rounded-xl"
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Cargo (opcional)</Label>

            <RoleAutocomplete
              roles={roles}
              value={roleText}
              onChange={setRoleText}
              disabled={isSaving}
              onEnter={submit}
              placeholder="Ej: Recepción"
            />

            <div className="text-[11px] text-muted-foreground">
              Escribe para buscar. Si no existe, se creará automáticamente.
            </div>
          </div>

          {errorText ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
              {errorText}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 pt-2">
            {mode === "edit" ? (
              <Button
                type="button"
                variant="destructive"
                className="h-9 rounded-xl"
                onClick={onDelete}
                disabled={isSaving}
              >
                Eliminar
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="h-9 rounded-xl"
                disabled={!canSubmit || isSaving}
                onClick={submit}
              >
                {isSaving ? "Guardando…" : primaryBtn}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
