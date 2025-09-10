// app/api/dev/test-email/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const to = searchParams.get("to") || "delivered@resend.dev"; // inbox de prueba
    const url = "https://example.com/ok";
    const data = await sendVerificationEmail(to, url);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "TEST_EMAIL_ERROR" }, { status: 500 });
  }
}
