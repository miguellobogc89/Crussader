import type { TemplateId, TemplateInput } from "../types";

export const templates: Record<TemplateId, (i: TemplateInput) => string> = {
  "default-v1": (i) => {
    const lang = i.lang === "en" ? "English" : "Spanish";
    const persona =
      i.tone === "formal"
        ? "un tono formal, respetuoso y profesional"
        : i.tone === "cercano"
        ? "un tono cercano, cálido y humano"
        : "un tono cordial y profesional";

    const name = i.reviewerName ? `- Autor: ${i.reviewerName}\n` : "";
    const comment = i.comment ? `- Comentario: """${i.comment}"""\n` : "- Comentario: (sin texto)\n";

    return [
      `Eres un assistant que redacta RESPUESTAS a reseñas públicas de clientes para el perfil de empresa.`,
      `Objetivo: contestar en 3-6 frases, con empatía y utilidad. Idioma: ${lang}. Usa ${persona}.`,
      `Nunca inventes datos, ni compartas PII, ni ofrezcas compensaciones.`,
      `Ajusta el mensaje a las estrellas: <=2 disculpa + canal privado; 3 agradece feedback; >=4 agradece y refuerza puntos fuertes.`,
      ``,
      `Datos de la reseña:`,
      `- Estrellas: ${i.rating}/5`,
      name + comment,
      `Responde ahora.`,
    ].join("\n");
  },

  "breve-v1": (i) =>
    `Escribe una respuesta muy breve en ${i.lang === "en" ? "English" : "Spanish"} con tono ${i.tone}. ` +
    `Estrellas: ${i.rating}/5. Comentario: ${i.comment ?? "(sin texto)"}.`,

  "disculpas-v1": (i) =>
    `Redacta disculpa sincera (2-4 frases) y ofrece contacto privado. Idioma: ${
      i.lang === "en" ? "English" : "Spanish"
    }. Comentario: ${i.comment ?? "(sin texto)"}.`,
};
