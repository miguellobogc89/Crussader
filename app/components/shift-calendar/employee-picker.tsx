// app/components/shift-calendar/employee-picker.tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Users, Plus } from "lucide-react";

export type Employee = {
  id: string;
  name: string;
  color?: string | null;
  active: boolean;
};

export default function EmployeePicker({
  items,
  selectedIds,
  onToggle,
  onCreate,

  // ✅ NUEVO
  jobTitles,
  jobTitlesStatusText,
}: {
  items: Employee[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (payload: { name: string; jobTitle: string | null }) => void | Promise<void>;

  jobTitles: string[];
  jobTitlesStatusText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [name, setName] = useState("");

  // cargo
  const [jobMode, setJobMode] = useState<"pick" | "new">("pick");
  const [pickedJobTitle, setPickedJobTitle] = useState<string>("");
  const [newJobTitle, setNewJobTitle] = useState<string>("");

  const selectedCount = selectedIds.length;

  const label = useMemo(() => {
    if (selectedCount === 0) return "Empleados";
    if (selectedCount === 1) return "1 seleccionado";
    return `${selectedCount} seleccionados`;
  }, [selectedCount]);

  function resetCreateForm() {
    setName("");
    setJobMode("pick");
    setPickedJobTitle("");
    setNewJobTitle("");
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            <Users className="h-4 w-4 text-slate-500" />
            <div className="text-sm font-semibold text-slate-800">{label}</div>
            {selectedCount > 0 ? (
              <Badge className="h-6 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">
                {selectedCount}
              </Badge>
            ) : null}
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[320px] p-2">
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <div className="text-xs font-semibold text-slate-600">Empleados</div>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-xl px-2"
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-1 max-h-[320px] overflow-auto">
            {items.length === 0 ? (
              <div className="px-2 py-3 text-sm text-slate-500">
                Sin empleados.
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {items.map((e) => {
                  const selected = selectedIds.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onToggle(e.id)}
                      className={[
                        "w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition",
                        selected
                          ? "border-violet-300 bg-violet-50"
                          : "border-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                      title={e.id}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-block h-3 w-3 rounded-full shrink-0"
                          style={{ background: e.color || "#999" }}
                        />
                        <span className="truncate text-sm text-slate-800">
                          {e.name}
                        </span>
                      </div>

                      {selected ? (
                        <Badge className="h-6 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">
                          Sel.
                        </Badge>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v);
          if (!v) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo empleado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-600">Nombre</div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Ana García"
              />
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-600">Cargo</div>
                {jobTitlesStatusText ? (
                  <div className="text-[11px] text-slate-500">{jobTitlesStatusText}</div>
                ) : null}
              </div>

              {jobMode === "pick" ? (
                <div className="space-y-2">
                  <Select
                    value={pickedJobTitle}
                    onValueChange={(v) => setPickedJobTitle(v)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecciona cargo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTitles.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          No hay cargos aún
                        </SelectItem>
                      ) : (
                        jobTitles.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl"
                    onClick={() => {
                      setJobMode("new");
                      setNewJobTitle("");
                    }}
                  >
                    + Nuevo cargo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="Ej. Recepción"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl"
                    onClick={() => {
                      setJobMode("pick");
                      setPickedJobTitle("");
                    }}
                  >
                    Volver a lista
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              onClick={async () => {
                const trimmedName = name.trim();
                if (!trimmedName) return;

                let jobTitle: string | null = null;

                if (jobMode === "pick") {
                  const v = pickedJobTitle.trim();
                  if (v && v !== "__none") jobTitle = v;
                } else {
                  const v = newJobTitle.trim();
                  if (v) jobTitle = v;
                }

                await onCreate({ name: trimmedName, jobTitle });
                setCreateOpen(false);
              }}
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
