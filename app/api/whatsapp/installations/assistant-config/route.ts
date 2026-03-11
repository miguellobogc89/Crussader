// app/api/whatsapp/installations/assistant-config/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  installationId: string;
  assistant: {
    mode: "single" | "multi" | "single_with_override";
    default_location_id?: string | null;
    allowed_location_ids?: string[] | null;
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;

    const installationId =
      body && typeof body.installationId === "string" ? body.installationId : "";

    if (!installationId) {
      return NextResponse.json({ ok: false, error: "installationId requerido" }, { status: 400 });
    }

    const assistant = body ? body.assistant : null;
    if (!assistant || !assistant.mode) {
      return NextResponse.json({ ok: false, error: "assistant.mode requerido" }, { status: 400 });
    }

    const installation = await prisma.integration_installation.findUnique({
      where: { id: installationId },
      select: { id: true, config: true },
    });

    if (!installation) {
      return NextResponse.json({ ok: false, error: "Installation not found" }, { status: 404 });
    }

    const currentConfig: any = installation.config ?? {};
    const nextConfig: any = { ...currentConfig };

    nextConfig.assistant = {
      ...(currentConfig.assistant ?? {}),
      mode: assistant.mode,
    };

    if (assistant.default_location_id !== undefined) {
      nextConfig.assistant.default_location_id = assistant.default_location_id;
    }

    if (assistant.allowed_location_ids !== undefined) {
      nextConfig.assistant.allowed_location_ids = assistant.allowed_location_ids;
    }

    await prisma.integration_installation.update({
      where: { id: installationId },
      data: { config: nextConfig },
    });

    return NextResponse.json({ ok: true, config: nextConfig });
  } catch (e) {
    console.error("[assistant-config] error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}