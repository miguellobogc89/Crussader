// lib/crussader-assistant/intake/analyzeUserInput.ts
type AnalyzeUserInputInput = {
  rawUserText: string;
};

type AnalyzeUserInputResult = {
  requestedNeed: string | null;
  product: string | null;
  subtype: string | null;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  data: Record<string, unknown>;
  missingFields: string[];
  entities: {
    rawDateExpressions: string[];
    rawTimeExpressions: string[];
    rawRecurrenceExpressions: string[];
    rawTopics: string[];
    rawPeople: string[];
    rawLocations: string[];
  };
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function extractDateExpressions(text: string): string[] {
  const results: string[] = [];
  const normalized = normalizeText(text);

  if (normalized.includes("hoy")) {
    results.push("hoy");
  }

  if (normalized.includes("mañana")) {
    results.push("mañana");
  }

  if (normalized.includes("manana")) {
    results.push("mañana");
  }

  if (normalized.includes("pasado mañana")) {
    results.push("pasado mañana");
  }

  if (normalized.includes("pasado manana")) {
    results.push("pasado mañana");
  }

  return results;
}

function extractTimeExpressions(text: string): string[] {
  const results: string[] = [];
  const normalized = normalizeText(text);
  const matches = normalized.match(/\b\d{1,2}(:\d{2})?\b/g);

  if (!matches) {
    return results;
  }

  for (const match of matches) {
    results.push(match);
  }

  return results;
}

function extractLocation(text: string): string | null {
  const normalized = normalizeText(text);

  const knownLocations = [
    "sevilla",
    "madrid",
    "barcelona",
    "valencia",
    "málaga",
    "malaga",
    "granada",
    "cádiz",
    "cadiz"
  ];

  for (const location of knownLocations) {
    if (normalized.includes(location)) {
      return location;
    }
  }

  return null;
}

function containsWeatherIntent(text: string): boolean {
  const normalized = normalizeText(text);

  const weatherKeywords = [
    "tiempo",
    "clima",
    "meteorología",
    "meteorologia",
    "llover",
    "lluvia",
    "temperatura"
  ];

  for (const keyword of weatherKeywords) {
    if (normalized.includes(keyword)) {
      return true;
    }
  }

  return false;
}

function containsCreateIntent(text: string): boolean {
  const normalized = normalizeText(text);

  const createKeywords = [
    "avísame",
    "avisame",
    "recuérdame",
    "recuerdame",
    "dime",
    "mándame",
    "mandame",
    "envíame",
    "enviame",
    "notifica",
    "notifícame",
    "notificame"
  ];

  for (const keyword of createKeywords) {
    if (normalized.includes(keyword)) {
      return true;
    }
  }

  return false;
}

export function analyzeUserInput(
  input: AnalyzeUserInputInput
): AnalyzeUserInputResult {
  const rawUserText = input.rawUserText;
  const normalized = normalizeText(rawUserText);

  const rawDateExpressions = extractDateExpressions(normalized);
  const rawTimeExpressions = extractTimeExpressions(normalized);
  const rawRecurrenceExpressions: string[] = [];
  const rawTopics: string[] = [];
  const rawPeople: string[] = [];
  const rawLocations: string[] = [];

  let requestedNeed: string | null = null;
  let product: string | null = null;
  let subtype: string | null = null;
  let confidence = 0.3;
  let needsClarification = false;
  let clarificationQuestion: string | null = null;
  const data: Record<string, unknown> = {};
  const missingFields: string[] = [];

  const isWeather = containsWeatherIntent(normalized);
  const isCreate = containsCreateIntent(normalized);

  if (isWeather) {
    rawTopics.push("weather");
  }

  const detectedLocation = extractLocation(normalized);
  if (detectedLocation) {
    rawLocations.push(detectedLocation);
    data.place = detectedLocation;
  }

  if (rawDateExpressions.length > 0) {
    data.date = rawDateExpressions[0];
  }

  if (rawTimeExpressions.length > 0) {
    data.time = rawTimeExpressions[0];
  }

  if (isCreate && isWeather) {
    requestedNeed = "CREATE";
    product = "EVENT";
    subtype = "WEATHER_ALERT";
    confidence = 0.88;

    if (rawTimeExpressions.length === 0) {
      needsClarification = true;
      missingFields.push("time");

      if (rawDateExpressions.length > 0) {
        clarificationQuestion =
          "¿A qué hora te gustaría recibir la notificación del tiempo " +
          String(rawDateExpressions[0]) +
          "?";
      } else {
        clarificationQuestion =
          "¿A qué hora te gustaría recibir la notificación del tiempo?";
      }
    }

    return {
      requestedNeed,
      product,
      subtype,
      confidence,
      needsClarification,
      clarificationQuestion,
      data,
      missingFields,
      entities: {
        rawDateExpressions,
        rawTimeExpressions,
        rawRecurrenceExpressions,
        rawTopics,
        rawPeople,
        rawLocations
      }
    };
  }

  return {
    requestedNeed,
    product,
    subtype,
    confidence,
    needsClarification,
    clarificationQuestion,
    data,
    missingFields,
    entities: {
      rawDateExpressions,
      rawTimeExpressions,
      rawRecurrenceExpressions,
      rawTopics,
      rawPeople,
      rawLocations
    }
  };
}
