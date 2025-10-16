// app/server/topics/buildTopicDescriptionPrompt.ts

export type TopicConcept = {
  id: string;
  name: string;                 // Título corto del concept (p.ej. "Teléfono ocupado mediodía")
  frequency?: number;           // Cuántas reviews agrupa (si lo tienes)
  previewSnippets?: string[];   // Ejemplos breves (frases de reviews)
};

export type TopicDescriptionInput = {
  topicName: string;            // Nombre final del topic (p.ej. "Atención telefónica")
  concepts: TopicConcept[];     // Concepts ya asignados a este topic
  totalReviewsInTopic?: number; // Opcional: total de reviews en el topic
  locationName?: string;        // Opcional: nombre de la sede/ubicación
  companyName?: string;         // Opcional: nombre de la empresa
};

/**
 * Construye los mensajes (Chat) para que la IA redacte una descripción breve, clara y accionable del topic.
 * Estilo: responde a “¿por qué pasa <topicName>?” con un resumen basado en los concepts y sus evidencias.
 */
export function buildTopicDescriptionMessages(input: TopicDescriptionInput) {
  const {
    topicName,
    concepts,
    totalReviewsInTopic,
    locationName,
    companyName,
  } = input;

  // Preparamos un bloque compacto de evidencias
  const conceptLines = concepts.map((c, idx) => {
    const n = typeof c.frequency === "number" ? ` — ${c.frequency} menc.` : "";
    const examples = Array.isArray(c.previewSnippets) && c.previewSnippets.length > 0
      ? `\n    Ejemplos: ${c.previewSnippets.slice(0, 3).map(s => `“${s}”`).join(" · ")}`
      : "";
    return `${idx + 1}. ${c.name}${n}${examples}`;
  });

  const headerBits = [
    companyName ? `Empresa: ${companyName}` : null,
    locationName ? `Ubicación: ${locationName}` : null,
    typeof totalReviewsInTopic === "number" ? `Reviews en el topic: ${totalReviewsInTopic}` : null,
  ].filter(Boolean);

  const contextHeader = headerBits.length > 0 ? headerBits.join(" — ") : "Contexto: N/D";

  const system = `
Eres un analista de opiniones de clientes. Redactas descripciones breves y claras (1–3 frases)
que expliquen EL PORQUÉ del tema detectado, citando los patrones más frecuentes y accionables.
Hablas SIEMPRE en español, en tono profesional y conciso. Evita adornos.
No inventes: resume SOLO lo que las evidencias sugieren.
Si hay horarios/días explícitos (ej. “mediodía”), destácalos.
Si la causa es hipótesis fuerte por volumen de menciones, indícalo como “lo más habitual/lo predominante”.
`.trim();

  const user = `
${contextHeader}
Topic: ${topicName}

Conceptos y evidencias:
${conceptLines.length > 0 ? conceptLines.map(l => `- ${l}`).join("\n") : "- (sin evidencias registradas)"}

Instrucciones de estilo:
- 1 a 3 frases máximo.
- Usa formulaciones como: “lo más habitual”, “predomina”, “la mayoría de menciones apuntan a…”.
`.trim();

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ] as const;
}

/**
 * (Opcional) Helper puro: dado un “caller” de IA (inyectado), devuelve el texto final.
 * Úsalo si ya tienes un provider genérico. Mantiene desacople del proveedor.
 */
export async function composeTopicDescription<TCaller extends (messages: { role: "system"|"user"|"assistant"; content: string; }[]) => Promise<string>>(
  input: TopicDescriptionInput,
  callLLM: TCaller
): Promise<string> {
  const messages = buildTopicDescriptionMessages(input);
  const text = await callLLM(messages as any);
  // Normaliza a una sola línea limpia sin perder puntos.
  return text.replace(/\s+\n/g, "\n").trim();
}
