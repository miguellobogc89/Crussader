// app/server/topics/generateTopicName.ts
//
// Genera un nombre de topic a partir de un cluster de conceptos.
// Usa los conceptos representativos (previewSummaries) y datos del negocio
// para producir un nombre ESPECÍFICO, ACCIONABLE y COHERENTE con el sector.
//
// Ejemplos de salida esperada:
//  - “Precio del cucurucho percibido como alto”
//  - “Sabor del helado de pistacho muy valorado”
//  - “Demoras en el servicio entre 12:00–14:00”
//  - “Falta de opciones sin lactosa”
//  - “Amabilidad del personal muy apreciada”
//  - “Variedad de sabores insuficiente”
//

import { openai } from "../openaiClient";

export async function generateTopicName(
  cluster: {
    previewSummaries: string[];
  },
  options: {
    businessType?: string | null;
    activityName?: string | null;
  } = {},
): Promise<string> {
  const { businessType, activityName } = options;

  // Seleccionamos 2–3 summaries representativas
  const summaries = cluster.previewSummaries.slice(0, 3);
  const joinedSummaries = summaries.map((s) => `- ${s}`).join("\n");

  const sys = [
    "Eres un analista experto en tendencias de clientes.",
    "Tu misión es sintetizar varios conceptos similares en UN ÚNICO topic claro, preciso y accionable.",
    "",
    "Un buen nombre de topic debe:",
    " - Ser muy específico.",
    " - Reflejar el patrón común de los summaries.",
    " - Ser coherente con el tipo de negocio indicado.",
    " - Evitar títulos genéricos como “Buen servicio”, “Calidad general”, “Experiencia positiva”.",
    " - Evitar frases largas, máximo ~10–12 palabras.",
    " - Ser útil para tomar decisiones: precio, sabor, disponibilidad, tiempos, trato, instalaciones, resultados…",
    "",
    "Ejemplos de nombres válidos:",
    "  · “Precio del cucurucho percibido como alto”",
    "  · “Falta de opciones sin lactosa”",
    "  · “Alta valoración del helado de pistacho”",
    "  · “Demoras en el servicio en horas punta”",
    "  · “Amabilidad del personal muy apreciada”",
    "",
    "Ejemplos de nombres NO válidos:",
    "  ✘ “Buen servicio”",
    "  ✘ “Clientes contentos”",
    "  ✘ “Comentarios positivos”",
    "",
    businessType
      ? `Tipo de negocio: ${businessType}. El nombre del topic debe ajustarse a este tipo de negocio.`
      : "",
    activityName
      ? `Actividad específica: ${activityName}. El topic debe ser coherente con esta actividad.`
      : "",
    "",
    "Prohibido inventar sectores que no correspondan al tipo de negocio.",
    "Si en los summaries aparece vocabulario ajeno al sector, neutralízalo.",
    "",
    "Devuelve SOLO una frase corta, sin comillas ni explicaciones."
  ]
    .filter(Boolean)
    .join("\n");

  const user = [
    "Genera un nombre de topic representativo para este conjunto de conceptos:",
    "",
    joinedSummaries,
    "",
    "Devuelve SOLO la frase final."
  ].join("\n");

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 50,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user }
      ]
    });

    const raw = resp.choices?.[0]?.message?.content?.trim() ?? "";

    return raw.replace(/^"|"$/g, "").trim(); // por si devuelve comillas
  } catch (err) {
    console.error("generateTopicName error:", err);
    return "Topic sin nombre";
  }
}
