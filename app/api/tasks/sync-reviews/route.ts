import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { errorMessage } from "@/lib/error-message";
import { syncAllReviews } from "@/lib/reviews/sync";

export const runtime = "nodejs"; // para acceso a red/SDKs en cron

type AuthOK =
  | { ok: true; by: "cron" | "user" }
  | { ok: false; status: number; error: string };

async function authorize(req: NextRequest): Promise<AuthOK> {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization")?.trim();
  const headerSecret = req.headers.get("x-cron-secret")?.trim();

  // Permitir cron con secreto (Authorization: Bearer <secret> o X-Cron-Secret: <secret>)
  if (
    secret &&
    (authHeader === `Bearer ${secret}` || headerSecret === secret)
  ) {
    return { ok: true, by: "cron" };
  }

  // Permitir usuario logado (si quieres, aquí podrías filtrar por rol)
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, status: 401, error: "unauth" };

  return { ok: true, by: "user" };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    // Ejecuta la sincronización (ajusta si tu función admite filtros/ids/etc.)
    const result = await syncAllReviews();

    return NextResponse.json({
      ok: true,
      ranBy: auth.by,
      result, // ideal: que devuelva contadores/resumen
    });
  } catch (e: unknown) {
    console.error("[POST /api/tasks/sync-reviews]", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 }
    );
  }
}

// (Opcional) habilitar GET para probar en navegador
export async function GET(req: NextRequest) {
  return POST(req);
}
