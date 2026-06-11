// app/api/customer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function normalizeText(value: string): string {
  return value.trim();
}

function normalizeNullable(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return normalized;
}

function getDisplayName(customer: {
  firstName: string | null;
  lastName: string | null;
  preferred_name: string | null;
  whatsapp_name: string | null;
}): string {
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

function buildCompanyDisplayName(params: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}): string {
  const fullName = `${params.firstName ?? ""} ${params.lastName ?? ""}`.trim();

  if (fullName) {
    return fullName;
  }

  if (params.email) {
    return params.email;
  }

  if (params.phone) {
    return params.phone;
  }

  return "Sin nombre";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const companyId = normalizeText(searchParams.get("companyId") ?? "");
    const query = normalizeText(searchParams.get("q") ?? "");
    const limitParam = Number(searchParams.get("limit") ?? "20");

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId is required" },
        { status: 400 }
      );
    }

    let limit = 20;

    if (Number.isNaN(limitParam) === false) {
      limit = limitParam;
    }

    if (limit < 1) {
      limit = 1;
    }

    if (limit > 50) {
      limit = 50;
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
        id: row.customer.id,
        companyCustomerId: row.id,
        companyId: row.companyId,
        firstName: row.customer.firstName,
        lastName: row.customer.lastName,
        preferredName: row.customer.preferred_name,
        whatsappName: row.customer.whatsapp_name,
        displayName: getDisplayName(row.customer),
        phone: row.customer.phone,
        secondaryPhone: row.customer.secondary_phone,
        email: row.customer.email,
        countryCode: row.customer.country_code,
        secondaryCountryCode: row.customer.secondary_country_code,
        createdAt: row.customer.createdAt,
        updatedAt: row.customer.updatedAt,
      };
    });

    return NextResponse.json({
      ok: true,
      items,
      total: items.length,
    });
  } catch (error) {
    console.error("GET /api/customer error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const companyId = normalizeNullable(body.companyId);
    const firstName = normalizeNullable(body.firstName);
    const lastName = normalizeNullable(body.lastName);
    const phone = normalizeNullable(body.phone);
    const email = normalizeNullable(body.email);

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId is required" },
        { status: 400 }
      );
    }

    if (!firstName && !phone && !email) {
      return NextResponse.json(
        { ok: false, error: "At least firstName, phone or email is required" },
        { status: 400 }
      );
    }

    const existingCompanyCustomer = await prisma.companyCustomer.findFirst({
      where: {
        companyId,
        customer: {
          OR: [
            phone
              ? {
                  phone,
                }
              : undefined,
            email
              ? {
                  email: {
                    equals: email,
                    mode: "insensitive",
                  },
                }
              : undefined,
          ].filter(Boolean) as any,
        },
      },
      select: {
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
    });

    if (existingCompanyCustomer) {
      const customer = existingCompanyCustomer.customer;

      return NextResponse.json({
        ok: true,
        created: false,
        item: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          preferredName: customer.preferred_name,
          whatsappName: customer.whatsapp_name,
          displayName: getDisplayName(customer),
          phone: customer.phone,
          secondaryPhone: customer.secondary_phone,
          email: customer.email,
          countryCode: customer.country_code,
          secondaryCountryCode: customer.secondary_country_code,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        },
      });
    }

    const created = await prisma.customer.create({
    data: {
        firstName: firstName ?? "Sin nombre",
        lastName: lastName ?? "",
        phone: phone ?? `no-phone-${crypto.randomUUID()}`,
        email,
        },
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
    });

const companyDisplayName = buildCompanyDisplayName({
  firstName,
  lastName,
  email,
  phone,
});

await prisma.companyCustomer.create({
  data: {
    companyId,
    customerId: created.id,
    displayName: companyDisplayName,
  },
});

    return NextResponse.json({
      ok: true,
      created: true,
      item: {
        id: created.id,
        firstName: created.firstName,
        lastName: created.lastName,
        preferredName: created.preferred_name,
        whatsappName: created.whatsapp_name,
        displayName: getDisplayName(created),
        phone: created.phone,
        secondaryPhone: created.secondary_phone,
        email: created.email,
        countryCode: created.country_code,
        secondaryCountryCode: created.secondary_country_code,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    });
  } catch (error) {
    console.error("POST /api/customer error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}