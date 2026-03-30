// app/api/slots/customers/database/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeText(value: string): string {
  return value.trim();
}

function getDisplayName(customer: {
  firstName: string | null;
  lastName: string | null;
  preferred_name: string | null;
  whatsapp_name: string | null;
}) {
  const preferredName = customer.preferred_name?.trim();
  if (preferredName) {
    return preferredName;
  }

  const whatsappName = customer.whatsapp_name?.trim();
  if (whatsappName) {
    return whatsappName;
  }

  const fullName = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
  if (fullName) {
    return fullName;
  }

  return "Sin nombre";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const companyId = normalizeText(searchParams.get("companyId") ?? "");
    const query = normalizeText(searchParams.get("q") ?? "");
    const limitParam = Number(searchParams.get("limit") ?? "50");

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId is required" },
        { status: 400 }
      );
    }

    let limit = 50;

    if (!Number.isNaN(limitParam)) {
      limit = limitParam;
    }

    if (limit < 1) {
      limit = 1;
    }

    if (limit > 200) {
      limit = 200;
    }

    const rows = await prisma.companyCustomer.findMany({
      where: {
        companyId,
        customer: query
          ? {
              OR: [
                {
                  firstName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  preferred_name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  whatsapp_name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  phone: {
                    contains: query,
                  },
                },
                {
                  secondary_phone: {
                    contains: query,
                  },
                },
                {
                  email: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : undefined,
      },
      select: {
        id: true,
        companyId: true,
        customerId: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            preferred_name: true,
            whatsapp_name: true,
            phone: true,
            secondary_phone: true,
            email: true,
            country_code: true,
            secondary_country_code: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const items = rows.map((row) => {
      return {
        id: row.id,
        companyId: row.companyId,
        customerId: row.customerId,
        linkedAt: row.createdAt,
        customer: {
          id: row.customer.id,
          displayName: getDisplayName(row.customer),
          firstName: row.customer.firstName,
          lastName: row.customer.lastName,
          preferredName: row.customer.preferred_name,
          whatsappName: row.customer.whatsapp_name,
          phone: row.customer.phone,
          secondaryPhone: row.customer.secondary_phone,
          email: row.customer.email,
          countryCode: row.customer.country_code,
          secondaryCountryCode: row.customer.secondary_country_code,
          createdAt: row.customer.createdAt,
          updatedAt: row.customer.updatedAt,
        },
      };
    });

    return NextResponse.json({
      ok: true,
      items,
      total: items.length,
    });
  } catch (error) {
    console.error("GET /api/slots/customers/database error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}