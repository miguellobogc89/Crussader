// app/api/admin/users/[id]/related/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

// (opcional) mismo guardado que usas en otros endpoints
async function requireSystemAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Response("UNAUTHORIZED", { status: 401 });
  }
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me || me.role !== "system_admin") {
    throw new Response("FORBIDDEN", { status: 403 });
  }
  return me;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSystemAdmin(); // si no quieres auth ahora, comenta esta línea
    const userId = params.id;

    // Empresas vinculadas (UserCompany → Company)
    const companiesRaw = await prisma.userCompany.findMany({
      where: { userId },
      select: {
        Company: {
          select: {
            id: true,
            name: true,
            plan: true,
            createdAt: true,
          },
        },
      },
    });
    const companies = companiesRaw.map((c) => c.Company);

    // Ubicaciones vinculadas (UserLocation → Location)
    const locationsRaw = await prisma.userLocation.findMany({
      where: { userId },
      select: {
        location: {
          select: {
            id: true,
            title: true,
            city: true,
            region: true,
            country: true,
            createdAt: true,
          },
        },
      },
    });
    const locations = locationsRaw.map((l) => l.location);

    return NextResponse.json({ ok: true, companies, locations });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { ok: false, error: e?.message ?? "RELATED_ERROR" },
      { status: 500 },
    );
  }
}
