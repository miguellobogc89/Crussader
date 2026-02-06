// app/components/calendar/ShiftTypeSelect.tsx
"use client";

import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

export type ShiftKind = "WORK" | "VACATION" | "OFF" | "SICK" | "HOLIDAY" | "OTHER";

export type ShiftTemplateLite = {
  id: string;
  name: string;
  startMin: number;
  endMin: number;
  kind: ShiftKind; // por ahora WORK, pero escalable
};

export type ShiftTypeValue =
  | { type: "kind"; kind: ShiftKind }
  | { type: "template"; templateId: string };

function fmtMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

function encodeValue(v: ShiftTypeValue) {
  if (v.type === "kind") return `kind:${v.kind}`;
  return `tpl:${v.templateId}`;
}

function decodeValue(s: string): ShiftTypeValue {
  if (s.startsWith("kind:")) return { type: "kind", kind: s.slice(5) as ShiftKind };
  if (s.startsWith("tpl:")) return { type: "template", templateId: s.slice(4) };
  return { type: "kind", kind: "WORK" };
}

export default function ShiftTypeSelect({
  value,
  onChange,
  templates,
  disabled,
}: {
  value: ShiftTypeValue;
  onChange: (v: ShiftTypeValue) => void;
  templates: ShiftTemplateLite[];
  disabled?: boolean;
}) {
  const selectValue = useMemo(() => encodeValue(value), [value]);

  return (
    <Select
      value={selectValue}
      onValueChange={(v) => onChange(decodeValue(v))}
      disabled={!!disabled}
    >
      <SelectTrigger className="h-8 w-[260px]">
        <SelectValue placeholder="Tipo de turno" />
      </SelectTrigger>

      <SelectContent>
        <div className="px-2 py-1.5 text-xs text-muted-foreground">Estándar</div>
        {(["WORK", "VACATION", "OFF", "SICK", "HOLIDAY", "OTHER"] as ShiftKind[]).map((k) => (
          <SelectItem key={k} value={`kind:${k}`}>
            {k}
          </SelectItem>
        ))}

        <div className="px-2 py-1.5 text-xs text-muted-foreground mt-2">Plantillas</div>
        {templates.length === 0 ? (
          <div className="px-2 py-2 text-xs text-muted-foreground">Sin plantillas</div>
        ) : (
          templates.map((t) => (
            <SelectItem key={t.id} value={`tpl:${t.id}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate">{t.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {fmtMin(t.startMin)}–{fmtMin(t.endMin)}
                </span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
