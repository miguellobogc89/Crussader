// app/api/slots/customers/list/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeText(value: string): string {
  return value.trim();
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

    const limit = Math.max(1, Math.min(200, Number.isNaN(limitParam) ? 50 : limitParam));

    const customers = await prisma.companyCustomer.findMany({
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
      orderBy: [
        {
          customer: {
            firstName: "asc",
          },
        },
        {
          customer: {
            lastName: "asc",
          },
        },
      ],
      take: limit,
    });

    const items = customers.map((row) => {
      const customer = row.customer;

      const displayName =
        customer.preferred_name?.trim() ||
        customer.whatsapp_name?.trim() ||
        `${customer.firstName} ${customer.lastName}`.trim();

      return {
        id: row.id,
        companyId: row.companyId,
        customerId: row.customerId,
        linkedAt: row.createdAt,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          preferredName: customer.preferred_name,
          whatsappName: customer.whatsapp_name,
          displayName,
          phone: customer.phone,
          secondaryPhone: customer.secondary_phone,
          email: customer.email,
          countryCode: customer.country_code,
          secondaryCountryCode: customer.secondary_country_code,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        },
      };
    });

    return NextResponse.json({
      ok: true,
      items,
      total: items.length,
    });
  } catch (error) {
    console.error("GET /api/slots/customers/list error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}