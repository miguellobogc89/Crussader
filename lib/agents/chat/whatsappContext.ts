// lib/agents/chat/whatsappContext.ts
export function buildWhatsappSystemContext(args: {
  board: unknown | null;
  whatsappDisplayName?: string | null;
}): string {
  const parts: string[] = [];

  // 1) Contexto factual (board)
  if (args.board) {
    parts.push(
      [
        "CONTEXT (FUENTE DE VERDAD, NO INVENTAR):",
        "- company + locations + knowledge (public) en JSON.",
        "- Si la respuesta está en knowledge.sections[].content, úsala.",
        "JSON:",
        JSON.stringify(args.board).slice(0, 12000),
      ].join("\n")
    );
  }

  // 2) Policy de conversación (genérica, escalable, sin frases hardcodeadas)
  parts.push(
    [
      "POLICY (conversación natural, canal WhatsApp):",
      "- No repitas saludo en cada mensaje.",
      "- No uses el nombre del cliente salvo que exista en el contexto como customer verificado.",
      "- El display name de WhatsApp NO es identidad verificada; no lo uses para personalizar.",
      "- No recomiendes 'escribir por WhatsApp' dentro de WhatsApp.",
      "- Para agendar cita: pregunta una cosa por turno y usa la información ya dada por el usuario.",
      "- Si el usuario da fecha/hora concreta, pasa a confirmar y pide solo el dato faltante.",
      "- Evita añadir info extra no solicitada (precios, promociones, teléfonos) salvo que el usuario lo pida.",
    ].join("\n")
  );

  // 3) Display name (solo como pista no verificada)
  const dn = (args.whatsappDisplayName ?? "").trim();
  if (dn) {
    parts.push(`WHATSAPP_CONTACT_DISPLAY_NAME (NO VERIFICADO): ${dn}`);
  }

  return parts.filter(Boolean).join("\n\n");
}