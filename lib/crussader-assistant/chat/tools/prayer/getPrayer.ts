// lib/crussader-assistant/chat/tools/prayer/getPrayer.ts
type GetPrayerArgs = {
  kind?: string;
  parts?: string[];
};

type PrayerPartItem = {
  title: string;
  reference: string;
  text: string;
  part: string;
  source: string;
};

type PrayerApiSuccess = {
  ok: true;
  source: string;
  part: string;
  title?: string;
  reference?: string;
  text?: string;
  data?: {
    primera_lectura?: {
      title: string;
      reference: string;
      text: string;
    };
    salmo?: {
      title: string;
      reference: string;
      text: string;
    };
    evangelio?: {
      title: string;
      reference: string;
      text: string;
    };
  };
};

type PrayerApiError = {
  ok: false;
  error: string;
};

type PrayerApiResponse = PrayerApiSuccess | PrayerApiError;

function normalizeKindToPart(kind: unknown): string {
  const value = String(kind || "").trim().toLowerCase();

  if (!value) {
    return "evangelio";
  }

  if (value === "all") {
    return "all";
  }

  if (value === "readings") {
    return "all";
  }

  if (value === "lecturas") {
    return "all";
  }

  if (value === "lecturas del día") {
    return "all";
  }

  if (value === "lecturas de hoy") {
    return "all";
  }

  if (value === "primera_lectura") {
    return "primera_lectura";
  }

  if (value === "primera lectura") {
    return "primera_lectura";
  }

  if (value === "lectura") {
    return "primera_lectura";
  }

  if (value === "lectura del día") {
    return "primera_lectura";
  }

  if (value === "lectura de hoy") {
    return "primera_lectura";
  }

  if (value === "first_reading") {
    return "primera_lectura";
  }

  if (value === "reading") {
    return "primera_lectura";
  }

  if (value === "primera") {
    return "primera_lectura";
  }

  if (value === "salmo") {
    return "salmo";
  }

  if (value === "salmo responsorial") {
    return "salmo";
  }

  if (value === "psalm") {
    return "salmo";
  }

  if (value === "gospel") {
    return "evangelio";
  }

  if (value === "evangelio") {
    return "evangelio";
  }

  if (value === "evangelio del día") {
    return "evangelio";
  }

  if (value === "evangelio de hoy") {
    return "evangelio";
  }

  if (value === "today") {
    return "evangelio";
  }

  if (value === "prayer") {
    return "evangelio";
  }

  return "evangelio";
}

function uniqueParts(parts: string[]): string[] {
  const result: string[] = [];

  for (const rawPart of parts) {
    const normalized = normalizeKindToPart(rawPart);

    if (!result.includes(normalized)) {
      result.push(normalized);
    }
  }

  return result;
}

async function fetchPrayerPart(part: string): Promise<PrayerApiSuccess> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL");
  }

  const url =
    baseUrl +
    `/api/crussader-assistant/integrations/prayer/daily?part=${encodeURIComponent(part)}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  let data: PrayerApiResponse;

  try {
    data = (await response.json()) as PrayerApiResponse;
  } catch {
    throw new Error("Invalid prayer response");
  }

  if (!response.ok) {
    if ("error" in data) {
      throw new Error(data.error);
    }

    throw new Error("Prayer endpoint failed");
  }

  if (!data.ok) {
    throw new Error(data.error);
  }

  return data;
}

function mapSinglePartResponse(data: PrayerApiSuccess): PrayerPartItem {
  return {
    title: String(data.title || "").trim(),
    reference: String(data.reference || "").trim(),
    text: String(data.text || "").trim(),
    part: String(data.part || "").trim(),
    source: String(data.source || "").trim(),
  };
}

export async function getPrayer(args: GetPrayerArgs = {}) {
  const requestedPartsRaw: string[] = [];

  if (Array.isArray(args.parts)) {
    for (const part of args.parts) {
      requestedPartsRaw.push(String(part || "").trim());
    }
  }

  if (requestedPartsRaw.length === 0 && args.kind) {
    requestedPartsRaw.push(String(args.kind).trim());
  }

  if (requestedPartsRaw.length === 0) {
    requestedPartsRaw.push("evangelio");
  }

  const requestedParts = uniqueParts(requestedPartsRaw);

  if (requestedParts.length === 1 && requestedParts[0] === "all") {
    const data = await fetchPrayerPart("all");

    return {
      ok: true,
      item: {
        title: "Lecturas del día",
        part: "all",
        data: data.data,
      },
    };
  }

  const items: PrayerPartItem[] = [];

  for (const part of requestedParts) {
    if (part === "all") {
      const data = await fetchPrayerPart("all");

      if (data.data?.primera_lectura) {
        items.push({
          title: String(data.data.primera_lectura.title || "").trim(),
          reference: String(data.data.primera_lectura.reference || "").trim(),
          text: String(data.data.primera_lectura.text || "").trim(),
          part: "primera_lectura",
          source: String(data.source || "").trim(),
        });
      }

      if (data.data?.salmo) {
        items.push({
          title: String(data.data.salmo.title || "").trim(),
          reference: String(data.data.salmo.reference || "").trim(),
          text: String(data.data.salmo.text || "").trim(),
          part: "salmo",
          source: String(data.source || "").trim(),
        });
      }

      if (data.data?.evangelio) {
        items.push({
          title: String(data.data.evangelio.title || "").trim(),
          reference: String(data.data.evangelio.reference || "").trim(),
          text: String(data.data.evangelio.text || "").trim(),
          part: "evangelio",
          source: String(data.source || "").trim(),
        });
      }

      continue;
    }

    const data = await fetchPrayerPart(part);
    items.push(mapSinglePartResponse(data));
  }

  if (items.length === 1) {
    return {
      ok: true,
      item: items[0],
      items,
    };
  }

  return {
    ok: true,
    items,
  };
}