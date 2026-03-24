// app/api/slots/send/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSlotRecoveryTemplate } from "@/lib/whatsapp/sendSlotRecoveryTemplate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const companyId = body.companyId;
    const slotId = body.slotId;
    const customers = body.customers;

    if (!companyId || !slotId || !Array.isArray(customers)) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const validCustomers = customers.filter((c: any) => {
      return typeof c.phone === "string" && c.phone.length > 0;
    });

    if (validCustomers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid customers with phone" },
        { status: 400 }
      );
    }

    const records = validCustomers.map((c: any) => {
      return {
        companyId,
        slotId,
        customerId: c.customerId,
        phone: c.phone,
        status: "PENDING",
      };
    });

        const recipientRecords = validCustomers.map((c: any) => {
      return {
        slot_recovery_slot_id: slotId,
        company_id: companyId,
        customer_id: c.customerId,
        status: "sent",
        template_name: "slot_recovery_basic",
        sent_at: new Date(),
      };
    });

    const recipientInsertResult = await prisma.slot_recovery_recipient.createMany({
      data: recipientRecords,
      skipDuplicates: true,
    });

    console.log("[SLOTS][RECIPIENTS][CREATED]", {
      slotId,
      companyId,
      count: recipientInsertResult.count,
      recipientRecords,
    });

    await prisma.slot_recovery_send.createMany({
      data: records,
    });

    await prisma.slot_recovery_slot.update({
  where: {
    id: slotId,
  },
  data: {
    status: "sent",
    published_at: new Date(),
    sent_customer_count: records.length,
  },
});

    

const slot = await prisma.slot_recovery_slot.findUnique({
  where: {
    id: slotId,
  },
  select: {
    id: true,
    starts_at: true,
    Location: {
      select: {
        title: true,
      },
    },
    slot_recovery_slot_service: {
      orderBy: {
        position: "asc",
      },
      select: {
        slot_recovery_service: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    },
  },
});

if (!slot) {
  return NextResponse.json(
    { ok: false, error: "Slot not found" },
    { status: 404 }
  );
}

    for (const record of records) {
      try {
        const customer = await prisma.customer.findUnique({
            where: {
                id: record.customerId,
            },
            select: {
                firstName: true,
                preferred_name: true,
                whatsapp_name: true,
            },
        });

        const customerName =
        customer?.preferred_name ||
        customer?.whatsapp_name ||
        customer?.firstName ||
        "Cliente";

const serviceLines = slot.slot_recovery_slot_service
  .map((item) => {
    const service = item.slot_recovery_service;
    return `${service.name} ${service.price}€`;
  });

const serviceName =
  serviceLines.length > 0
    ? `uno de estos servicios a elegir: ${serviceLines.join(" · ")}`
    : "tu cita";

        const date = new Date(slot.starts_at);

        const day = date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        });

        const time = date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        });
const fullPhone = `${record.phone}`;

const businessName = slot.Location?.title || "tu negocio";


const firstService =
  slot.slot_recovery_slot_service[0]?.slot_recovery_service;

let priceText = "Consultar precio";

if (firstService && firstService.price !== null && firstService.price !== undefined) {
  priceText = `${firstService.price}€`;
}

const result = await sendSlotRecoveryTemplate({
  to: fullPhone,
  templateName: "slot_recovery_basic",
  language: "es",
  components: [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: customerName,
        },
        {
          type: "text",
          text: businessName,
        },
        {
          type: "text",
          text: serviceName,
        },
        {
          type: "text",
          text: `${day} a las ${time}`,
        },
        {
          type: "text",
          text: priceText,
        },
      ],
    },
  ],
});

        const messageId =
          result?.messages && result.messages[0]
            ? result.messages[0].id
            : null;

        await prisma.slot_recovery_send.updateMany({
          where: {
            companyId: record.companyId,
            slotId: record.slotId,
            customerId: record.customerId,
          },
          data: {
            status: "SENT",
            meta_message_id: messageId,
            sent_at: new Date(),
          },
        });
      } catch (error) {
        console.error("[WA][SEND][FAIL]", error);

        await prisma.slot_recovery_send.updateMany({
          where: {
            companyId: record.companyId,
            slotId: record.slotId,
            customerId: record.customerId,
          },
          data: {
            status: "FAILED",
            error_message: "send_failed",
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      count: records.length,
    });
  } catch (error) {
    console.error("POST /api/slots/send error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}