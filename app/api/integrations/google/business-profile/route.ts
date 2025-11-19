// app/api/integrations/google/business-profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated", connected: false },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const provider = "google-business";

    const ext = await prisma.externalConnection.findFirst({
      where: {
        userId,
        provider,
      },
    });

    const connected = !!ext;

    return NextResponse.json(
      {
        ok: true,
        connected,
        // Por si te interesa debugar:
        externalConnectionId: ext?.id ?? null,
        accountEmail: ext?.accountEmail ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[google-business][status] Error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", connected: false },
      { status: 500 }
    );
  }
}
