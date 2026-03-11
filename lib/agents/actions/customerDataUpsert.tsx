// lib/agents/actions/customerDataUpsert.tsx
import { prisma } from "@/lib/prisma";
import { updateSessionMemory } from "@/lib/agents/memory/updateSessionMemory";

function normalizePhone(p: string): string {
  return String(p || "").replace(/[^\d]/g, "");
}

function clean(v: unknown): string {
  return String(v || "").trim();
}

type SessionState = {
  activeCustomerId?: string | null;
  activeCustomerMode?: string | null;
};

type SessionProfile = {
  customerId?: string | null;
};

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

async function resolveTargetCustomer(args: {
  sessionId: string;
  phone: string;
}) {
  const sessionId = clean(args.sessionId);
  const phone = normalizePhone(args.phone);

  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    select: { settings: true },
  });

  let activeCustomerId = "";

  if (session && session.settings && typeof session.settings === "object") {
    const settings = session.settings as Record<string, unknown>;

    if (settings.memory && typeof settings.memory === "object") {
      const memory = settings.memory as Record<string, unknown>;

      if (memory.state && typeof memory.state === "object") {
        const state = memory.state as SessionState;
        if (typeof state.activeCustomerId === "string") {
          activeCustomerId = state.activeCustomerId.trim();
        }
      }

      if (!activeCustomerId && memory.profile && typeof memory.profile === "object") {
        const profile = memory.profile as SessionProfile;
        if (typeof profile.customerId === "string") {
          activeCustomerId = profile.customerId.trim();
        }
      }
    }
  }

  if (activeCustomerId.length > 0) {
    const byActiveId = await prisma.customer.findUnique({
      where: { id: activeCustomerId },
      select: {
        id: true,
        phone: true,
        secondary_phone: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (byActiveId) {
      return byActiveId;
    }
  }

  if (!phone) {
    return null;
  }

  const byPhone = await prisma.customer.findFirst({
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

  return byPhone;
}

export async function customerDataUpsert(args: {
  companyId: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  newPrimaryPhone?: string | null;
  sessionId: string;
}): Promise<CustomerDataUpsertResult> {
  const sessionId = clean(args.sessionId);
  const phone = normalizePhone(args.phone);

  if (!sessionId) throw new Error("Missing sessionId");
  if (!phone) throw new Error("Missing phone");

  const email = args.email ? clean(args.email) : "";
  const firstName = args.firstName ? clean(args.firstName) : "";
  const lastName = args.lastName ? clean(args.lastName) : "";
  const newPrimaryPhone = args.newPrimaryPhone
    ? normalizePhone(args.newPrimaryPhone)
    : "";

  const c = await resolveTargetCustomer({
    sessionId,
    phone,
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
  // NAME
  // ==========================

  let nameChanged = false;

  if (firstName.length > 0) {
    const curFirst = String(c.firstName || "").trim();

    if (curFirst !== firstName) {
      data.firstName = firstName;
      nameChanged = true;
    }
  }

  if (lastName.length > 0) {
    const curLast = String(c.lastName || "").trim();

    if (curLast !== lastName) {
      data.lastName = lastName;
      nameChanged = true;
    }
  }

  if (nameChanged) {
    changes.push("NAME_UPDATED");
  }

  // ==========================
  // PHONE CHANGE (safe promote)
  // ==========================

  if (newPrimaryPhone.length > 0 && newPrimaryPhone !== c.phone) {
    const other = await prisma.customer.findFirst({
      where: { phone: newPrimaryPhone },
      select: { id: true },
    });

    if (!other || other.id === c.id) {
      data.phone = newPrimaryPhone;
      data.secondary_phone = c.phone;
      changes.push("PHONE_CHANGED");
    }
  }

  // ==========================
  // FINAL PROFILE
  // ==========================

  let finalPhone = c.phone;
  if (typeof data.phone === "string" && data.phone.length > 0) {
    finalPhone = String(data.phone);
  }

  let finalEmail = c.email;
  if (typeof data.email === "string") {
    finalEmail = String(data.email);
  }

  let finalFirstName = c.firstName;
  if (typeof data.firstName === "string" && data.firstName.length > 0) {
    finalFirstName = String(data.firstName);
  }

  let finalLastName = c.lastName;
  if (typeof data.lastName === "string" && data.lastName.length > 0) {
    finalLastName = String(data.lastName);
  }

  const finalProfile: Record<string, unknown> = {
    customerId: c.id,
    phone: finalPhone,
    email: finalEmail,
    firstName: finalFirstName,
    lastName: finalLastName,
  };

  const finalState: Record<string, unknown> = {
    activeCustomerId: c.id,
  };

  // ==========================
  // NO CHANGES
  // ==========================

  if (changes.length === 0) {
    await updateSessionMemory({
      sessionId,
      bucket: "profile",
      patch: finalProfile,
    });

    await updateSessionMemory({
      sessionId,
      bucket: "state",
      patch: finalState,
    });

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

  await updateSessionMemory({
    sessionId,
    bucket: "profile",
    patch: finalProfile,
  });

  await updateSessionMemory({
    sessionId,
    bucket: "state",
    patch: finalState,
  });

  // ==========================
  // MESSAGE
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