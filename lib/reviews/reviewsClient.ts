// lib/reviews/reviewsClient.ts

export type ReviewForCard = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
  avatar?: string;
  businessResponse: {
    content: string;
    status: "published" | "draft";
    published?: boolean;
  } | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function mapReviewForCard(raw: unknown): ReviewForCard | null {
  if (!isRecord(raw)) return null;

  if (
    typeof raw.id !== "string" ||
    typeof raw.author !== "string" ||
    typeof raw.content !== "string" ||
    typeof raw.rating !== "number" ||
    typeof raw.date !== "string"
  ) {
    return null;
  }

  let businessResponse: ReviewForCard["businessResponse"] = null;

  if (isRecord(raw.businessResponse)) {
    const br = raw.businessResponse;
    if (
      typeof br.content === "string" &&
      (br.status === "published" || br.status === "draft")
    ) {
      businessResponse = {
        content: br.content,
        status: br.status,
      };
      if (typeof br.published === "boolean") {
        businessResponse.published = br.published;
      }
    }
  }

  return {
    id: raw.id,
    author: raw.author,
    content: raw.content,
    rating: raw.rating,
    date: raw.date,
    avatar: typeof raw.avatar === "string" ? raw.avatar : undefined,
    businessResponse,
  };
}

export async function fetchReviewsByLocation(
  locationId: string,
  signal?: AbortSignal
): Promise<ReviewForCard[]> {
  const res = await fetch(`/api/reviews?locationId=${locationId}`, {
    cache: "no-store",
    signal,
  });

  const json: unknown = await res.json();
  if (!isRecord(json) || !Array.isArray(json.reviews)) return [];

  const out: ReviewForCard[] = [];
  for (const r of json.reviews) {
    const mapped = mapReviewForCard(r);
    if (mapped) out.push(mapped);
  }

  return out;
}
