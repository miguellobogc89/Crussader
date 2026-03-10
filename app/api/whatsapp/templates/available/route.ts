// app/api/whatsapp/templates/available/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const category = searchParams.get("category");
    const useType = searchParams.get("useType");
    const language = searchParams.get("language");

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId_required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";

    if (!isAdmin) {
      const membership = await prisma.userCompany.findFirst({
        where: {
          userId: user.id,
          companyId,
        },
        select: { id: true },
      });

      if (!membership) {
        return NextResponse.json(
          { ok: false, error: "forbidden" },
          { status: 403 }
        );
      }
    }

    const where: {
      status: "approved";
      OR: Array<
        | { scope: "public" }
        | { scope: "private"; company_id: string }
      >;
      category?: "marketing" | "utility" | "authentication";
      use_type?: "start_conversation" | "within_24h";
      language?: string;
    } = {
      status: "approved",
      OR: [
        { scope: "public" },
        { scope: "private", company_id: companyId },
      ],
    };

    if (
      category === "marketing" ||
      category === "utility" ||
      category === "authentication"
    ) {
      where.category = category;
    }

    if (
      useType === "start_conversation" ||
      useType === "within_24h"
    ) {
      where.use_type = useType;
    }

    if (language && language.trim()) {
      where.language = language.trim();
    }

    const items = await prisma.whatsapp_template.findMany({
      where,
      select: {
        id: true,
        company_id: true,
        scope: true,
        template_name: true,
        title: true,
        status: true,
        category: true,
        language: true,
        use_type: true,
        body_preview: true,
        updated_at: true,
        is_favorite: true,
        favorite_at: true,
      },
      orderBy: [
        { scope: "asc" },
        { is_favorite: "desc" },
        { updated_at: "desc" },
      ],
    });

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (err) {
    console.error("[GET /api/whatsapp/templates/available]", err);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}