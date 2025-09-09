// app/api/responses/[id]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  try {
    const updated = await db.response.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        published: true,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, response: updated }, { status: 200 });
  } catch (e: any) {
    const msg = e?.code === "P2025"
      ? "Response not found"
      : (e?.message || "Publish failed");
    const code = e?.code === "P2025" ? 404 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}
