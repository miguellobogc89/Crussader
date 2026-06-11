// app/api/slots/customers/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParsedPhone = {
  countryCode: string;
  phone: string;
};

function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function parsePhone(rawPhone: string): ParsedPhone | null {
  const input = cleanText(rawPhone);

  if (!input) {
    return null;
  }

  let normalized = input;

  if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`;
  }

  if (normalized.startsWith("+")) {
    const allDigits = digitsOnly(normalized);

    if (!allDigits) {
      return null;
    }

    if (allDigits.length <= 6) {
      return null;
    }

    const possiblePrefixes = ["1", "34", "33", "39", "44", "49", "52", "54", "55", "57", "58", "351", "352", "353", "354", "355", "356"];

    let matchedPrefix = "";
    for (const prefix of possiblePrefixes.sort((a, b) => b.length - a.length)) {
      if (allDigits.startsWith(prefix) && allDigits.length > prefix.length + 4) {
        matchedPrefix = prefix;
        break;
      }
    }

    if (!matchedPrefix) {
      if (allDigits.length > 9) {
        matchedPrefix = allDigits.slice(0, allDigits.length - 9);
      } else {
        return null;
      }
    }

    const localNumber = allDigits.slice(matchedPrefix.length);

    if (!localNumber) {
      return null;
    }

    return {
      countryCode: `+${matchedPrefix}`,
      phone: localNumber,
    };
  }

  const localDigits = digitsOnly(normalized);

  if (!localDigits) {
    return null;
  }

  return {
    countryCode: "+34",
    phone: localDigits,
  };
}

function buildDisplayNames(firstName: string, lastName: string) {
  const cleanFirstName = cleanText(firstName);
  const cleanLastName = cleanText(lastName);

  return {
    firstName: cleanFirstName || "Desconocido",
    lastName: cleanLastName,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const companyId = cleanText(body.companyId);
    const firstNameInput = cleanText(body.firstName);
    const lastNameInput = cleanText(body.lastName);
    const email = cleanText(body.email);
    const rawPhone = cleanText(body.phone);
    const companyDisplayNameInput = cleanText(body.displayName);

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId is required" },
        { status: 400 }
      );
    }

    if (!rawPhone) {
      return NextResponse.json(
        { ok: false, error: "phone is required" },
        { status: 400 }
      );
    }

    const parsedPhone = parsePhone(rawPhone);

    if (!parsedPhone) {
      return NextResponse.json(
        { ok: false, error: "Invalid phone" },
        { status: 400 }
      );
    }

    const names = buildDisplayNames(firstNameInput, lastNameInput);
    const companyDisplayName =
  companyDisplayNameInput || `${names.firstName} ${names.lastName}`.trim();

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        phone: parsedPhone.phone,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        preferred_name: true,
        whatsapp_name: true,
        phone: true,
        email: true,
        country_code: true,
      },
    });

    let customerId = "";

    if (existingCustomer) {
      customerId = existingCustomer.id;

      await prisma.customer.update({
        where: {
          id: existingCustomer.id,
        },
        data: {
          country_code: existingCustomer.country_code || parsedPhone.countryCode,
          email: existingCustomer.email || email || null,
          firstName: existingCustomer.firstName || names.firstName,
          lastName: existingCustomer.lastName || names.lastName,
        },
      });
    } else {
      const createdCustomer = await prisma.customer.create({
        data: {
          firstName: names.firstName,
          lastName: names.lastName,
          phone: parsedPhone.phone,
          country_code: parsedPhone.countryCode,
          email: email || null,
        },
        select: {
          id: true,
        },
      });

      customerId = createdCustomer.id;
    }

const companyCustomer = await prisma.companyCustomer.upsert({
  where: {
    companyId_customerId: {
      companyId,
      customerId,
    },
  },
  update: {
    displayName: companyDisplayName,
  },
  create: {
    companyId,
    customerId,
    displayName: companyDisplayName,
  },
});

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
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

    if (!customer) {
      return NextResponse.json(
        { ok: false, error: "Customer not found after create" },
        { status: 500 }
      );
    }

const displayName =
  companyCustomer.displayName?.trim() ||
  customer.preferred_name?.trim() ||
  customer.whatsapp_name?.trim() ||
  `${customer.firstName} ${customer.lastName}`.trim();

    return NextResponse.json({
      ok: true,
      item: {
        customerId: customer.id,
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
      },
    });
  } catch (error) {
    console.error("POST /api/slots/customers/create error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}