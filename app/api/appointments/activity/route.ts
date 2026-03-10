// app/api/appointment/activity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

type ActivityItemType =
  | "appointment_created"
  | "appointment_cancelled"
  | "appointment_completed"
  | "whatsapp_sent"
  | "review_received"
  | "review_replied";

type ActivityItem = {
  id: string;
  type: ActivityItemType;
  title: string;
  description: string;
  createdAt: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

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

    const [
      createdAppointments,
      cancelledAppointments,
      completedAppointments,
      whatsappMessages,
      reviews,
      responses,
    ] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          location: {
            companyId,
          },
        },
        select: {
          id: true,
          createdAt: true,
          customerName: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),

      prisma.appointment.findMany({
        where: {
          location: {
            companyId,
          },
          status: "CANCELLED",
        },
        select: {
          id: true,
          updatedAt: true,
          customerName: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
      }),

      prisma.appointment.findMany({
        where: {
          location: {
            companyId,
          },
          status: "COMPLETED",
        },
        select: {
          id: true,
          updatedAt: true,
          customerName: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
      }),

      prisma.messaging_message.findMany({
        where: {
          direction: "outbound",
          messaging_conversation: {
            integration_installation: {
              company_id: companyId,
            },
          },
        },
        select: {
          id: true,
          text: true,
          created_at: true,
          messaging_conversation: {
            select: {
              contact_name: true,
              contact_phone_e164: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        take: 10,
      }),

      prisma.review.findMany({
        where: {
          companyId,
        },
        select: {
          id: true,
          ingestedAt: true,
          reviewerName: true,
          rating: true,
        },
        orderBy: {
          ingestedAt: "desc",
        },
        take: 10,
      }),

      prisma.response.findMany({
        where: {
          review: {
            companyId,
          },
          published: true,
        },
        select: {
          id: true,
          publishedAt: true,
          createdAt: true,
          review: {
            select: {
              reviewerName: true,
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: 10,
      }),
    ]);

    const activity: ActivityItem[] = [];

    for (const item of createdAppointments) {
      activity.push({
        id: `appointment_created_${item.id}`,
        type: "appointment_created",
        title: "Cita creada",
        description: buildAppointmentDescription(item.customerName),
        createdAt: item.createdAt.toISOString(),
      });
    }

    for (const item of cancelledAppointments) {
      activity.push({
        id: `appointment_cancelled_${item.id}`,
        type: "appointment_cancelled",
        title: "Cita cancelada",
        description: buildAppointmentDescription(item.customerName),
        createdAt: item.updatedAt.toISOString(),
      });
    }

    for (const item of completedAppointments) {
      activity.push({
        id: `appointment_completed_${item.id}`,
        type: "appointment_completed",
        title: "Cita completada",
        description: buildAppointmentDescription(item.customerName),
        createdAt: item.updatedAt.toISOString(),
      });
    }

    for (const item of whatsappMessages) {
      const contactName = item.messaging_conversation?.contact_name;
      const contactPhone = item.messaging_conversation?.contact_phone_e164;

      activity.push({
        id: `whatsapp_sent_${item.id}`,
        type: "whatsapp_sent",
        title: "WhatsApp enviado",
        description: buildWhatsappDescription(contactName, contactPhone),
        createdAt: item.created_at.toISOString(),
      });
    }

    for (const item of reviews) {
      activity.push({
        id: `review_received_${item.id}`,
        type: "review_received",
        title: "Reseña recibida",
        description: buildReviewDescription(item.reviewerName, item.rating),
        createdAt: item.ingestedAt.toISOString(),
      });
    }

    for (const item of responses) {
      let eventDate = item.createdAt;

      if (item.publishedAt) {
        eventDate = item.publishedAt;
      }

      activity.push({
        id: `review_replied_${item.id}`,
        type: "review_replied",
        title: "Reseña respondida",
        description: buildReplyDescription(item.review?.reviewerName),
        createdAt: eventDate.toISOString(),
      });
    }

    activity.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      ok: true,
      activity: activity.slice(0, 20),
    });
  } catch (error) {
    console.error("[GET /api/appointment/activity]", error);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}

function buildAppointmentDescription(customerName: string | null) {
  if (customerName && customerName.trim()) {
    return customerName;
  }

  return "Cliente sin nombre";
}

function buildWhatsappDescription(
  contactName: string | null,
  contactPhone: string | null
) {
  if (contactName && contactName.trim()) {
    return contactName;
  }

  if (contactPhone && contactPhone.trim()) {
    return contactPhone;
  }

  return "Contacto sin identificar";
}

function buildReviewDescription(
  reviewerName: string | null,
  rating: number
) {
  let base = "Nueva reseña";

  if (reviewerName && reviewerName.trim()) {
    base = reviewerName;
  }

  return `${base} · ${rating} estrellas`;
}

function buildReplyDescription(reviewerName: string | null) {
  if (reviewerName && reviewerName.trim()) {
    return reviewerName;
  }

  return "Respuesta publicada";
}