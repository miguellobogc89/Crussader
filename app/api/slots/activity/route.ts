// app/api/slots/activity/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "Missing locationId" },
        { status: 400 }
      );
    }

    const recipients = await prisma.slot_recovery_recipient.findMany({
      where: {
        slot_recovery_slot: {
          location_id: locationId,
        },
      },
      orderBy: {
        updated_at: "desc",
      },
      take: 20,
      include: {
        Customer: {
          select: {
            firstName: true,
            preferred_name: true,
            whatsapp_name: true,
          },
        },
        slot_recovery_slot: {
          select: {
            starts_at: true,
            Location: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

const activities = recipients.map((r) => {
  const name =
    r.Customer?.preferred_name ||
    r.Customer?.whatsapp_name ||
    r.Customer?.firstName ||
    "Cliente";

  const date = new Date(r.slot_recovery_slot?.starts_at || r.updated_at);

  const day = date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });

  const time = date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let text = "";

  if (r.status === "sent") {
    text = `Invitación enviada a ${name} (${day} · ${time})`;
  } else if (r.status === "delivered") {
    text = `${name} ha recibido la oferta (${day} · ${time})`;
  } else if (r.status === "read") {
    text = `${name} ha visto la oferta`;
  } else if (r.status === "replied") {
    text = `${name} ha respondido al mensaje`;
  } else if (r.status === "booked") {
    text = `✅ ${name} ha reservado la cita (${day} · ${time})`;
  } else if (r.status === "failed") {
    text = `⚠️ Error enviando a ${name}`;
  } else {
    text = `Actividad con ${name}`;
  }

  return {
    id: r.id,
    text,
    time: r.updated_at,
    status: r.status,
  };
});

    return NextResponse.json({
      ok: true,
      items: activities,
    });
  } catch (error) {
    console.error("GET /api/slots/activity error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}