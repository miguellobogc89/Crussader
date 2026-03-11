// lib/crussader-assistant/news/filterNewsItems.ts
type NewsItem = {
  title: string;
  source: string;
  link: string;
  date: string;
  description: string;
  image: string;
};

type FilterOptions = {
  include?: string[];
  exclude?: string[];
  limit?: number;
};

type DebugRejectedItem = {
  title: string;
  reason: string;
};

type FilterResult = {
  items: NewsItem[];
  rejected: DebugRejectedItem[];
};

const DEFAULT_LOCAL_TERMS = [
  "sevilla",
  "ayuntamiento",
  "junta de andalucia",
  "andalucia",
  "triana",
  "nervion",
  "los remedios",
  "macarena",
  "cartuja",
  "san pablo",
  "sevillano",
  "sevillana",
  "provincia de sevilla",
];

const DEFAULT_EXCLUDED_TERMS = [
  "betis",
  "sevilla fc",
  "futbol",
  "liga",
  "champions",
  "madrid",
  "barcelona",
  "cristiano",
  "mbappe",
  "ibai",
  "velada",
  "boxeo",
  "deporte",
  "partido",
  "gol",
  "entrenador",
  "jugador",
  "estadio",
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildTermRegex(term: string): RegExp {
  const normalizedTerm = normalizeText(term);
  const escaped = escapeRegExp(normalizedTerm);
  return new RegExp(`(^|\\W)${escaped}(\\W|$)`, "i");
}

function findFirstMatch(text: string, terms: string[]): string {
  for (const term of terms) {
    const normalizedTerm = normalizeText(term);

    if (normalizedTerm === "") {
      continue;
    }

    const regex = buildTermRegex(normalizedTerm);

    if (regex.test(text)) {
      return normalizedTerm;
    }
  }

  return "";
}

function countMatches(text: string, terms: string[]): number {
  let count = 0;

  for (const term of terms) {
    const normalizedTerm = normalizeText(term);

    if (normalizedTerm === "") {
      continue;
    }

    const regex = buildTermRegex(normalizedTerm);

    if (regex.test(text)) {
      count += 1;
    }
  }

  return count;
}

function makeDedupKey(item: NewsItem): string {
  const title = typeof item.title === "string" ? item.title : "";
  return normalizeText(title);
}

export function filterNewsItems(
  items: NewsItem[],
  options: FilterOptions = {}
): FilterResult {
  const include = Array.isArray(options.include) ? options.include : [];
  const exclude = Array.isArray(options.exclude) ? options.exclude : [];

  let limit = 5;
  if (typeof options.limit === "number" && options.limit > 0) {
    limit = options.limit;
  }

  const finalExclude = [...DEFAULT_EXCLUDED_TERMS, ...exclude];
  const seenTitles = new Set<string>();

  const accepted: NewsItem[] = [];
  const rejected: DebugRejectedItem[] = [];

  for (const item of items) {
    const rawTitle = typeof item.title === "string" ? item.title : "";
    const rawDescription =
      typeof item.description === "string" ? item.description : "";

    const title = normalizeText(rawTitle);
    const fullText = normalizeText(`${rawTitle} ${rawDescription}`);

    if (fullText === "") {
      rejected.push({
        title: rawTitle,
        reason: "empty_text",
      });
      continue;
    }

    const matchedExclude = findFirstMatch(fullText, finalExclude);
    if (matchedExclude !== "") {
      rejected.push({
        title: rawTitle,
        reason: `excluded:${matchedExclude}`,
      });
      continue;
    }

    if (include.length > 0) {
      const includeMatches = countMatches(fullText, include);

      if (includeMatches === 0) {
        rejected.push({
          title: rawTitle,
          reason: "missing_include",
        });
        continue;
      }
    }

    const titleLocalSignals = countMatches(title, DEFAULT_LOCAL_TERMS);
    const fullLocalSignals = countMatches(fullText, DEFAULT_LOCAL_TERMS);

    const hasStrongLocalSignalInTitle = titleLocalSignals >= 1;
    const hasEnoughLocalSignalInFullText = fullLocalSignals >= 2;

    if (!hasStrongLocalSignalInTitle && !hasEnoughLocalSignalInFullText) {
      rejected.push({
        title: rawTitle,
        reason: `weak_local_signal:title=${titleLocalSignals},full=${fullLocalSignals}`,
      });
      continue;
    }

    const dedupKey = makeDedupKey(item);

    if (seenTitles.has(dedupKey)) {
      rejected.push({
        title: rawTitle,
        reason: "duplicate_title",
      });
      continue;
    }

    seenTitles.add(dedupKey);
    accepted.push(item);

    if (accepted.length >= limit) {
      break;
    }
  }

  return {
    items: accepted,
    rejected,
  };
}