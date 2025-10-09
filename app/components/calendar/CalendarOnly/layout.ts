import { minutesInTZ } from "./tz";
import type { CalendarAppt } from "./types";

// Constantes de layout
export const MIN_PILL_PX = 28;
export const COL_GAP_PX = 6;

// Helpers
export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function posFromTimesTZ(
  startISO: string,
  endISO: string,
  START_HOUR: number,
  ROW_PX: number
) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const startMin = minutesInTZ(start);
  const endMin = minutesInTZ(end);
  const baseMin = START_HOUR * 60;

  const top = (startMin - baseMin) * (ROW_PX / 60);
  const height = Math.max((endMin - startMin) * (ROW_PX / 60), MIN_PILL_PX);
  return { top, height };
}

type LaidOut = {
  id: string;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
};

/** Calcula columnas por solape para un día y devuelve posiciones por cita. */
export function layoutDayAppts(
  appts: CalendarAppt[],
  START_HOUR: number,
  ROW_PX: number
): Map<string, LaidOut> {
  type Block = {
    id: string;
    startMin: number;
    endMin: number;
    top: number;
    height: number;
  };

  const blocks: Block[] = appts.map((a) => {
    const startMin = minutesInTZ(new Date(a.startAt));
    const endMin = Math.max(startMin + 1, minutesInTZ(new Date(a.endAt)));
    const { top, height } = posFromTimesTZ(a.startAt, a.endAt, START_HOUR, ROW_PX);
    return { id: a.id, startMin, endMin, top, height };
  });

  blocks.sort((A, B) => A.startMin - B.startMin);

  // clusterizar por solape
  type Cluster = Block[];
  const clusters: Cluster[] = [];
  let current: Cluster = [];
  let curMaxEnd = -1;

  for (const b of blocks) {
    if (current.length === 0 || b.startMin < curMaxEnd) {
      current.push(b);
      curMaxEnd = Math.max(curMaxEnd, b.endMin);
    } else {
      clusters.push(current);
      current = [b];
      curMaxEnd = b.endMin;
    }
  }
  if (current.length) clusters.push(current);

  const out = new Map<string, LaidOut>();

  for (const cluster of clusters) {
    // first-fit de columnas
    const colEnds: number[] = [];
    const colOf: Record<string, number> = {};

    for (const b of cluster) {
      let placedCol = -1;
      for (let c = 0; c < colEnds.length; c++) {
        if (b.startMin >= colEnds[c]) { placedCol = c; break; }
      }
      if (placedCol === -1) {
        placedCol = colEnds.length;
        colEnds.push(b.endMin);
      } else {
        colEnds[placedCol] = b.endMin;
      }
      colOf[b.id] = placedCol;
    }

    const totalCols = colEnds.length;
    const widthPct = 100 / totalCols;

    for (const b of cluster) {
      const col = colOf[b.id];
      const leftPct = col * widthPct;
      out.set(b.id, { id: b.id, top: b.top, height: b.height, leftPct, widthPct });
    }
  }

  return out;
}
