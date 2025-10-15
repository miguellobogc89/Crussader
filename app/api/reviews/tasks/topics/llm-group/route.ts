// app/api/reviews/tasks/topics/llm-group/route.ts
// ===================================================
// GET con query-params para poder ejecutar desde el navegador:
//   - Abrir para ayuda:
//       /api/reviews/tasks/topics/llm-group
//   - Dry-run (NO escribe en DB):
//       /api/reviews/tasks/topics/llm-group?run=1&dryRun=1&limit=200&includeAssigned=0
//   - Persistir (SÍ escribe en DB):
//       /api/reviews/tasks/topics/llm-group?run=1&dryRun=0&limit=200&includeAssigned=0
//
// Nota: POST sigue funcionando si lo usas desde la app.
// ===================================================

import { NextResponse } from "next/server";
import { llmGroupConcepts } from "@/app/server/topics/llmCluster";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const run = url.searchParams.get("run");

  if (!run) {
    return NextResponse.json({
      ok: true,
      hint: "Añade ?run=1 para ejecutar. Ejemplos: ?run=1&dryRun=1 (preview) | ?run=1&dryRun=0 (persistir)",
      examples: {
        dryRun: "/api/reviews/tasks/topics/llm-group?run=1&dryRun=1&limit=200&includeAssigned=0",
        persist: "/api/reviews/tasks/topics/llm-group?run=1&dryRun=0&limit=200&includeAssigned=0",
      },
      params: {
        dryRun: "1|0 (default 1)",
        limit: "número (default 200)",
        includeAssigned: "1|0 (default 0 = solo concepts sin topic)",
      },
    });
  }

  const dryRun = url.searchParams.get("dryRun") !== "0"; // default true
  const limitStr = url.searchParams.get("limit");
  const includeAssigned = url.searchParams.get("includeAssigned") === "1";
  const limit = limitStr ? Math.max(1, Math.min(1000, Number(limitStr))) : undefined;

  try {
    const result = await llmGroupConcepts({ limit, includeAssigned, dryRun });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "llm-group failed" },
      { status: 500 }
    );
  }
}

// (Opcional) POST sigue disponible para llamadas desde la UI/app
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = typeof body?.limit === "number" ? body.limit : undefined;
    const includeAssigned = !!body?.includeAssigned;
    const dryRun = body?.dryRun !== false;

    const result = await llmGroupConcepts({ limit, includeAssigned, dryRun });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "llm-group failed" },
      { status: 500 }
    );
  }
}
