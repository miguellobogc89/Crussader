// app/components/calendar/resources/shift/CreateShiftTemplateModal.tsx
"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Separator } from "@/app/components/ui/separator";

type TimeMode = "range" | "duration";
type BreakMode = "break_minutes" | "break_range";

function minsFromHHMM(v: string) {
  const parts = v.split(":");
  if (parts.length !== 2) return 0;
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
  if (hh < 0 || hh > 23) return 0;
  if (mm < 0 || mm > 59) return 0;
  return hh * 60 + mm;
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  const x = Math.floor(n);
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

export type CreateShiftTemplateDraft = {
  name: string;

  timeMode: TimeMode;
  startHHMM: string;
  endHHMM: string;
  durationHours: number;
  durationMinutes: number;

  hasBreak: boolean;
  breakMode: BreakMode;
  breakMinutes: number;
  breakStartHHMM: string;
  breakEndHHMM: string;
};

export default function CreateShiftTemplateModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (draft: CreateShiftTemplateDraft) => void;
}) {
  const [name, setName] = useState("");

  const [timeMode, setTimeMode] = useState<TimeMode>("range");
  const [startHHMM, setStartHHMM] = useState("09:00");
  const [endHHMM, setEndHHMM] = useState("17:00");
  const [durationHours, setDurationHours] = useState(8);
  const [durationMinutes, setDurationMinutes] = useState(0);

  const [hasBreak, setHasBreak] = useState(false);
  const [breakMode, setBreakMode] = useState<BreakMode>("break_minutes");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [breakStartHHMM, setBreakStartHHMM] = useState("13:30");
  const [breakEndHHMM, setBreakEndHHMM] = useState("14:00");

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;

    if (timeMode === "range") {
      const s = minsFromHHMM(startHHMM);
      const e = minsFromHHMM(endHHMM);
      if (s === e) return false;
    } else {
      const total = clampInt(durationHours, 0, 23) * 60 + clampInt(durationMinutes, 0, 59);
      if (total <= 0) return false;
    }

    if (hasBreak) {
      if (breakMode === "break_minutes") {
        if (clampInt(breakMinutes, 0, 240) <= 0) return false;
      } else {
        const bs = minsFromHHMM(breakStartHHMM);
        const be = minsFromHHMM(breakEndHHMM);
        if (bs === be) return false;
      }
    }

    return true;
  }, [
    name,
    timeMode,
    startHHMM,
    endHHMM,
    durationHours,
    durationMinutes,
    hasBreak,
    breakMode,
    breakMinutes,
    breakStartHHMM,
    breakEndHHMM,
  ]);

  function submit() {
    if (!canSubmit) return;

    onSubmit({
      name: name.trim(),

      timeMode,
      startHHMM,
      endHHMM,
      durationHours: clampInt(durationHours, 0, 23),
      durationMinutes: clampInt(durationMinutes, 0, 59),

      hasBreak,
      breakMode,
      breakMinutes: clampInt(breakMinutes, 0, 240),
      breakStartHHMM,
      breakEndHHMM,
    });

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Crear turno personalizado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Turno Mañana, Turno Tarde, Turno completo..."
              className="h-9 rounded-xl"
            />
          </div>

          <Separator />

          {/* Horario */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Horario</div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={timeMode === "range" ? "secondary" : "ghost"}
                  className="h-8 rounded-xl px-3 text-xs"
                  onClick={() => setTimeMode("range")}
                >
                  Inicio/fin
                </Button>
                <Button
                  type="button"
                  variant={timeMode === "duration" ? "secondary" : "ghost"}
                  className="h-8 rounded-xl px-3 text-xs"
                  onClick={() => setTimeMode("duration")}
                >
                  Duración
                </Button>
              </div>
            </div>

            {timeMode === "range" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Inicio</Label>
                  <Input
                    type="time"
                    value={startHHMM}
                    onChange={(e) => setStartHHMM(e.target.value)}
                    className="h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Fin</Label>
                  <Input
                    type="time"
                    value={endHHMM}
                    onChange={(e) => setEndHHMM(e.target.value)}
                    className="h-9 rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Horas</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Minutos</Label>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="h-9 rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Descanso */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Descanso</div>
                <div className="text-[11px] text-muted-foreground">
                  Opcional (para turnos con pausa)
                </div>
              </div>

              <Switch checked={hasBreak} onCheckedChange={setHasBreak} />
            </div>

            {hasBreak ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={breakMode === "break_minutes" ? "secondary" : "ghost"}
                    className="h-8 rounded-xl px-3 text-xs"
                    onClick={() => setBreakMode("break_minutes")}
                  >
                    Duración
                  </Button>
                  <Button
                    type="button"
                    variant={breakMode === "break_range" ? "secondary" : "ghost"}
                    className="h-8 rounded-xl px-3 text-xs"
                    onClick={() => setBreakMode("break_range")}
                  >
                    Inicio/fin
                  </Button>
                </div>

                {breakMode === "break_minutes" ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Minutos de descanso</Label>
                    <Input
                      type="number"
                      min={0}
                      max={240}
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(Number(e.target.value))}
                      className="h-9 rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Inicio descanso</Label>
                      <Input
                        type="time"
                        value={breakStartHHMM}
                        onChange={(e) => setBreakStartHHMM(e.target.value)}
                        className="h-9 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Fin descanso</Label>
                      <Input
                        type="time"
                        value={breakEndHHMM}
                        onChange={(e) => setBreakEndHHMM(e.target.value)}
                        className="h-9 rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-9 rounded-xl"
              disabled={!canSubmit}
              onClick={submit}
            >
              Crear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
