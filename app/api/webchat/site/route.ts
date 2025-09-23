import { NextResponse } from "next/server";
import { prismaRaw } from "@/lib/prisma"; // 👈 usamos el cliente limpio

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") || "";
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    const site = await prismaRaw.webchatSite.findUnique({
      where: { publicKey: key },
      select: {
        id: true,
        name: true,
        status: true,
        companyId: true,
        locationId: true,
        settings: true,
      },
    });

    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    return NextResponse.json({
      siteId: site.id,
      name: site.name,
      status: site.status,
      companyId: site.companyId,
      locationId: site.locationId,
      settings: site.settings ?? {},
    });
  } catch (e) {
    console.error("[webchat/site]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
