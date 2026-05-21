// app/api/slots/offers/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

type OfferInput = {
  serviceName?: string;
  price?: number;
  position?: number;
};

type Body = {
  slotId?: string;
  offers?: OfferInput[];
};

function normalizePrice(value: unknown): number | null {
  if (typeof value !== "number") {
    return null;
  }

  if (Number.isNaN(value)) {
    return null;
  }

  if (value < 0) {
    return null;
  }

  return value;
}

function toCents(price: number): number {
  return Math.round(price * 100);
}

export async function POST(req: NextRequest) {
  try {
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

    const body = (await req.json()) as Body;

    const slotId = body.slotId?.trim();
    const offers = Array.isArray(body.offers) ? body.offers : [];

    if (!slotId) {
      return NextResponse.json(
        { ok: false, error: "slotId_required" },
        { status: 400 }
      );
    }

    if (offers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "offers_required" },
        { status: 400 }
      );
    }

    const slot = await prisma.slot_recovery_slot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        company_id: true,
        location_id: true,
      },
    });

    if (!slot) {
      return NextResponse.json(
        { ok: false, error: "slot_not_found" },
        { status: 404 }
      );
    }

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";

    if (!isAdmin) {
      const membership = await prisma.userCompany.findFirst({
        where: {
          userId: user.id,
          companyId: slot.company_id,
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

    const normalized: Array<{
      serviceName: string;
      price: number;
      priceCents: number;
      position: number;
    }> = [];

    for (let i = 0; i < offers.length; i += 1) {
      const raw = offers[i];

      const serviceName = raw?.serviceName?.trim();
      const price = normalizePrice(raw?.price);
      const position =
        typeof raw?.position === "number" && raw.position >= 0
          ? raw.position
          : i;

      if (!serviceName) {
        return NextResponse.json(
          { ok: false, error: "service_name_required" },
          { status: 400 }
        );
      }

      if (price === null) {
        return NextResponse.json(
          { ok: false, error: "price_invalid" },
          { status: 400 }
        );
      }

      normalized.push({
        serviceName,
        price,
        priceCents: toCents(price),
        position,
      });
    }

    const created = await prisma.$transaction(async (tx) => {
      const createdOffers = [];

      for (const offer of normalized) {
        const service = await tx.service.findFirst({
          where: {
            locationId: slot.location_id,
            name: {
              equals: offer.serviceName,
              mode: "insensitive",
            },
            active: true,
          },
          select: { id: true },
        });

        const createdOffer = await tx.slot_recovery_slot_offer.create({
          data: {
            slot_recovery_slot_id: slot.id,
            slot_recovery_service_id: service ? service.id : null,
            service_name: offer.serviceName,
            price_cents: offer.priceCents,
            price: offer.price,
            position: offer.position,
            is_selected: offer.position === 0,
          },
        });

        createdOffers.push(createdOffer);
      }

      return createdOffers;
    });

    return NextResponse.json({
      ok: true,
      offers: created.map((offer: any) => ({
        id: offer.id,
        serviceName: offer.service_name,
        price: offer.price,
        position: offer.position,
        isSelected: offer.is_selected,
      })),
    });
  } catch (error) {
    console.error("[POST /api/slots/offers/create]", error);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}