import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No auth" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "no_user" }, { status: 404 });
    }

    // Busca la conexión de Google Business para este usuario
    const conn = await prisma.externalConnection.findFirst({
      where: { userId: user.id, provider: "google-business" },
    });

    if (!conn?.access_token) {
      return NextResponse.json({ ok: false, error: "Sin conexión" }, { status: 400 });
    }

    const r = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: { Authorization: `Bearer ${conn.access_token}` },
    });

    const data = await r.json();
    return NextResponse.json({ ok: r.ok, status: r.status, data });
  } catch (e) {
    console.error("[GET /api/google/accounts] ", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
