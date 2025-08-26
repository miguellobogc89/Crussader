import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

type TokenWithAccess = {
  accessToken?: string;
  [k: string]: unknown;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  locale?: string;
  [k: string]: unknown;
};

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const accessToken = (token as TokenWithAccess | null)?.accessToken;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated or no access token" },
      { status: 401 },
    );
  }

  const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = (await r.json()) as GoogleUserInfo;
  return NextResponse.json({ ok: r.ok, status: r.status, data });
}
