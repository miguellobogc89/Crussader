// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

function parseIntSafe(v: string | null, def: number) {
  const n = Number(v ?? def);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function parseDateOrNull(v: unknown): Date | null {
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

const ALLOWED_PAGE_SIZES = new Set([10, 20, 50]);
const ALLOWED_ROLES = new Set(["system_admin", "org_admin", "user", "test"] as const);

async function requireSystemAdmin() {
  // Reutiliza tu helper real si prefieres importarlo desde [id]/route
  // Aquí lo dejamos mínimo para listar/crear.
  // En proyectos reales, centraliza este helper.
  // Si no quieres auth aquí, comenta este bloque.
  return true;
}

// ===== GET /api/admin/users?uq=&take=&upage= =====
export async function GET(req: Request) {
  try {
    await requireSystemAdmin();
    const { searchParams } = new URL(req.url);

    const uq = searchParams.get("uq") || "";
    const upage = parseIntSafe(searchParams.get("upage"), 1);

    const takeRaw = parseIntSafe(searchParams.get("take"), 10);
    const take = ALLOWED_PAGE_SIZES.has(takeRaw) ? takeRaw : 10;

    const page = Math.max(1, upage || 1);
    const skip = (page - 1) * take;

    const where = uq
      ? {
          OR: [
            { name: { contains: uq, mode: "insensitive" as const } },
            { email: { contains: uq, mode: "insensitive" as const } },
            { phone: { contains: uq, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        // Seleccionamos campos amplios para el CRUD
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          deactivatedAt: true,
          failedLoginCount: true,
          isActive: true,
          isSuspended: true,
          suspendedAt: true,
          suspendedReason: true,
          lastLoginAt: true,
          lastSeenAt: true,
          locale: true,
          loginCount: true,
          marketingOptIn: true,
          notes: true,
          passwordHash: true, // solo para debug interno; en UI no lo muestres
          phone: true,
          privacyAcceptedAt: true,
          termsAcceptedAt: true,
          timezone: true,
        },
        skip,
        take,
      }),
    ]);

    const pages = Math.max(1, Math.ceil(total / take));

    return NextResponse.json({ ok: true, total, users, page, pages, pageSize: take });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "USERS_LIST_ERROR" }, { status: 500 });
  }
}

// ===== POST /api/admin/users  (create) =====
export async function POST(req: Request) {
  try {
    await requireSystemAdmin();
    const body = await req.json();

    // Validaciones mínimas
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email) {
      return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 400 });
    }
    const role = typeof body.role === "string" && ALLOWED_ROLES.has(body.role) ? body.role : "user";

    // Campos opcionales
    const name = typeof body.name === "string" ? body.name : null;
    const image = typeof body.image === "string" ? body.image : null;
    const phone = typeof body.phone === "string" ? body.phone : null;
    const notes = typeof body.notes === "string" ? body.notes : null;
    const locale = typeof body.locale === "string" ? body.locale : "es-ES";
    const timezone = typeof body.timezone === "string" ? body.timezone : "Europe/Madrid";
    const marketingOptIn = typeof body.marketingOptIn === "boolean" ? body.marketingOptIn : false;

    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;
    const isSuspended = typeof body.isSuspended === "boolean" ? body.isSuspended : false;
    const suspendedReason = typeof body.suspendedReason === "string" ? body.suspendedReason : null;
    const emailVerified = parseDateOrNull(body.emailVerified);
    const privacyAcceptedAt = parseDateOrNull(body.privacyAcceptedAt);
    const termsAcceptedAt = parseDateOrNull(body.termsAcceptedAt);

    // Password opcional (para pruebas de onboarding)
    let passwordHash: string | null = null;
    if (typeof body.password === "string" && body.password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(body.password, salt);
    }

    const created = await prisma.user.create({
      data: {
        email,
        role,
        name,
        image,
        phone,
        notes,
        locale,
        timezone,
        marketingOptIn,
        isActive,
        isSuspended,
        suspendedAt: isSuspended ? new Date() : null,
        suspendedReason,
        emailVerified,
        privacyAcceptedAt,
        termsAcceptedAt,
        passwordHash,
      },
      select: {
        id: true, name: true, email: true, role: true, isActive: true, isSuspended: true,
        createdAt: true, updatedAt: true, emailVerified: true, phone: true, locale: true, timezone: true,
      },
    });

    return NextResponse.json({ ok: true, user: created });
  } catch (e: any) {
    // pos. Unique email
    if (e?.code === "P2002") {
      return NextResponse.json({ ok: false, error: "EMAIL_ALREADY_EXISTS" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: e?.message ?? "CREATE_USER_ERROR" }, { status: 500 });
  }
}
