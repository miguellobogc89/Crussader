// parseNaturalTime.ts
export function parseNaturalTime(text: string): string | null {
  const clean = String(text || "").toLowerCase().trim();

  const match = clean.match(/(\d{1,2})(?::(\d{1,2}))?/);

  if (match) {
    let hour = Number(match[1]);
    let minute = Number(match[2] || 0);

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      const h = String(hour).padStart(2, "0");
      const m = String(minute).padStart(2, "0");
      return `${h}:${m}`;
    }
  }

  if (clean.includes("mañana")) {
    return "08:00";
  }

  if (clean.includes("tarde")) {
    return "18:00";
  }

  if (clean.includes("noche")) {
    return "21:00";
  }

  return null;
}