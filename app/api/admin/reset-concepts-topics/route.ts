// app/api/admin/reset-concepts-topics/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

async function resetConceptsTopics(resetReviews: boolean) {
  await prisma.$transaction(async (tx) => {
    // 1) Borra todos los topics (no dependemos de ellos para truncar concept)
    await tx.$executeRawUnsafe(`DELETE FROM topic`);

    // 2) Trunca las tablas en orden seguro (evita el FK error)
    //    Opción A: truncar ambas a la vez
    await tx.$executeRawUnsafe(`TRUNCATE TABLE review_concept, concept`);

    //    (Alternativa equivalente)
    // await tx.$executeRawUnsafe(`TRUNCATE TABLE concept CASCADE`);

    // 3) (Opcional) marcar reviews como no conceptualizadas para poder re-procesarlas
    if (resetReviews) {
      await tx.$executeRawUnsafe(
        `UPDATE review_concept_input SET is_conceptualized = false, updated_at = now()`
      );
    }
  });
}

// ✅ GET para probar desde navegador (por defecto resetReviews=false)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const resetReviews = searchParams.get("resetReviews") === "1";
    await resetConceptsTopics(resetReviews);
    return NextResponse.json({ ok: true, resetReviews });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "reset failed" }, { status: 500 });
  }
}

// ✅ POST para el botón (por defecto resetReviews=true)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const resetReviews = body?.resetReviews !== false; // default true
    await resetConceptsTopics(resetReviews);
    return NextResponse.json({ ok: true, resetReviews });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "reset failed" }, { status: 500 });
  }
}
