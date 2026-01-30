// app/components/calendar/resources/shift/ShiftList.tsx
"use client";

import { CalendarClock, Briefcase, Plus } from "lucide-react";
import CollapsibleSection from "@/app/components/calendar/resources/CollapsibleSection";
import { useEffect, useState } from "react";

export type ShiftKind = "WORK" | "VACATION" | "SICK" | "CLEAR";

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
  SICK: "Baja",
  CLEAR: "Libre (borrar)",
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
  onCreateCustomShift,
}: {
  collapsed: boolean;
  value: ShiftTypeValue;
  onChange: (v: ShiftTypeValue) => void;
  templates: ShiftTemplateLite[];
  disabled: boolean;
  maxHeight?: number;

  /** Paso 2 lo conectamos al modal */
  onCreateCustomShift?: () => void;
}) {
  const absenceKinds: ShiftKind[] = ["VACATION", "SICK", "CLEAR"];
  const count = 1 + absenceKinds.length + (templates?.length ?? 0);

  function isSelectedKind(k: ShiftKind) {
    if (value.type !== "kind") return false;
    return value.kind === k;
  }

  function isSelectedTemplate(id: string) {
    if (value.type !== "template") return false;
    return value.templateId === id;
  }

  const selectedWork = isSelectedKind("WORK");

  // ✅ acordeón: trabajo vs ausencias
  const [openWork, setOpenWork] = useState(true);
  const [openAbsences, setOpenAbsences] = useState(true);

  useEffect(() => {
    // cuando el panel lateral está colapsado, no tiene sentido mantener estados
    if (collapsed) return;
  }, [collapsed]);

  function toggleWork() {
    const next = !openWork;
    setOpenWork(next);
    if (next) setOpenAbsences(false);
  }

  function toggleAbsences() {
    const next = !openAbsences;
    setOpenAbsences(next);
    if (next) setOpenWork(false);
  }

  return (
    <div>
      <CollapsibleSection
        collapsedPanel={collapsed}
        icon={<CalendarClock className="h-4 w-4 text-primary" />}
        title="Tipo de turno"
        count={count}
        showAdd={false}
      >
        <div
          className="space-y-2 pr-1"
          style={{ maxHeight: `${maxHeight}px`, overflow: "auto" }}
        >
          {disabled && (
            <p className="px-2 py-1 text-sm text-muted-foreground">
              Selecciona una ubicación.
            </p>
          )}

          {/* ===== WORK ===== */}
<CollapsibleSection
  collapsedPanel={collapsed}
  icon={<Briefcase className="h-4 w-4 text-primary" />}
  title={KIND_LABEL.WORK}
  count={1 + (templates?.length ?? 0)}
  open={openWork}
  onOpenChange={(v) => {
    setOpenWork(v);
    if (v) setOpenAbsences(false);
  }}
  onAdd={
    !disabled && !collapsed && onCreateCustomShift
      ? onCreateCustomShift
      : undefined
  }
  showAdd={!disabled && !collapsed}
>

            {/* item "Trabajo estándar" */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ type: "kind", kind: "WORK" })}
              className={[
                "group w-full flex items-center justify-between rounded-md px-2 py-1 text-left transition",
                disabled ? "opacity-50 cursor-not-allowed" : "",
                selectedWork ? "bg-primary/10" : "hover:bg-muted/60",
              ].join(" ")}
              title="Trabajo estándar"
            >
              <div className="min-w-0">
                <div className="truncate text-sm">Trabajo (estándar)</div>
                <div className="text-[11px] text-muted-foreground">
                  Turno estándar
                </div>
              </div>
            </button>

            {/* templates dentro de WORK */}
            {templates && templates.length > 0 && (
              <div className="pt-2">
                <div className="px-2 py-1 text-[11px] text-muted-foreground">
                  Personalizados
                </div>

                <div className="space-y-1">
                  {templates.map((t) => {
                    const selected = isSelectedTemplate(t.id);
                    const subtitle = `${minsToHHMM(t.startMin)}–${minsToHHMM(
                      t.endMin
                    )}`;

                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          onChange({ type: "template", templateId: t.id })
                        }
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
              </div>
            )}
          </CollapsibleSection>

          {!collapsed && <div className="h-px bg-border" />}

          {/* ===== AUSENCIAS ===== */}
<CollapsibleSection
  collapsedPanel={collapsed}
  icon={<Plus className="h-4 w-4 text-primary" />}
  title="Ausencias"
  count={absenceKinds.length}
  showAdd={false}
  open={openAbsences}
  onOpenChange={(v) => {
    setOpenAbsences(v);
    if (v) setOpenWork(false);
  }}
>

            {absenceKinds.map((k) => {
              const selected = isSelectedKind(k);

              return (
                <button
                  key={k}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ type: "kind", kind: k })}
                  className={[
                    "group w-full flex items-center justify-between rounded-md px-2 py-1 text-left transition",
                    disabled ? "opacity-50 cursor-not-allowed" : "",
                    selected ? "bg-primary/10" : "hover:bg-muted/60",
                  ].join(" ")}
                  title={KIND_LABEL[k]}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">{KIND_LABEL[k]}</div>
                  </div>
                </button>
              );
            })}
          </CollapsibleSection>

          {/* ✅ Botones acordeón (sin tocar el estilo del header del CollapsibleSection) */}
          {!collapsed ? (
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => {
                  toggleWork();
                  // forzamos el header a reflejarlo recreando el componente
                  // (CollapsibleSection es interno; esto es un toggle externo)
                }}
              >
                {openWork ? "Cerrar Trabajo" : "Abrir Trabajo"}
              </button>
              <span className="text-[11px] text-muted-foreground">·</span>
              <button
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => {
                  toggleAbsences();
                }}
              >
                {openAbsences ? "Cerrar Ausencias" : "Abrir Ausencias"}
              </button>
            </div>
          ) : null}
        </div>
      </CollapsibleSection>
    </div>
  );
}
