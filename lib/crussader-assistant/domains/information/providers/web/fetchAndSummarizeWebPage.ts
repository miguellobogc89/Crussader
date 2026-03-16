// lib/crussader-assistant/domains/information/providers/web/fetchAndSummarizeWebPage.ts
import { openai } from "@/lib/ai";

type FetchAndSummarizeWebPageArgs = {
  url: string;
  title?: string;
  question: string;
};

type FetchAndSummarizeWebPageResult = {
  ok: boolean;
  summary?: string;
  extractedText?: string;
  answeredQuestion?: boolean;
  error?: string;
};

function stripHtml(html: string) {
  let text = html;

  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  text = text.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ");
  text = text.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ");

  text = text.replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|li|br)>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");

  text = text.replace(/&nbsp;/gi, " ");
  text = text.replace(/&amp;/gi, "&");
  text = text.replace(/&quot;/gi, "\"");
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&lt;/gi, "<");
  text = text.replace(/&gt;/gi, ">");

  text = text.replace(/\r/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/[ \t]{2,}/g, " ");

  return text.trim();
}

function extractRelevantHtml(html: string) {
  const candidates = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<body[^>]*>([\s\S]*?)<\/body>/i
  ];

  for (const pattern of candidates) {
    const match = html.match(pattern);

    if (match && typeof match[1] === "string" && match[1].trim() !== "") {
      return match[1];
    }
  }

  return html;
}

function trimTextToReasonableSize(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return text;
  }

  const sliced = text.slice(0, maxChars);

  const lastSentence = Math.max(
    sliced.lastIndexOf(". "),
    sliced.lastIndexOf("! "),
    sliced.lastIndexOf("? "),
    sliced.lastIndexOf("\n")
  );

  if (lastSentence > 1000) {
    return sliced.slice(0, lastSentence + 1).trim();
  }

  return sliced.trim();
}

async function summarizeText(args: {
  question: string;
  title?: string;
  url: string;
  content: string;
}) {
const systemPrompt = [
  "Eres un asistente que lee páginas web y responde preguntas del usuario.",
  "Debes encontrar dentro del texto cualquier explicación o definición relevante.",
  "Aunque la explicación esté más abajo en el contenido, debes usarla.",
  "Responde en español claro y sencillo.",
  "No inventes información que no esté en el texto.",
  "No menciones HTML, scraping ni procesos internos.",
  "Resume y explica el concepto con tus propias palabras."
].join(" ");

  const userPrompt = [
    `Pregunta del usuario: ${args.question}`,
    args.title ? `Título de la página: ${args.title}` : "",
    `URL: ${args.url}`,
    "",
    "Contenido extraído de la página:",
    args.content,
    "",
    "Redacta una respuesta breve y clara para el usuario a partir del contenido real de la página."
  ]
    .filter(Boolean)
    .join("\n");

  const response = await openai.responses.create({
    model: process.env.AI_MODEL || "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ]
  });

  const summary = response.output_text?.trim();

  if (!summary) {
    throw new Error("Empty summary");
  }

  return summary;
}

export async function fetchAndSummarizeWebPage(
  args: FetchAndSummarizeWebPageArgs
): Promise<FetchAndSummarizeWebPageResult> {
  const url = String(args.url || "").trim();
  const question = String(args.question || "").trim();
  const title = String(args.title || "").trim();

  if (!url) {
    return {
      ok: false,
      error: "Missing url"
    };
  }

  if (!question) {
    return {
      ok: false,
      error: "Missing question"
    };
  }

  try {
    console.log("[web][fetch:start]", {
      url,
      question,
      title
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html,application/xhtml+xml"
      },
      cache: "no-store"
    });

    console.log("[web][fetch:response]", {
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get("content-type")
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Web page fetch failed: ${response.status}`
      };
    }

    const html = await response.text();

    console.log("[web][fetch:html]", {
      length: html.length,
      preview: html.slice(0, 300)
    });

    const relevantHtml = extractRelevantHtml(html);
    const cleanText = stripHtml(relevantHtml);
    const trimmedText = trimTextToReasonableSize(cleanText, 12000);

    console.log("[web][extract]", {
      relevantLength: relevantHtml.length,
      cleanLength: cleanText.length,
      trimmedLength: trimmedText.length,
      trimmedPreview: trimmedText.slice(0, 500)
    });

    if (!trimmedText) {
      return {
        ok: false,
        error: "Empty extracted text"
      };
    }

    console.log("[web][summary:start]");

    const summary = await summarizeText({
      question,
      title,
      url,
      content: trimmedText
    });

    const normalizedSummary = summary.toLowerCase();

const answeredQuestion =
  !normalizedSummary.includes("no veo ninguna definición") &&
  !normalizedSummary.includes("no veo una definición") &&
  !normalizedSummary.includes("no responde a la pregunta") &&
  !normalizedSummary.includes("no responde bien a la pregunta") &&
  !normalizedSummary.includes("si puedes compartir más contenido") &&
  !normalizedSummary.includes("si puedes compartir más") &&
  !normalizedSummary.includes("estaré encantado de ayudarte mejor") &&
  !normalizedSummary.includes("no encuentro información suficiente");

    console.log("[web][summary:done]", {
      length: summary.length,
      preview: summary.slice(0, 300)
    });

    return {
      ok: true,
      summary,
      extractedText: trimmedText,
      answeredQuestion
    };
  } catch (error) {
    console.log("[web][error]", error);

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}