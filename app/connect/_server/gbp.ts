// app/connect/_server/gbp.ts
export type FetchTextResult = {
  ok: boolean;
  status: number;
  url: string;
  text: string;
  json: any;
};

export function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function head(text: string, n: number) {
  if (!text) return "";
  if (text.length <= n) return text;
  return text.slice(0, n);
}

export async function fetchText(url: string, accessToken: string): Promise<FetchTextResult> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const text = await res.text().catch(() => "");
  const json = safeJsonParse(text);

  return {
    ok: res.ok,
    status: res.status,
    url,
    text,
    json,
  };
}

export async function exchangeCodeForTokens(args: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  const { code, clientId, clientSecret, redirectUri } = args;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenText = await tokenRes.text().catch(() => "");
  const tokenJson = safeJsonParse(tokenText);

  return {
    ok: tokenRes.ok,
    status: tokenRes.status,
    text: tokenText,
    json: tokenJson,
    accessToken: typeof tokenJson?.access_token === "string" ? (tokenJson.access_token as string) : null,
    refreshToken:
      typeof tokenJson?.refresh_token === "string" ? (tokenJson.refresh_token as string) : null,
    expiresIn: typeof tokenJson?.expires_in === "number" ? (tokenJson.expires_in as number) : null,
  };
}

export async function getGoogleUserEmail(accessToken: string) {
  const profile = await fetchText("https://www.googleapis.com/oauth2/v2/userinfo", accessToken);
  const accountEmail = typeof profile.json?.email === "string" ? (profile.json.email as string) : null;
  return { profile, accountEmail };
}

export type GoogleAccountPick = {
  gbAccountName: string; // "accounts/...."
  gbAccountDisplayName: string | null;
  accountsCount: number;
};

export async function listAndPickFirstAccount(accessToken: string): Promise<{
  ok: boolean;
  status: number;
  error?: string;
  accountsRes: FetchTextResult;
  pick: GoogleAccountPick | null;
}> {
  const accountsRes = await fetchText(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    accessToken
  );

  if (!accountsRes.ok) {
    return { ok: false, status: accountsRes.status, error: "accounts_list_failed", accountsRes, pick: null };
  }

  const accounts: any[] = Array.isArray(accountsRes.json?.accounts) ? accountsRes.json.accounts : [];
  const accountsCount = accounts.length;

  if (accountsCount === 0) {
    return { ok: true, status: 200, error: "no_accounts", accountsRes, pick: null };
  }

  const pickedAccount = accounts[0];
  const gbAccountName =
    typeof pickedAccount?.name === "string" ? (pickedAccount.name as string) : null;

  const gbAccountDisplayName =
    typeof pickedAccount?.accountName === "string" ? (pickedAccount.accountName as string) : null;

  if (!gbAccountName) {
    return { ok: true, status: 200, error: "picked_account_missing_name", accountsRes, pick: null };
  }

  return {
    ok: true,
    status: 200,
    accountsRes,
    pick: {
      gbAccountName,
      gbAccountDisplayName,
      accountsCount,
    },
  };
}

export async function listLocations(accessToken: string, gbAccountName: string) {
  const locUrl =
    `https://mybusinessbusinessinformation.googleapis.com/v1/${gbAccountName}/locations` +
    `?readMask=name,title&` +
    `pageSize=100`;

  const locRes = await fetchText(locUrl, accessToken);

  const locations: any[] = Array.isArray(locRes.json?.locations) ? locRes.json.locations : [];

  return {
    locUrl,
    locRes,
    locations,
    locationsCount: locations.length,
  };
}
