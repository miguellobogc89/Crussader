// app/api/slots/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSlotRecoveryTemplate } from "@/lib/slots/slot-recovery/messaging/sendSlotRecoveryTemplate";
import { logSlotActivity } from "@/lib/slots/slot-recovery/logSlotActivity";

type IncomingCustomer = {
  customerId?: string | null;
  phone?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const companyId =
      typeof body?.companyId === "string" ? body.companyId.trim() : "";
    const slotId = typeof body?.slotId === "string" ? body.slotId.trim() : "";
    const customers: IncomingCustomer[] = Array.isArray(body?.customers)
      ? body.customers
      : [];

    if (!companyId || !slotId || customers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 },
      );
    }

    const validCustomers = customers
      .map((customer) => {
        return {
          customerId:
            typeof customer?.customerId === "string"
              ? customer.customerId.trim()
              : "",
          phone:
            typeof customer?.phone === "string" ? customer.phone.trim() : "",
        };
      })
      .filter((customer) => {
        return customer.customerId.length > 0 && customer.phone.length > 0;
      });

    if (validCustomers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid customers with phone" },
        { status: 400 },
      );
    }

    const slot = await prisma.slot_recovery_slot.findUnique({
      where: {
        id: slotId,
      },
      select: {
        id: true,
        company_id: true,
        location_id: true,
        starts_at: true,
        status: true,
        Location: {
          select: {
            title: true,
          },
        },
        Employee: {
          select: {
            name: true,
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
        { status: 404 },
      );
    }

    

    if (slot.company_id !== companyId) {
      return NextResponse.json(
        { ok: false, error: "Slot does not belong to company" },
        { status: 400 },
      );
    }

    const sendRecords = validCustomers.map((customer) => {
      return {
        companyId,
        slotId,
        customerId: customer.customerId,
        phone: customer.phone,
        status: "PENDING",
      };
    });

    await prisma.slot_recovery_send.createMany({
      data: sendRecords,
      skipDuplicates: true,
    });

    const recipientRecords = validCustomers.map((customer) => {
      return {
        slot_recovery_slot_id: slotId,
        company_id: companyId,
        customer_id: customer.customerId,
        status: "queued",
        template_name: "slot_available_employee ",
      };
    });

    await prisma.slot_recovery_recipient.createMany({
      data: recipientRecords,
      skipDuplicates: true,
    });

    const businessName = slot.Location?.title || "tu negocio";

    const specialistName =
      slot.Employee?.name || "nuestro especialista";

    const date = new Date(slot.starts_at);

    const day = date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const time = date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let successCount = 0;
    let failedCount = 0;

    for (const record of sendRecords) {
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


        const result = await sendSlotRecoveryTemplate({
          to: record.phone,
          templateName: "slot_available_employee ",
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
                  text: day,
                },
                {
                  type: "text",
                  text: time,
                },
                {
                  type: "text",
                  text: specialistName,
                },
              ],
            },
          ],
        });

        const messageId =
          result?.messages && result.messages[0] ? result.messages[0].id : null;

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
            error_message: null,
          },
        });

        await prisma.slot_recovery_recipient.updateMany({
          where: {
            company_id: record.companyId,
            slot_recovery_slot_id: record.slotId,
            customer_id: record.customerId,
          },
          data: {
            status: "sent",
            provider_message_id: messageId,
            sent_at: new Date(),
          },
        });

        successCount += 1;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "send_failed";

        console.error("[WA][SEND][FAIL]", error);
        console.error("[WA][SEND][FAIL][MESSAGE]", errorMessage);

        await prisma.slot_recovery_send.updateMany({
          where: {
            companyId: record.companyId,
            slotId: record.slotId,
            customerId: record.customerId,
          },
          data: {
            status: "FAILED",
            error_message: errorMessage,
          },
        });

        await prisma.slot_recovery_recipient.updateMany({
          where: {
            company_id: record.companyId,
            slot_recovery_slot_id: record.slotId,
            customer_id: record.customerId,
          },
          data: {
            status: "failed",
          },
        });

        failedCount += 1;
      }
    }

    if (successCount > 0) {
      await prisma.slot_recovery_slot.update({
        where: {
          id: slotId,
        },
        data: {
          status: "sent",
          published_at: new Date(),
          sent_customer_count: successCount,
        },
      });

      await logSlotActivity({
        companyId,
        locationId: slot.location_id,
        slotId,
        eventType: "invite_sent",
        title: `Invitación enviada a ${successCount} usuarios`,
        payload: {
          recipients_count: successCount,
          failed_count: failedCount,
        },
      });
    }

    if (successCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "All WhatsApp sends failed",
          sentCount: 0,
          failedCount,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      count: successCount,
      sentCount: successCount,
      failedCount,
    });
  } catch (error) {
    console.error("POST /api/slots/send error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}