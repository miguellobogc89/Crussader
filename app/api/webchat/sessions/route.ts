import { NextResponse } from "next/server";
import { prismaRaw } from "@/lib/prisma"; // usamos el cliente "limpio" que no rompe tipos

type Body = {
  key: string;           // publicKey del site (ej: "demo-public-key-123")
  visitorId: string;     // ID del visitante (guárdalo en localStorage/cookie)
  meta?: Record<string, any>; // opcional: ua, referrer, utm...
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.key || !body?.visitorId) {
      return NextResponse.json({ error: "Missing key or visitorId" }, { status: 400 });
    }

    const site = await prismaRaw.webchatSite.findUnique({
      where: { publicKey: body.key },
      select: { id: true },
    });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const now = new Date();

    // upsert por (siteId, visitorId) — requiere que en el schema exista:
    // @@unique([siteId, visitorId]) en WebchatSession
    const session = await prismaRaw.webchatSession.upsert({
      where: { siteId_visitorId: { siteId: site.id, visitorId: body.visitorId } },
      update: { lastActivityAt: now, meta: body.meta ?? undefined },
      create: {
        siteId: site.id,
        visitorId: body.visitorId,
        startedAt: now,
        lastActivityAt: now,
        meta: body.meta ?? undefined,
      },
      select: { id: true, siteId: true },
    });

    return NextResponse.json({ sessionId: session.id, siteId: session.siteId });
  } catch (e) {
    console.error("[webchat/sessions]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
