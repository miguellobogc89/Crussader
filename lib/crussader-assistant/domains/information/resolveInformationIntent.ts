// lib/crussader-assistant/domains/domains/
import { getActiveAgentCatalog } from "../../catalogs/getActiveAgentCatalog";
import { searchInternet } from "./providers/web/searchInternet";
import { fetchAndSummarizeWebPage } from "./providers/web/fetchAndSummarizeWebPage";
import { universalResponseStyler } from "../../reply/universalResponseStyler";

type PendingIntentLike = {
  requestedInstruction?: string | null;
  action?: string | null;
  product?: string | null;
  subtype?: string | null;
  collectedData?: Record<string, unknown> | null;
};

type ResolveInformationIntentArgs = {
  pendingIntent: PendingIntentLike;
  language?: string;
};

type ResolveInformationIntentResult = {
  handled: boolean;
  ok: boolean;
  botText: string;
  payload?: Record<string, unknown>;
};

function formatCapabilitiesAnswer(
  catalog: Awaited<ReturnType<typeof getActiveAgentCatalog>>
) {
  if (!catalog.length) {
    return "Ahora mismo no tengo capacidades disponibles.";
  }

  const lines: string[] = [];
  lines.push("Ahora mismo puedo ayudarte con esto:");

  for (const capability of catalog) {
    if (!capability.isVisible) {
      continue;
    }

    let line = `- ${capability.label}`;

    if (capability.description) {
      line += `: ${capability.description}`;
    }

    const activeProducts = capability.products.filter((product) => {
      return product.status === "ACTIVE";
    });

    if (activeProducts.length > 0) {
      const productNames = activeProducts
        .map((product) => {
          return product.label;
        })
        .join(", ");

      line += ` Productos: ${productNames}.`;
    }

    lines.push(line);
  }

  return lines.join("\n");
}

function isCapabilitiesIntent(pendingIntent: PendingIntentLike) {
  if (pendingIntent.requestedInstruction !== "QUERY_INFORMATION") {
    return false;
  }

  if (pendingIntent.action !== "ANSWER") {
    return false;
  }

  if (pendingIntent.subtype !== "CAPABILITIES_LIST") {
    return false;
  }

  return true;
}

function isGeneralInformationIntent(pendingIntent: PendingIntentLike) {
  if (pendingIntent.requestedInstruction !== "QUERY_INFORMATION") {
    return false;
  }

  if (pendingIntent.action === "ANSWER") {
    if (pendingIntent.subtype === "GENERAL_INFORMATION") {
      return true;
    }
  }

  if (pendingIntent.action === "QUERY") {
    if (pendingIntent.product === "INFORMATION") {
      return true;
    }
  }

  return false;
}

function buildGeneralInformationAnswer(args: {
  question: string;
  title?: string;
  description?: string;
  content?: string;
  source?: string;
  url?: string;
}) {
  const lines: string[] = [];

  if (args.title && args.source !== "wikipedia") {
    lines.push(args.title);
  }

  if (args.description) {
    lines.push(args.description);
  }

  if (args.content) {
    lines.push(args.content);
  }

  if (!args.content && !args.title) {
    lines.push(`He encontrado información sobre: ${args.question}.`);
  }

  return lines.join("\n\n");
}

function normalizeWhatsAppText(text: string) {
  let value = text.trim();

  value = value.replace(/\*\*/g, "*");
  value = value.replace(/^- /gm, "• ");

  return value;
}

