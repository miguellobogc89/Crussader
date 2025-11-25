import { NextRequest, NextResponse } from "next/server";
import {
  createAIResponsePreviewFromSettings,
} from "@/lib/ai/reviews/createAIResponseForReview";
import { ResponseSettingsSchema } from "@/app/schemas/response-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const starsRaw = Number(body?.stars ?? 5);
    const stars: 1 | 3 | 5 =
      starsRaw <= 1 ? 1 : starsRaw === 3 ? 3 : 5;

    const reviewText = String(body?.reviewText ?? "").trim();
    const settingsRaw = body?.settings;

    const parsed = ResponseSettingsSchema.safeParse(settingsRaw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_settings",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const settings = parsed.data;

    const { content } = await createAIResponsePreviewFromSettings({
      settings,
      rating: stars,
      comment: reviewText || "(sin comentario)",
      languageCode: settings.autoDetectLanguage ? null : settings.language ?? "es",
      reviewerName: "María García",
    });

    return NextResponse.json(
      {
        ok: true,
        text: content,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("preview-response error", e);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        detail: String(e?.message ?? e),
      },
      { status: 500 }
    );
  }
}
