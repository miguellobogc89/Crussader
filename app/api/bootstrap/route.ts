// app/api/bootstrap/route.ts
import { NextResponse } from "next/server";
import { getBootstrapData } from "@/lib/bootstrap";

export async function GET() {
  try {
    const data = await getBootstrapData();
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    const status = err?.status ?? 500;
    const message = err?.message ?? "bootstrap_failed";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
