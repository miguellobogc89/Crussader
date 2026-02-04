// app/components/calendar/CalendarOnly/paintEngine.ts

export type PaintContext = {
  dayKey: string;
  hourIndex: number;
  START_HOUR: number;
  HOURS_COUNT: number;
};

export type ShiftTemplateLite = {
  id: string;
  name: string;
  startMin: number;
  endMin: number;
};

export type PaintBlock = {
  dayKey: string;
  startHourIndex: number;
  endHourIndexExclusive: number;
  employeeId: string;
  label: string;
};

function clamp(n: number, a: number, b: number) {
  if (n < a) return a;
  if (n > b) return b;
  return n;
}

export function paintTemplateBlocks(args: {
  cellId: string;
  template: ShiftTemplateLite;
  selectedEmployeeIds: string[];
  START_HOUR: number;
  HOURS_COUNT: number;
}): PaintBlock[] {
  const parts = String(args.cellId).split("|");
  const dayKey = parts[0];
  const hourIndex = Number(parts[1]);

  if (!dayKey) return [];
  if (!Number.isFinite(hourIndex)) return [];
  if (args.selectedEmployeeIds.length === 0) return [];

  const startHour = Math.floor(args.template.startMin / 60);
  const endHour = Math.ceil(args.template.endMin / 60);

  const startIndex = clamp(
    startHour - args.START_HOUR,
    0,
    args.HOURS_COUNT - 1
  );

  const endIndexExclusive = clamp(
    endHour - args.START_HOUR,
    0,
    args.HOURS_COUNT
  );

  if (endIndexExclusive <= startIndex) return [];

  return args.selectedEmployeeIds.map((employeeId) => ({
    dayKey,
    startHourIndex: startIndex,
    endHourIndexExclusive: endIndexExclusive,
    employeeId,
    label: args.template.name,
  }));
}
