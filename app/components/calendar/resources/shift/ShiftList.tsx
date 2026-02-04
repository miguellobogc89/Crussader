// app/components/calendar/resources/shift/ShiftList.tsx
"use client";

import { CalendarClock, ShieldAlert } from "lucide-react";
import CollapsibleSection from "@/app/components/calendar/resources/CollapsibleSection";

export type ShiftTemplateLite = {
  id: string;
  name: string;
  startMin?: number;
  endMin?: number;
  color?: string | null;
};

export type ShiftTypeValue = { templateId: string };

type AbsenceId = "abs_vacation" | "abs_sick" | "abs_off";

const ABSENCE_TEMPLATES: Array<ShiftTemplateLite & { id: AbsenceId }> = [
  { id: "abs_vacation", name: "Vacaciones", color: "#f59e0b" },
  { id: "abs_sick", name: "Baja", color: "#ef4444" },
  { id: "abs_off", name: "Permiso", color: "#8b5cf6" },
];

function minsToHHMM(m: number) {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function isSelectedTemplate(value: ShiftTypeValue, id: string) {
  return String(value.templateId) === String(id);
}

function isAbsenceTemplateId(id: string) {
  return id === "abs_vacation" || id === "abs_sick" || id === "abs_off";
}

export default function ShiftList({
  collapsed,
  value,
  onChange,
  templates,
  disabled,
  maxHeight = 340,
  onCreateCustomShift,
}: {
  collapsed: boolean;
  value: ShiftTypeValue;
  onChange: (v: ShiftTypeValue) => void;
  templates: ShiftTemplateLite[];
  disabled: boolean;
  maxHeight?: number;
  onCreateCustomShift?: () => void;
}) {
  const standard: ShiftTemplateLite = {
    id: "standard",
    name: "Turno estándar",
    color: null,
  };

  const shiftTemplates: ShiftTemplateLite[] = [standard, ...(templates ?? [])];

  return (
    <div className="space-y-3">
      {/* ===== TURNOS ===== */}
      <CollapsibleSection
        collapsedPanel={collapsed}
        icon={<CalendarClock className="h-4 w-4 text-primary" />}
        title="Turnos"
        count={shiftTemplates.length}
        showAdd={false}
      >
        <div
          className="space-y-1 pr-1"
          style={{ maxHeight: `${maxHeight}px`, overflow: "auto" }}
        >
          {disabled ? (
            <p className="px-2 py-1 text-sm text-muted-foreground">
              Selecciona una ubicación.
            </p>
          ) : null}

          {shiftTemplates.map((t) => {
            const selected = isSelectedTemplate(value, t.id);

            let subtitle = "Arrastra para asignar horas";
            if (typeof t.startMin === "number" && typeof t.endMin === "number") {
              subtitle = `${minsToHHMM(t.startMin)}–${minsToHHMM(t.endMin)}`;
            }

            return (
              <button
                key={t.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ templateId: t.id })}
                className={[
                  "group w-full flex items-center justify-between rounded-md px-2 py-1 text-left transition",
                  disabled ? "opacity-50 cursor-not-allowed" : "",
                  selected ? "bg-primary/10" : "hover:bg-muted/60",
                ].join(" ")}
                title={t.name}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 rounded-full ring-1 ring-border"
                    style={{ background: t.color || "#999" }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {subtitle}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            disabled={disabled || !onCreateCustomShift}
            onClick={() => {
              if (!disabled && onCreateCustomShift) onCreateCustomShift();
            }}
            className={[
              "w-full rounded-md px-2 py-2 text-left text-sm transition",
              "border border-dashed border-border",
              disabled || !onCreateCustomShift
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-muted/60",
            ].join(" ")}
            title="Añadir turno"
          >
            + Añadir turno
          </button>
        </div>
      </CollapsibleSection>

      {/* ===== AUSENCIAS (día completo) ===== */}
      <CollapsibleSection
        collapsedPanel={collapsed}
        icon={<ShieldAlert className="h-4 w-4 text-primary" />}
        title="Ausencias"
        count={ABSENCE_TEMPLATES.length}
        showAdd={false}
      >
        <div
          className="space-y-1 pr-1"
          style={{ maxHeight: `${maxHeight}px`, overflow: "auto" }}
        >
          {ABSENCE_TEMPLATES.map((t) => {
            const selected = isSelectedTemplate(value, t.id);
            const subtitle = "Día completo";

            return (
              <button
                key={t.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ templateId: t.id })}
                className={[
                  "group w-full flex items-center justify-between rounded-md px-2 py-1 text-left transition",
                  disabled ? "opacity-50 cursor-not-allowed" : "",
                  selected ? "bg-primary/10" : "hover:bg-muted/60",
                ].join(" ")}
                title={t.name}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 rounded-full ring-1 ring-border"
                    style={{ background: t.color || "#999" }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {subtitle}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CollapsibleSection>
    </div>
  );
}
