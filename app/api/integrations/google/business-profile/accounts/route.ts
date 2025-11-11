import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * Decodifica el JWT de NextAuth y devuelve el userId (uid) si existe.
 * Funciona con session: { strategy: "jwt" } y usa NEXTAUTH_SECRET.
 */
async function getUserIdFromJWT(): Promise<string | null> {
  try {
    const jar = await cookies();
    const token =
      jar.get("next-auth.session-token")?.value ??
      jar.get("__Secure-next-auth.session-token")?.value ??
      null;

    if (!token) return null;

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("[GBP_ACCOUNTS] Falta NEXTAUTH_SECRET");
      return null;
    }

    const decoded: any = jwt.verify(token, secret);
    return decoded?.uid ?? null;
  } catch (e) {
    console.error("[GBP_ACCOUNTS] Error al decodificar JWT:", e);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Obtener userId desde el JWT
    const userId = await getUserIdFromJWT();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
    }

    // 2️⃣ Buscar la conexión de Google Business
    const conn = await prisma.externalConnection.findFirst({
      where: { userId, provider: "google-business" },
      select: { access_token: true },
    });

    if (!conn?.access_token) {
      return NextResponse.json(
        { ok: false, error: "no_google_business_connection" },
        { status: 404 }
      );
    }

    // 3️⃣ Llamar a la API de Google Business Profile (Accounts)
    const res = await fetch("https://mybusiness.googleapis.com/v4/accounts", {
      headers: { Authorization: `Bearer ${conn.access_token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "google_api_error", details: data },
        { status: res.status }
      );
    }

    // 4️⃣ Devolver la lista de cuentas
    return NextResponse.json({
      ok: true,
      accounts: data.accounts ?? [],
      raw: data,
    });
  } catch (e) {
    console.error("[GBP_ACCOUNTS] Exception:", e);
    return NextResponse.json({ ok: false, error: "exception" }, { status: 500 });
  }
}
