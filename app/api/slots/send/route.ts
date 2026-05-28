// app/api/slots/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePhoneNumber } from "@/lib/whatsapp/phoneNumbers/resolvePhoneNumber";
import { sendSlotRecoveryTemplate } from "@/lib/slots/messaging/sendSlotRecoveryTemplate";
import { logSlotActivity } from "@/lib/slots/actions/logSlotActivity";


type ConversationData = {
  id: string;
};

type IncomingCustomer = {
  customerId?: string | null;
  phone?: string | null;
};

async function resolveInstallation(companyId: string) {
  const inst = await prisma.integration_installation.findFirst({
    where: {
      provider: "whatsapp",
      status: "active",
      company_id: companyId,
    },
  });

  if (!inst) {
    return {
      installation: null,
      companyPhoneNumber: null,
    };
  }

  const companyPhoneNumber = await prisma.company_phone_number.findFirst({
    where: {
      company_id: companyId,
      status: "active",
    },
    orderBy: {
      updated_at: "desc",
    },
  });

  return {
    installation: inst,
    companyPhoneNumber,
  };
}

async function upsertConversation(args: {
  installationId: string;
  contactExternalId: string;
  contactPhoneE164?: string | null;
  contactName?: string | null;
  lastMessageAt?: Date | null;
  companyPhoneNumberId: string;
}) {
  return prisma.messaging_conversation.upsert({
    where: {
      installation_id_contact_external_id: {
        installation_id: args.installationId,
        contact_external_id: args.contactExternalId,
      },
    },
    create: {
      installation_id: args.installationId,
      contact_external_id: args.contactExternalId,
      contact_phone_e164: args.contactPhoneE164 ?? null,
      contact_name: args.contactName ?? null,
      status: "open",
      last_message_at: args.lastMessageAt ?? new Date(),
      company_phone_number_id: args.companyPhoneNumberId,
    },
    update: {
      contact_phone_e164: args.contactPhoneE164 ?? null,
      contact_name: args.contactName ?? null,
      last_message_at: args.lastMessageAt ?? new Date(),
      updated_at: new Date(),
      company_phone_number_id: args.companyPhoneNumberId,
    },
  });
}

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

          const templateName = "slot_available_employee";

const templateParams = [
  customerName,
  businessName,
  day,
  time,
  specialistName,
];

        const resolvedWhatsapp = await resolveInstallation(companyId);
        const installation = resolvedWhatsapp.installation;
        const companyPhoneNumber = resolvedWhatsapp.companyPhoneNumber;

        if (!installation || !companyPhoneNumber) {
          throw new Error("No active WhatsApp installation or phone number found");
        }

const contactPhone = `34${record.phone.replace(/[^\d]/g, "").replace(/^34/, "")}`;

const conv = await upsertConversation({
  installationId: installation.id,
  contactExternalId: contactPhone,
  contactPhoneE164: contactPhone,
  contactName: customerName,
  lastMessageAt: new Date(),
  companyPhoneNumberId: companyPhoneNumber.id,
});
          console.log("[CHAT_DEBUG][CONV]", conv.id);

        const result = await sendSlotRecoveryTemplate({
          to: record.phone,
          templateName,
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

await prisma.messaging_message.create({
  data: {
    conversation_id: conv.id,
    provider_message_id: messageId,
    direction: "out",
    kind: "template",
    text: null,
    status: "sent",
    provider_ts: new Date(),
    payload: {
      templateName,
      templateParams,
      meta: result,
    },
  },
});
          console.log("[CHAT_DEBUG][MESSAGE_CREATED]");

          await prisma.messaging_conversation.update({
            where: {
              id: conv.id,
            },
            data: {
              last_message_at: new Date(),
              updated_at: new Date(),
            },
          });

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