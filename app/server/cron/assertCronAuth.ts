import { NextRequest } from "next/server";

export function assertCronAuth(
  req: NextRequest,
  expectedSecret: string | undefined,
) {
  if (!expectedSecret) {
    throw new Error("CRON secret no configurado");
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expectedSecret}`) {
    throw new Error("unauthorized");
  }
}
