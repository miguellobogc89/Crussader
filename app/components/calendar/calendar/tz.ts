export const TIMEZONE = "Europe/Madrid";

// Utilidades seguras de zona horaria
export function fmtParts(date: Date, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour12: false,
    ...opts,
  }).formatToParts(date);
}

export function minutesInTZ(date: Date) {
  const parts = fmtParts(date, { hour: "2-digit", minute: "2-digit" });
  const hh = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
  const mm = parseInt(parts.find(p => p.type === "minute")?.value || "0", 10);
  return hh * 60 + mm;
}

export function localKeyTZ(date: Date) {
  const parts = fmtParts(date, { year: "numeric", month: "2-digit", day: "2-digit" });
  const y = parts.find(p => p.type === "year")?.value || "0000";
  const m = parts.find(p => p.type === "month")?.value || "00";
  const d = parts.find(p => p.type === "day")?.value || "00";
  return `${y}-${m}-${d}`;
}
