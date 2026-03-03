// lib/agents/actions/customerDataUpsert.tsx
import { prisma } from "@/lib/prisma";
import { updateSessionMemory } from "@/lib/agents/memory/updateSessionMemory";

function normalizePhone(p: string): string {
  return String(p || "").replace(/[^\d]/g, "");
}

function clean(v: unknown): string {
  return String(v || "").trim();
}

export type CustomerDataUpsertResult = {
  ok: true;
  customerId: string;
  changes: Array<
    | "EMAIL_ADDED"
    | "EMAIL_UPDATED"
    | "PHONE_CHANGED"
    | "NAME_UPDATED"
    | "NO_CHANGES"
  >;
  message: string;
};

export async function customerDataUpsert(args: {
  companyId: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  newPrimaryPhone?: string | null;
  sessionId: string;
}): Promise<CustomerDataUpsertResult> {
  const companyId = String(args.companyId || "").trim();
  const phone = normalizePhone(args.phone);

  if (!phone) throw new Error("Missing phone");

  const email = args.email ? clean(args.email) : "";
  const firstName = args.firstName ? clean(args.firstName) : "";
  const lastName = args.lastName ? clean(args.lastName) : "";
  const newPrimaryPhone = args.newPrimaryPhone
    ? normalizePhone(args.newPrimaryPhone)
    : "";

  const c = await prisma.customer.findFirst({
    where: {
      OR: [{ phone }, { secondary_phone: phone }],
    },
    select: {
      id: true,
      phone: true,
      secondary_phone: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!c) {
    return {
      ok: true,
      customerId: "UNKNOWN",
      changes: ["NO_CHANGES"],
      message: "no se ha modificado nada (cliente no existe)",
    };
  }

  const changes: CustomerDataUpsertResult["changes"] = [];
  const data: Record<string, unknown> = {};

  // ==========================
  // EMAIL
  // ==========================
  if (email.length > 0) {
    if (!c.email) {
      data.email = email;
      changes.push("EMAIL_ADDED");
    } else if (c.email !== email) {
      data.email = email;
      changes.push("EMAIL_UPDATED");
    }
  }

  // ==========================
  // NAME (overwrite si cambia)
  // ==========================
  if (firstName.length > 0) {
    const curFirst = String(c.firstName || "").trim();
    if (curFirst !== firstName) {
      data.firstName = firstName;
      changes.push("NAME_UPDATED");
    }
  }

  if (lastName.length > 0) {
    const curLast = String(c.lastName || "").trim();
    if (curLast !== lastName) {
      data.lastName = lastName;
      changes.push("NAME_UPDATED");
    }
  }

  // ==========================
  // PHONE CHANGE (promote)
  // ==========================
  if (newPrimaryPhone.length > 0 && newPrimaryPhone !== c.phone) {
    data.phone = newPrimaryPhone;
    data.secondary_phone = c.phone;
    changes.push("PHONE_CHANGED");
  }

  // ==========================
  // UPDATE SESSION MEMORY (SIEMPRE que venga dato)
  // ==========================
  const memPatch: Record<string, unknown> = {};
  if (email.length > 0) memPatch.email = email;
  if (firstName.length > 0) memPatch.firstName = firstName;
  if (lastName.length > 0) memPatch.lastName = lastName;
  if (newPrimaryPhone.length > 0) memPatch.phone = newPrimaryPhone;

  if (Object.keys(memPatch).length > 0) {
    await updateSessionMemory({
      sessionId: String(args.sessionId || "").trim(),
      bucket: "profile",
      patch: memPatch,
    });
  }

  // ==========================
  // NO CHANGES
  // ==========================
  if (changes.length === 0) {
    return {
      ok: true,
      customerId: c.id,
      changes: ["NO_CHANGES"],
      message: "no se ha modificado nada",
    };
  }

  // ==========================
  // UPDATE DB
  // ==========================
  await prisma.customer.update({
    where: { id: c.id },
    data,
    select: { id: true },
  });

  // ==========================
  // ENSURE COMPANY LINK
  // ==========================
  if (companyId.length > 0) {
    await prisma.companyCustomer.upsert({
      where: {
        companyId_customerId: {
          companyId,
          customerId: c.id,
        },
      },
      create: {
        companyId,
        customerId: c.id,
      },
      update: {},
    });
  }

  // ==========================
  // MESSAGE RETURN
  // ==========================
  let msg = "datos actualizados";

  if (changes.length === 1) {
    const only = changes[0];

    if (only === "EMAIL_ADDED") msg = "email añadido";
    if (only === "EMAIL_UPDATED") msg = "email actualizado";
    if (only === "PHONE_CHANGED") msg = "teléfono modificado";
    if (only === "NAME_UPDATED") msg = "nombre/apellido actualizado";
  } else if (changes.length > 1) {
    msg = "datos actualizados (" + changes.join(", ") + ")";
  }

  return {
    ok: true,
    customerId: c.id,
    changes,
    message: msg,
  };
}