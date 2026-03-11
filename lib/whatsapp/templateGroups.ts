// app/lib/whatsapp/templateGroups.ts
export type TemplateGroupKey =
  | "confirmacion_cita"
  | "solicitud_resena"
  | "recordatorio_cita"
  | "post_cita"
  | "otros";

export type QuickAction = {
  key: TemplateGroupKey;
  label: string;
  hint?: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  { key: "confirmacion_cita", label: "Confirmación cita" },
  { key: "solicitud_resena", label: "Solicitud reseña" },
  { key: "recordatorio_cita", label: "Recordatorio cita" },
  { key: "post_cita", label: "¿Cómo ha ido la cita?" },
];

export function inferTemplateGroupKey(templateName: string): TemplateGroupKey {
  const n = (templateName || "").toLowerCase().trim();

  // NUEVOS (si algún día migras nombres)
  if (n.startsWith("confirmacion_cita_")) return "confirmacion_cita";
  if (n.startsWith("solicitud_resena_")) return "solicitud_resena";
  if (n.startsWith("recordatorio_cita_")) return "recordatorio_cita";
  if (n.startsWith("post_cita_")) return "post_cita";

  // LEGACY (tus datos actuales)
  if (n.startsWith("appointment_confirmation_")) return "confirmacion_cita";
  if (n.startsWith("ask_review_")) return "solicitud_resena";
  if (n.startsWith("appointment_reminder_")) return "recordatorio_cita";
  if (n.startsWith("appointment_followup_")) return "post_cita";

  return "otros";
}