// lib/whatsapp/actions/handleUnknownTextIntent.ts

export type HandleUnknownTextIntentResult = {
  replyText: string;
};

export async function handleUnknownTextIntent(): Promise<HandleUnknownTextIntentResult> {
  return {
    replyText:
      "Este número se usa solo para gestionar reservas y cancelaciones automáticas. Para cualquier consulta, contacta directamente con el negocio.",
  };
}