// app/server/topics/generateTopicName.ts
import { openai } from "../openaiClient";

const MODEL = "gpt-4o-mini";

type ClusterInput = {
  previewSummaries: string[];
};

type TopicContext = {
  businessType?: string | null;
  activityName?: string | null;
};

/**
 * Genera un nombre de topic NEUTRO a partir de un cluster de concepts.
 *
 * Reglas:
 * - Nombre corto (3–10 palabras).
 * - SIN juicio: no usar "positivo", "negativo", "valorado", "satisfecho",
 *   "queja", "encantado", "contento", etc.
 * - Describe el TEMA, no el SENTIMIENTO.
 * - Si hay productos/servicios concretos repetidos (sabores, platos, etc.),
 *   incluir 1–3 ejemplos entre paréntesis al final:
 *     "Sabores favoritos de los clientes (chocolate, italiano, polvito)"
 */
export async function generateTopicName(
  cluster: ClusterInput,
  context?: TopicContext,
): Promise<string> {
  const { previewSummaries } = cluster;
  const { businessType, activityName } = context ?? {};

  if (!previewSummaries || previewSummaries.length === 0) {
    return "Tema general";
  }

const sysLines = [
  "Eres un asistente experto en análisis de experiencia de cliente.",
  "Tu tarea es poner NOMBRE a un TEMA (topic) que agrupa varias opiniones de clientes.",
  "",
  "El nombre del topic debe ser NEUTRO, sin juicio.",
  "NO expreses si la opinión es buena o mala. Eso lo mostrará el dashboard.",
  "",
  "REGLA CRÍTICA (muy estricta):",
  "- PROHIBIDO mencionar productos/sabores/servicios concretos o ejemplos: nada de 'limón', 'chocolate', 'brownie', etc.",
  "- PROHIBIDO usar paréntesis con ejemplos.",
  "",
  "El nombre del topic debe caer en UNA de estas familias (elige la más adecuada):",
  "- Variedad de productos",
  "- Calidad del producto",
  "- Calidad del servicio",
  "- Precio y valor percibido",
  "- Instalaciones y limpieza",
  "- Tiempos de espera y organización",
  "- Accesibilidad",
  "",
  "Si el cluster habla de sabores o productos específicos → usa 'Calidad del producto' o 'Variedad de productos' según corresponda.",
  "Si habla de trato, atención, profesionalidad → usa 'Calidad del servicio'.",
  "Si habla de caro/barato/relación calidad-precio → usa 'Precio y valor percibido'.",
  "",
  "Devuelve SOLO el nombre exacto en una línea, sin comillas y sin punto final.",
];


  if (businessType) {
    sysLines.push(
      `Tipo de negocio: ${businessType}. Alinea el nombre del topic con este tipo de negocio.`,
    );
  }
  if (activityName) {
    sysLines.push(
      `Actividad concreta: ${activityName}. Ajusta el lenguaje al contexto de esta actividad.`,
    );
  }

  const sys = sysLines.join("\n");

  const user = [
    "Tienes un conjunto de RESÚMENES de opiniones de clientes que pertenecen al MISMO tema.",
    "Genera un único nombre de topic NEUTRO siguiendo las reglas.",
    "",
    "RESÚMENES DEL CLUSTER:",
    ...previewSummaries.map((s, i) => `- (${i + 1}) ${s}`),
    "",
    "Recuerda:",
    "- No expreses si son opiniones buenas o malas.",
    "- No uses palabras de valoración (positivo, negativo, valorado, satisfacción, etc.).",
    "- Usa un nombre corto, claro y que represente el tema.",
    "- Si procede, añade 1–3 ejemplos de productos/servicios entre paréntesis.",
    "",
    "Devuelve SOLO el nombre del topic en una única línea, sin comillas y sin punto final.",
  ].join("\n");

  try {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 80,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });

    let name = resp.choices?.[0]?.message?.content?.trim() ?? "";

    // Limpieza mínima: quitar comillas o puntos finales si los ha puesto igual.
    name = name.replace(/^["'«»]+/, "").replace(/["'«».…]+$/, "").trim();

    if (!name) {
      return "Tema general";
    }

    // Fallback de longitud por si se va de madre
    if (name.length > 120) {
      name = name.slice(0, 120).trim();
    }

    return name;
  } catch (err) {
    console.error("generateTopicName error:", err);
    return "Tema general";
  }
}
