// app/api/connect/google-business/first-connect/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

import {
  head,
  exchangeCodeForTokens,
  getGoogleUserEmail,
  listAndPickFirstAccount,
  listLocations,
} from "@/app/connect/_server/gbp";

import { ensureUserByEmail } from "@/app/connect/_server/user";
import { computeScenario } from "@/app/connect/_server/scenario";
import { ensureCompanyAndGbpAccount } from "@/app/connect/_server/register/company";
import { createNewAccount } from "@/app/connect/_server/newAccount";

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

function clearCookies(res: NextResponse) {
  res.cookies.set("gb_state", "", { path: "/", maxAge: 0 });
  res.cookies.set("gb_ctx", "", { path: "/", maxAge: 0 });
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
    clearCookies(res);
    return res;
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    const res = redirectToConnect(req, { error: "missing_code" });
    clearCookies(res);
    return res;
  }

  if (!state) {
    const res = redirectToConnect(req, { error: "missing_state" });
    clearCookies(res);
    return res;
  }

  const cookieState = req.cookies.get("gb_state")?.value;
  if (!cookieState || cookieState !== state) {
    console.log("[first-connect] bad_state", { cookieState, state });
    const res = redirectToConnect(req, { error: "bad_state" });
    clearCookies(res);
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
    console.log(
      "[first-connect] token exchange FAIL",
      token.status,
      head(token.text, 500)
    );
    const res = redirectToConnect(req, { error: "token_exchange_failed" });
    clearCookies(res);
    return res;
  }

  const accessToken = token.accessToken;

  // 2) email (lead/user)
  const { profile, accountEmail } = await getGoogleUserEmail(accessToken);

  const ensuredUser = await ensureUserByEmail({
    emailRaw: accountEmail,
    profileJson: profile?.json,
  });

  const userCase = ensuredUser.ok ? ensuredUser.userCase : "UNKNOWN";
  const userId = ensuredUser.ok ? ensuredUser.userId : null;
  const userAccountId = ensuredUser.ok ? ensuredUser.accountId : null;

  // 3) accounts list + pick
  const picked = await listAndPickFirstAccount(accessToken);

  if (!picked.ok) {
    console.log(
      "[first-connect] accounts FAIL",
      picked.status,
      head(picked.accountsRes.text, 500)
    );

    const scenario = computeScenario({
      accountsCount: 0,
      pickedAccountOk: false,
      locationsListOk: false,
      locationsCount: 0,
    });

    const res = redirectToConnect(req, {
      error: "accounts_list_failed",
      scenario,
      account: accountEmail,
      userCase,
    });
    clearCookies(res);
    return res;
  }

  const accountsCount = picked.pick?.accountsCount ?? 0;

  if (!picked.pick) {
    const scenario = computeScenario({
      accountsCount,
      pickedAccountOk: false,
      locationsListOk: false,
      locationsCount: 0,
    });

    const res = redirectToConnect(req, {
      status: "ok",
      scenario,
      account: accountEmail,
      userCase,
      accountsCount: String(accountsCount),
      locations: "0",
    });
    clearCookies(res);
    return res;
  }

  const { gbAccountName, gbAccountDisplayName, pickedAccountRaw } =
    picked.pick as any;

  // 4) locations
  const loc = await listLocations(accessToken, gbAccountName);

  const locationsListOk = loc.locRes.ok;
  const locationsCount = loc.locationsCount;

  if (!locationsListOk) {
    console.log(
      "[first-connect] locations FAIL",
      loc.locRes.status,
      head(loc.locRes.text, 500)
    );

    const scenario = computeScenario({
      accountsCount,
      pickedAccountOk: true,
      locationsListOk: false,
      locationsCount: 0,
    });

    const res = redirectToConnect(req, {
      error: "locations_list_failed",
      scenario,
      account: accountEmail,
      accountName: gbAccountDisplayName,
      userCase,
      accountsCount: String(accountsCount),
    });
    clearCookies(res);
    return res;
  }

  // 5) Si hay ubicaciones, aseguramos Company + gbp_account.
  // Si el user NO tiene account_id, es un "bootstrap": newAccount crea account + todo lo demás.
  let companyCase: string | null = null;
  let companyId: string | null = null;
  let gbpAccountCaseError: string | null = null;

  console.log("[first-connect] PRE-REGISTER", {
    locationsCount,
    hasUserId: Boolean(userId),
    userId,
    userAccountId,
    gbAccountName,
    gbAccountDisplayName,
  });

if (locationsCount > 0 && userId && accountEmail) {
  try {
    if (!userAccountId) {
      const created = await createNewAccount({
        userId,
        email: accountEmail,
        googleAccountId: gbAccountName,
        googleAccountName: gbAccountDisplayName ?? null,
        pickedAccountRaw: pickedAccountRaw ?? null,
        accessToken,
        refreshToken: token.refreshToken ?? null,
        expiresIn: token.expiresIn ?? null,
        scope: url.searchParams.get("scope"),
        locations: (loc.locations || []).map((x: any) => ({
          name: x?.name,
          title: x?.title ?? null,
          raw: x,
        })),
      });

      if (created.ok) {
        companyCase = "CREATED";
        companyId = created.companyId;
      } else {
        gbpAccountCaseError = created.error;
      }
    } else {
      const ensuredCompany = await ensureCompanyAndGbpAccount({
        userId,
        userAccountId,
        googleAccountId: gbAccountName,
        googleAccountName: gbAccountDisplayName ?? null,
        pickedAccountRaw: pickedAccountRaw ?? null,
      });

      console.log("[first-connect] REGISTER-RESULT", ensuredCompany);

      if (ensuredCompany.ok) {
        companyCase = ensuredCompany.companyCase;
        companyId = ensuredCompany.companyId;
      } else {
        gbpAccountCaseError = ensuredCompany.error;
      }
    }
  } catch (e) {
    console.error("[first-connect] register flow failed", e);
    gbpAccountCaseError = "register_flow_throw";
  }
}


  const scenario = computeScenario({
    accountsCount,
    pickedAccountOk: true,
    locationsListOk: true,
    locationsCount,
  });

  const res = redirectToConnect(req, {
    status: "ok",
    scenario,
    account: accountEmail,
    accountName: gbAccountDisplayName,
    accountsCount: String(accountsCount),
    locations: String(locationsCount),
    userCase,
    companyCase: companyCase ?? undefined,
    companyId: companyId ?? undefined,
    registerError: gbpAccountCaseError ?? undefined,
  });

  clearCookies(res);

  console.log("[first-connect:callback] DONE -> /connect", {
    scenario,
    accountsCount,
    locationsCount,
    userCase,
    companyCase,
    companyId,
    registerError: gbpAccountCaseError,
    accountEmail,
    accountName: gbAccountDisplayName,
    profileStatus: profile.status,
  });

  return res;
}