export async function resolveInformationIntent(
  args: ResolveInformationIntentArgs
): Promise<ResolveInformationIntentResult> {
  const pendingIntent = args.pendingIntent;

  if (isCapabilitiesIntent(pendingIntent)) {
    const catalog = await getActiveAgentCatalog();
    const botText = formatCapabilitiesAnswer(catalog);

    return {
      handled: true,
      ok: true,
      botText,
      payload: {
        kind: "CAPABILITIES_LIST"
      }
    };
  }

  if (isGeneralInformationIntent(pendingIntent)) {
    const collectedData = pendingIntent.collectedData || {};
    const rawQuestion = collectedData.question;
    const question = String(rawQuestion || "").trim();

    if (!question) {
      return {
        handled: true,
        ok: false,
        botText: "No he entendido qué información quieres que busque.",
        payload: {
          kind: "GENERAL_INFORMATION",
          error: "Missing question"
        }
      };
    }

    const lang = String(args.language || "").trim() || "es";

    const searchResult = await searchInternet({
      query: question,
      lang
    });

    if (!searchResult.ok) {
      return {
        handled: true,
        ok: false,
        botText:
          "No he podido encontrar información fiable ahora mismo sobre eso.",
        payload: {
          kind: "GENERAL_INFORMATION",
          question,
          error: searchResult.error || "Unknown search error"
        }
      };
    }

    if (searchResult.source === "brave") {
      const candidates = Array.isArray(searchResult.items)
        ? searchResult.items
        : [];

      const urlsToTry: Array<{
        title: string;
        url: string;
        description: string;
      }> = [];

      if (searchResult.url) {
        urlsToTry.push({
          title: String(searchResult.title || "").trim(),
          url: String(searchResult.url || "").trim(),
          description: String(searchResult.description || "").trim()
        });
      }

      for (const item of candidates) {
        const itemUrl = String(item.url || "").trim();

        if (!itemUrl) {
          continue;
        }

        const alreadyIncluded = urlsToTry.some((entry) => {
          return entry.url === itemUrl;
        });

        if (alreadyIncluded) {
          continue;
        }

        urlsToTry.push({
          title: String(item.title || "").trim(),
          url: itemUrl,
          description: String(item.description || "").trim()
        });
      }

      const goodSummaries: string[] = [];
      const goodSources: string[] = [];
      let lastError = "";

      for (const candidate of urlsToTry) {
        const pageResult = await fetchAndSummarizeWebPage({
          url: candidate.url,
          title: candidate.title,
          question
        });

        if (!pageResult.ok || !pageResult.summary) {
          lastError = pageResult.error || "Web page reading failed";
          continue;
        }

        if (pageResult.answeredQuestion === false) {
          continue;
        }

        goodSummaries.push(pageResult.summary);
        goodSources.push(candidate.url);

        if (goodSummaries.length >= 3) {
          break;
        }
      }

      if (goodSummaries.length === 0) {
        return {
          handled: true,
          ok: false,
          botText:
            "He encontrado resultados sobre eso, pero no he podido leer ninguna página correctamente.",
          payload: {
            kind: "GENERAL_INFORMATION",
            question,
            source: "brave",
            url: searchResult.url || "",
            error: lastError || "No readable Brave result"
          }
        };
      }

      const combinedContent = normalizeWhatsAppText(
        goodSummaries.join("\n\n")
      );

      const styled = await universalResponseStyler({
        message: combinedContent,
        style: "friendly",
        length: "medium",
        emojis: "low",
        language: lang,
        channel: "whatsapp"
      });

      const finalText = normalizeWhatsAppText(
        String(styled.text || combinedContent).trim()
      );

      return {
        handled: true,
        ok: true,
        botText: finalText,
        payload: {
          kind: "GENERAL_INFORMATION",
          question,
          source: "brave",
          url: goodSources[0] || searchResult.url || ""
        }
      };
    }

    const wikipediaBaseText = buildGeneralInformationAnswer({
      question,
      title: searchResult.title,
      description: searchResult.description,
      content: searchResult.content,
      source: searchResult.source,
      url: searchResult.url
    });

    const cleanedWikipediaText = normalizeWhatsAppText(wikipediaBaseText);

    const styledWikipedia = await universalResponseStyler({
      message: cleanedWikipediaText,
      style: "friendly",
      length: "medium",
      emojis: "low",
      language: lang,
      channel: "whatsapp"
    });

    const botText = normalizeWhatsAppText(
      String(styledWikipedia.text || cleanedWikipediaText).trim()
    );

    return {
      handled: true,
      ok: true,
      botText,
      payload: {
        kind: "GENERAL_INFORMATION",
        question,
        source: searchResult.source || "",
        url: searchResult.url || ""
      }
    };
  }

  return {
    handled: false,
    ok: false,
    botText: ""
  };
}
