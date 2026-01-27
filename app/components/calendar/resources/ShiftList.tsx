// app/components/calendar/ShiftList.tsx
"use client";

import { CalendarClock, Plus } from "lucide-react";
import CollapsibleSection from "@/app/components/calendar/resources/CollapsibleSection";
import { Button } from "@/app/components/ui/button";

export type ShiftKind = "WORK" | "VACATION" | "OFF" | "SICK" | "HOLIDAY" | "OTHER";

export type ShiftTemplateLite = {
  id: string;
  name: string;
  startMin: number;
  endMin: number;
  color?: string | null;
};

export type ShiftTypeValue =
  | { type: "kind"; kind: ShiftKind }
  | { type: "template"; templateId: string };

const KIND_LABEL: Record<ShiftKind, string> = {
  WORK: "Trabajo",
  VACATION: "Vacaciones",
  OFF: "Libre",
  SICK: "Baja",
  HOLIDAY: "Festivo",
  OTHER: "Otro",
};

function minsToHHMM(m: number) {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function ShiftList({
  collapsed,
  value,
  onChange,
  templates,
  disabled,
  maxHeight = 340,
  onAddTemplateMock,
}: {
  collapsed: boolean;
  value: ShiftTypeValue;
  onChange: (v: ShiftTypeValue) => void;
  templates: ShiftTemplateLite[];
  disabled: boolean;
  maxHeight?: number;

  /** mock: el + real solo vive en WORK, para crear turnos personalizados */
  onAddTemplateMock?: () => void;
}) {
  const kinds: ShiftKind[] = ["WORK", "VACATION", "OFF", "SICK", "HOLIDAY", "OTHER"];
  const count = kinds.length + (templates?.length ?? 0);

  function isSelectedKind(k: ShiftKind) {
    if (value.type !== "kind") return false;
    return value.kind === k;
  }

  function isSelectedTemplate(id: string) {
    if (value.type !== "template") return false;
    return value.templateId === id;
  }

  return (
    <div>
      <CollapsibleSection
        collapsedPanel={collapsed}
        icon={<CalendarClock className="h-4 w-4 text-primary" />}
        title="Tipo de turno"
        count={count}
        showAdd={false} // 🔒 aquí NO hay + en header
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

          {/* Kinds fijos */}
          {kinds.map((k) => {
            const selected = isSelectedKind(k);
            return (
              <div key={k} className="flex items-center gap-2">
<Button
  asChild
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  title="Crear turno personalizado"
>
  <span
    role="button"
    tabIndex={0}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      // tu handler actual aquí
      // onCreateCustomShift?.()
    }}
    onKeyDown={(e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      e.stopPropagation();
      // tu handler aquí
    }}
  >
    {/* tu icono + */}
  </span>
</Button>
              </div>
            );
          })}

          {/* Personalizados */}
          {templates && templates.length > 0 ? (
            <div className="pt-2">
              <div className="px-2 py-1 text-[11px] text-muted-foreground">
                Personalizados
              </div>
              {templates.map((t) => {
                const selected = isSelectedTemplate(t.id);
                const subtitle = `${minsToHHMM(t.startMin)}–${minsToHHMM(t.endMin)}`;

                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ type: "template", templateId: t.id })}
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
                        <div className="text-[11px] text-muted-foreground">{subtitle}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </CollapsibleSection>
    </div>
  );
}
