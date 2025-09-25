// /app/dashboard/voiceagent/_lib/template.ts
export function computeGreeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function shortCompanyName(name: string): string {
  if (!name) return "";
  const cleaned = name
    .replace(/\bS\.?L\.?U?\.?\b/gi, "")
    .replace(/\bS\.?A\.?U?\.?\b/gi, "")
    .replace(/\bS\.?R\.?L\.?\b/gi, "")
    .replace(/\bLtd\.?\b/gi, "")
    .replace(/\bLLC\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned;
}

/** Render muy simple de {{path}} con acceso anidado (company.short, etc.) */
export function renderTemplate(tpl: string, ctx: Record<string, any>): string {
  return (tpl || "").replace(/\{\{\s*([.\w]+)\s*\}\}/g, (_m, path) => {
    const parts = String(path).split(".");
    let cur: any = ctx;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in cur) cur = cur[p];
      else return "";
    }
    return String(cur ?? "");
  });
}
