// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { created_at: "desc" },
      take: 50, // ajustable según necesidad
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[GET /notifications]", error);
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 });
  }
}
