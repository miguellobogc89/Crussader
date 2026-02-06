// app/components/calendar/shift-paint/ShiftPaintProvider.tsx
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { applyPaintWeekLike, type PaintBlock } from "@/app/components/calendar/calendar/shiftPaintEngine";
import type { ShiftTemplateLite, ShiftTypeValue } from "@/app/components/calendar/details/shifts/ShiftList";

const START_HOUR = 8;
const HOURS_COUNT = 12;

type ShiftPaintContextValue = {
  blocks: PaintBlock[];
  paintCell: (cellId: string) => void;

  selectedEmployeeIds: string[];
  setSelectedEmployeeIds: (ids: string[]) => void;

  shiftType: ShiftTypeValue;
  setShiftType: (v: ShiftTypeValue) => void;

  templates: ShiftTemplateLite[];
  setTemplates: (t: ShiftTemplateLite[]) => void;
};

const Ctx = createContext<ShiftPaintContextValue | null>(null);

export function useShiftPaint() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShiftPaint must be used within ShiftPaintProvider");
  return v;
}

export default function ShiftPaintProvider({
  locationId,
  children,
}: {
  locationId: string | null;
  children: React.ReactNode;
}) {
  const [blocks, setBlocks] = useState<PaintBlock[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [shiftType, setShiftType] = useState<ShiftTypeValue>({ templateId: "standard" });
  const [templates, setTemplates] = useState<ShiftTemplateLite[]>([]);

  function resolveShiftLabel(id: string) {
    if (id === "standard") return "Turno estándar";
    if (id === "abs_vacation") return "Vacaciones";
    if (id === "abs_sick") return "Baja";
    if (id === "abs_off") return "Permiso";

    const t = templates.find((x) => String(x.id) === String(id));
    if (t) return t.name;

    return "Turno";
  }

  function paintCell(cellId: string) {
    if (!locationId) return;
    if (selectedEmployeeIds.length === 0) return;

    setBlocks((prev) =>
      applyPaintWeekLike({
        prevBlocks: prev,
        cellId,
        selectedEmployeeIds,
        shiftType,
        templates,
        START_HOUR,
        HOURS_COUNT,
        resolveLabel: () => resolveShiftLabel(String(shiftType.templateId)),
      })
    );
  }

  const value = useMemo(
    () => ({
      blocks,
      paintCell,
      selectedEmployeeIds,
      setSelectedEmployeeIds,
      shiftType,
      setShiftType,
      templates,
      setTemplates,
    }),
    [blocks, selectedEmployeeIds, shiftType, templates]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
