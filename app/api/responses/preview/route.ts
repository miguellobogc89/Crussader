// app/api/responses/preview/route.ts
import { NextResponse } from "next/server";
import { getPromptPreview } from "@/lib/ai/responseEngine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const settings = body?.settings ?? {};
    const review = body?.review ?? {};

    const content = (review?.content ?? "").toString().trim();
    if (!content) {
      return NextResponse.json(
        { ok: false, error: "missing_review_content" },
        { status: 400 }
      );
    }

    const { system, user, model, temperature, targetChars, applied } =
      getPromptPreview({ settings, review: { content, ...review } });

    return NextResponse.json({
      ok: true,
      system,
      user,
      model,
      temperature,
      targetChars,
      applied,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "preview_failed" },
      { status: 500 }
    );
  }
}
