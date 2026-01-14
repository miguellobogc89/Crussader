// app/api/connect/google-business/first-connect/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

import { head, exchangeCodeForTokens } from "@/app/connect/_server/gbp";
import { computeScenario } from "@/app/connect/_server/scenario";
import { runFirstConnectOrchestration } from "@/app/connect/_server/orchestrator";

import { prisma } from "@/app/server/db";
import { encode } from "next-auth/jwt";

export const runtime = "nodejs";

const CLIENT_ID = process.env.GOOGLE_BUSINESS_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_BUSINESS_CLIENT_SECRET!;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

const REDIRECT_URI =
  process.env.GOOGLE_BUSINESS_FIRST_CONNECT_REDIRECT_URI ||
  `${APP_URL}/api/connect/google-business/first-connect/callback`;

function redirectToConnect(
  req: NextRequest,
  params: Record<string, string | null | undefined>
) {
  const u = new URL("/connect", req.url);
  for (const k of Object.keys(params)) {
    const v = params[k];
    if (typeof v === "string" && v.length > 0) u.searchParams.set(k, v);
  }
  return NextResponse.redirect(u, 302);
}

function clearTempCookies(res: NextResponse) {
  res.cookies.set("gb_state", "", { path: "/", maxAge: 0 });
  res.cookies.set("gb_ctx", "", { path: "/", maxAge: 0 });
}

function getNextAuthSessionCookieName() {
  const isProd = process.env.NODE_ENV === "production";
  return isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

function getNextAuthSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isProd,
  };
}

async function setNextAuthSessionCookie(res: NextResponse, user: { id: string; email: string; name?: string | null; role?: any }) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing NEXTAUTH_SECRET");
  }

  // En NextAuth JWT strategy, se guarda un JWT en la cookie session-token.
  const maxAge = 60 * 60 * 24 * 30; // 30 días (ajústalo si quieres)
  const now = Math.floor(Date.now() / 1000);

  const token = {
    // Campos estándar que NextAuth usa
    sub: user.id,
    email: user.email,
    name: user.name ?? "",
    // Tus campos custom que ya consumes en callbacks jwt/session
    uid: user.id,
    role: user.role ?? "user",
    iat: now,
    exp: now + maxAge,
  };

  const jwt = await encode({ token, secret, maxAge });

  res.cookies.set(getNextAuthSessionCookieName(), jwt, {
    ...getNextAuthSessionCookieOptions(),
    maxAge,
  });
}

export async function GET(req: NextRequest) {
  console.log("[first-connect:callback] START");

  const url = new URL(req.url);

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    const scenario = computeScenario({
      oauthError,
      accountsCount: 0,
      pickedAccountOk: false,
      locationsListOk: false,
      locationsCount: 0,
    });

    const res = redirectToConnect(req, { error: oauthError, scenario });
    clearTempCookies(res);
    return res;
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    const res = redirectToConnect(req, { error: "missing_code" });
    clearTempCookies(res);
    return res;
  }

  if (!state) {
    const res = redirectToConnect(req, { error: "missing_state" });
    clearTempCookies(res);
    return res;
  }

  const cookieState = req.cookies.get("gb_state")?.value;
  if (!cookieState || cookieState !== state) {
    const res = redirectToConnect(req, { error: "bad_state" });
    clearTempCookies(res);
    return res;
  }

  // 1) code -> tokens
  const token = await exchangeCodeForTokens({
    code,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
  });

  if (!token.ok || !token.accessToken) {
    console.log("[first-connect] token exchange FAIL", token.status, head(token.text, 500));
    const res = redirectToConnect(req, { error: "token_exchange_failed" });
    clearTempCookies(res);
    return res;
  }

  // 2) Orquestador “alto nivel”
  const scope = url.searchParams.get("scope");

  const run = await runFirstConnectOrchestration({
    accessToken: token.accessToken,
    refreshToken: token.refreshToken ?? null,
    expiresIn: token.expiresIn ?? null,
    scope: scope ?? null,
  });

  // 3) scenario (solo UI)
  const scenario = computeScenario({
    accountsCount: run.accountsCount,
    pickedAccountOk: run.accountsCount > 0,
    locationsListOk: run.locationsCount >= 0,
    locationsCount: run.locationsCount,
  });

  const orchestration = run.orchestration;

  const resultCase =
    orchestration && orchestration.ok ? orchestration.case : undefined;

  const companyId =
    orchestration && orchestration.ok && "companyId" in orchestration
      ? orchestration.companyId
      : undefined;

  const companyCase =
    orchestration && orchestration.ok && "companyCase" in orchestration
      ? orchestration.companyCase
      : undefined;

  const registerError =
    run.orchestrationError ??
    (orchestration && !orchestration.ok ? orchestration.error : undefined);

  // ✅ Si la conexión fue OK y hay locations, la UX que quieres es ir a dashboard
  const hasLocations = Number.isFinite(run.locationsCount) && run.locationsCount > 0;
  const orchestrationOk = !!(orchestration && orchestration.ok);

  if (orchestrationOk && hasLocations && run.accountEmail) {
    const email = run.accountEmail.toLowerCase().trim();

    // Asegura usuario (si tu orquestador ya lo crea, esto simplemente lo “recoge”)
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      // Si aún no existía (caso raro), lo creamos para que haya sesión
      user = await prisma.user.create({
        data: {
          email,
          name: run.accountName ?? email,
          role: "user",
          isActive: true,
          isSuspended: false,
          emailVerified: new Date(),
        },
        select: { id: true, email: true, name: true, role: true },
      });
    }

    // ✅ IMPORTANTE: asocia el usuario a la company adoptada/creada (si existe)
    if (companyId) {
      await prisma.userCompany.upsert({
        where: {
          userId_companyId: { userId: user.id, companyId },
        },
        create: {
          userId: user.id,
          companyId,
          role: "MEMBER" as any,
        },
        update: {
          role: "MEMBER" as any,
        },
        select: { id: true },
      });
    }

    const dash = new URL("/dashboard/home", req.url);
    const res = NextResponse.redirect(dash, 302);

    // ✅ Crea sesión NextAuth real (cookie)
    await setNextAuthSessionCookie(res, {
      id: user.id,
      email,              // ✅ string asegurado
      name: user.name,
      role: user.role,
    });

    clearTempCookies(res);

    console.log("[first-connect:callback] DONE -> /dashboard/home", {
      email,
      userId: user.id,
      companyId,
      resultCase,
    });

    return res;
  }

  // Si no hay locations o falló algo -> volvemos a /connect con banner/debug
  const res = redirectToConnect(req, {
    status: "ok",
    scenario,
    account: run.accountEmail ?? undefined,
    accountName: run.accountName ?? undefined,
    accountsCount: String(run.accountsCount),
    locations: String(run.locationsCount),
    userCase: run.userCase,
    resultCase: resultCase,
    companyId: companyId,
    companyCase: companyCase,
    registerError: registerError ?? undefined,
  });

  clearTempCookies(res);

  console.log("[first-connect:callback] DONE -> /connect", {
    scenario,
    accountsCount: run.accountsCount,
    locationsCount: run.locationsCount,
    userCase: run.userCase,
    orchestration: run.orchestration,
    orchestrationError: run.orchestrationError,
    accountEmail: run.accountEmail,
    accountName: run.accountName,
    profileStatus: run.profileStatus,
  });

  return res;
}
