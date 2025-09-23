// app/api/webchat/knowledge/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // 🔑 siteId y modo (public/private)
    const siteId = searchParams.get("siteId");
    const includePrivate = searchParams.get("private") === "true";

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Base query
    const where: any = { siteId };

    if (!includePrivate) {
      where.visibility = "PUBLIC";
    }

    const items = await prisma.knowledgeItem.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("[webchat/knowledge] error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
