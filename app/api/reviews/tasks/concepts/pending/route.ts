// app/api/reviews/tasks/concepts/pending/route.ts
// ===================================================
// GET /api/reviews/tasks/concepts/pending
// Devuelve cuántas reviews siguen sin conceptualizar.
// ===================================================

import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET() {
  try {
    const rows = await prisma.$queryRawUnsafe<{ pending: number }[]>(
      `
      SELECT COUNT(*)::int AS pending
      FROM review
      WHERE COALESCE(is_conceptualized, false) = false
      `
    );
    const pending = rows[0]?.pending ?? 0;
    return NextResponse.json({ ok: true, pending });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "No se pudo comprobar pendientes" },
      { status: 500 }
    );
  }
}
