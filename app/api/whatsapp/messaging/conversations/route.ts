// app/api/whatsapp/messaging/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMessagingMessage } from "@/lib/whatsapp/normalizers/normalizeMessagingMessage";

export const dynamic = "force-dynamic";

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/[^\d]/g, "");
}

function phoneCandidates(value: unknown) {
  const phone = normalizePhone(value);

  const candidates = new Set<string>();

  if (phone) candidates.add(phone);

  if (phone.startsWith("34") && phone.length > 9) {
    candidates.add(phone.slice(2));
  }

  return Array.from(candidates);
}

function resolveContactDisplayName(args: {
  preferredName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  whatsappName?: string | null;
  contactName?: string | null;
  phone?: string | null;
}) {
  const preferredName = cleanString(args.preferredName);
  const firstName = cleanString(args.firstName);
  const lastName = cleanString(args.lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const whatsappName = cleanString(args.whatsappName);
  const contactName = cleanString(args.contactName);
  const phone = cleanString(args.phone);

if (fullName) return fullName;
if (preferredName) return preferredName;
if (whatsappName) return whatsappName;
  if (contactName) return contactName;
  if (phone) return `Contacto ${phone.slice(-4)}`;

  return "Contacto";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const companyId = String(searchParams.get("companyId") || "").trim();

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId requerido" },
        { status: 400 },
      );
    }

    const metaPhoneNumberId = String(searchParams.get("phoneNumberId") || "").trim();
    const take = Math.min(Number(searchParams.get("limit") || 30), 100);
    const cursor = String(searchParams.get("cursor") || "").trim();

    const installs = await prisma.integration_installation.findMany({
      where: {
        company_id: companyId,
        provider: "whatsapp",
        status: "active",
      },
      select: { id: true },
    });

    const installIds = installs.map((x) => x.id);

    if (installIds.length === 0) {
      return NextResponse.json({ ok: true, items: [], nextCursor: null });
    }

    let companyPhoneNumberUuid: string | null = null;

    if (metaPhoneNumberId) {
      const phoneRow = await prisma.company_phone_number.findFirst({
        where: {
          company_id: companyId,
          phone_number_id: metaPhoneNumberId,
        },
        select: { id: true },
      });

      if (!phoneRow) {
        return NextResponse.json({ ok: true, items: [], nextCursor: null });
      }

      companyPhoneNumberUuid = phoneRow.id;
    }

const whereConv: {
  installation_id: { in: string[] };
  company_phone_number_id?: string;
  status?: { not: string };
} = {
  installation_id: { in: installIds },
  status: { not: "deleted" },
};

    if (companyPhoneNumberUuid) {
      whereConv.company_phone_number_id = companyPhoneNumberUuid;
    }

    const conversations = await prisma.messaging_conversation.findMany({
      where: whereConv,
      orderBy: [{ last_message_at: "desc" }, { created_at: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        contact_external_id: true,
        contact_phone_e164: true,
        contact_name: true,
        status: true,
        last_message_at: true,
        last_read_at: true,
        created_at: true,
        Customer: {
          select: {
            preferred_name: true,
            whatsapp_name: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;

    if (conversations.length > take) {
      const last = conversations.pop();
      if (last) nextCursor = last.id;
    }

const phones = Array.from(
  new Set(
    conversations.flatMap((c) =>
      phoneCandidates(c.contact_phone_e164 ?? c.contact_external_id),
    ),
  ),
);

    const customersByPhoneRows = await prisma.customer.findMany({
      where: {
        phone: { in: phones },
      },
      select: {
        preferred_name: true,
        whatsapp_name: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    const customerByPhone = new Map(
      customersByPhoneRows.map((customer) => [
        normalizePhone(customer.phone),
        customer,
      ]),
    );

    const items = await Promise.all(
      conversations.map(async (conversation) => {
        const phone = conversation.contact_phone_e164 ?? conversation.contact_external_id;
        const normalizedPhone = normalizePhone(phone);

        
        const customer =
          conversation.Customer ??
          phoneCandidates(phone)
            .map((candidate) => customerByPhone.get(candidate) ?? null)
            .find((candidate) => candidate !== null) ??
          null;

        const displayName = resolveContactDisplayName({
          preferredName: customer?.preferred_name,
          firstName: customer?.firstName,
          lastName: customer?.lastName,
          whatsappName: customer?.whatsapp_name,
          contactName: conversation.contact_name,
          phone,
        });

        const lastMsg = await prisma.messaging_message.findFirst({
          where: { conversation_id: conversation.id },
          orderBy: [{ provider_ts: "desc" }, { created_at: "desc" }],
          select: {
            direction: true,
            kind: true,
            provider_message_id: true,
            text: true,
            status: true,
            provider_ts: true,
            created_at: true,
            payload: true,
          },
        });

        const lastIncomingMsg = await prisma.messaging_message.findFirst({
          where: {
            conversation_id: conversation.id,
            direction: "in",
          },
          orderBy: [{ provider_ts: "desc" }, { created_at: "desc" }],
          select: {
            provider_ts: true,
            created_at: true,
          },
        });

        const unreadCount = await prisma.messaging_message.count({
          where: {
            conversation_id: conversation.id,
            direction: "in",
            ...(conversation.last_read_at
              ? { provider_ts: { gt: conversation.last_read_at } }
              : {}),
          },
        });

        const templateName =
          lastMsg?.kind === "template" && typeof (lastMsg.payload as any)?.templateName === "string"
            ? String((lastMsg.payload as any).templateName)
            : "";

        const template = templateName
          ? await prisma.whatsapp_template.findFirst({
              where: {
                company_id: companyId,
                template_name: templateName,
              },
              select: {
                body_preview: true,
              },
            })
          : null;

        const normalizedLastMsg = lastMsg
          ? normalizeMessagingMessage({
              message: lastMsg,
              templateBodyPreview: template?.body_preview ?? null,
            })
          : null;

        return {
          id: conversation.id,
          contact: {
            name: displayName,
            phone_e164: phone,
            external_id: conversation.contact_external_id,
            avatar_url: null,
          },
          status: conversation.status,
          last_message_at: conversation.last_message_at,
          last_read_at: conversation.last_read_at,
          last_incoming_at: lastIncomingMsg
            ? lastIncomingMsg.provider_ts ?? lastIncomingMsg.created_at
            : null,
          unread_count: unreadCount,
          last_message: lastMsg
            ? {
                direction: lastMsg.direction,
                text: normalizedLastMsg?.displayText ?? lastMsg.text ?? "—",
                kind: lastMsg.kind,
                status: lastMsg.status,
                at: lastMsg.provider_ts ?? lastMsg.created_at,
              }
            : null,
        };
      }),
    );

    return NextResponse.json({ ok: true, items, nextCursor });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error al listar conversaciones" },
      { status: 500 },
    );
  }
}