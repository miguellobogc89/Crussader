// app/api/settings/user/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  // ⬇⬇ antes: .max(2048)
  image: z.string().trim().max(65535).nullable().optional(),
  locale: z.string().trim().max(10).optional(),
  timezone: z.string().trim().max(64).optional(),
  marketingOptIn: z.boolean().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  uiTheme: z.enum(["system", "light", "dark"]).optional(),
});


const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  createdAt: true,
  lastLoginAt: true,
  lastSeenAt: true,
  isActive: true,
  isSuspended: true,
  suspendedAt: true,
  suspendedReason: true,
  deactivatedAt: true,
  loginCount: true,
  failedLoginCount: true,
  onboardingStatus: true,
  locale: true,
  timezone: true,
  marketingOptIn: true,
  notes: true,
  privacyAcceptedAt: true,
  termsAcceptedAt: true,
  account_id: true,
  updatedAt: true,
  uiTheme: true,
  pendingEmail: true,
  pendingEmailTokenExpiresAt: true,
};

async function getSessionUserId() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    return { userId, sessionPresent: !!session, sessionEmail: session?.user?.email ?? null };
  } catch (e: any) {
    return {
      userId: undefined,
      sessionPresent: false,
      sessionEmail: null,
      error: e?.message || "getServerSession failed",
    };
  }
}

/* ───────────────── GET ───────────────── */
export async function GET() {
  try {
    const { userId, sessionPresent, sessionEmail, error } = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
          debug: { sessionPresent, sessionEmail, reason: error ?? "no userId in session" },
        },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Not found", debug: { userId } },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: user }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Internal error (GET)", debug: e?.message || String(e) },
      { status: 500 },
    );
  }
}

/* ───────────────── PUT ───────────────── */
export async function PUT(req: Request) {
  try {
    const { userId, sessionPresent, sessionEmail, error } = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
          debug: { sessionPresent, sessionEmail, reason: error ?? "no userId in session" },
        },
        { status: 401 },
      );
    }

    const raw = await req.text();
    let body: unknown = null;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body", debug: { raw } },
        { status: 400 },
      );
    }

    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
        ...(data.marketingOptIn !== undefined ? { marketingOptIn: data.marketingOptIn } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.uiTheme !== undefined ? { uiTheme: data.uiTheme } : {}),
      },
      select: userSelect,
    });

    return NextResponse.json({ ok: true, data: updated }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Internal error (PUT)", debug: e?.message || String(e) },
      { status: 500 },
    );
  }
}

