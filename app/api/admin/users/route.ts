// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseIntSafe(v: string | null, def: number) {
  const n = Number(v ?? def);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const uq = searchParams.get("uq") || "";
    const upage = parseIntSafe(searchParams.get("upage"), 1);

    // page size: 10 por defecto; permitir 10/20/50
    const allowed = new Set([10, 20, 50]);
    const takeRaw = parseIntSafe(searchParams.get("take"), 10);
    const take = allowed.has(takeRaw) ? takeRaw : 10;

    const page = Math.max(1, upage || 1);
    const skip = (page - 1) * take;

    const where = uq
      ? {
          OR: [
            { name: { contains: uq, mode: "insensitive" as const } },
            { email: { contains: uq, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          isActive: true,
          isSuspended: true,
          lastLoginAt: true,
          lastSeenAt: true,
          loginCount: true,
          failedLoginCount: true,
          createdAt: true,
        },
        skip,
        take,
      }),
    ]);

    const pages = Math.max(1, Math.ceil(total / take));

    return NextResponse.json({ ok: true, total, users, page, pages, pageSize: take });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
