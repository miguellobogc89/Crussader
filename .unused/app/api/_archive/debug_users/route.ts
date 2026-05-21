import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { errorMessage } from "@/lib/error-message";


const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany();

    return NextResponse.json({ ok: true, users });
  } catch (e: unknown) {
    console.error("[DEBUG users] ", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 },
    );
  }

}
