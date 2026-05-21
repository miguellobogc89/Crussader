// app/api/slots/waitlist/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeText(value: string): string {
  return value.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = normalizeText(body?.id ?? "");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.slot_waitlist_entry.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    await prisma.slot_waitlist_entry.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("POST /api/slots/waitlist/delete error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}