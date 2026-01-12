// app/connect/_server/register/externalConnection.ts
import { prisma } from "@/app/server/db";

type EnsureExternalConnectionArgs = {
  userId: string;
  provider: string; // ej: "google_gbp"
  accountEmail: string | null;
  accountName: string | null; // display name de la cuenta GBP si lo tienes
  providerUserId?: string | null; // opcional
  scope?: string | null;

  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null; // unix seconds si lo tienes
};

export async function ensureExternalConnection(args: EnsureExternalConnectionArgs) {
  const existing = await prisma.externalConnection.findUnique({
    where: {
      userId_provider: {
        userId: args.userId,
        provider: args.provider,
      },
    },
    select: {
      id: true,
      companyId: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  // Si existe, aquí SÍ actualizamos tokens (mínimo) porque si no, se te rompe al poco.
  if (existing) {
    const dataToUpdate: {
      access_token?: string;
      refresh_token?: string | null;
      expires_at?: number | null;
      accountEmail?: string | null;
      accountName?: string | null;
      providerUserId?: string | null;
      scope?: string | null;
    } = {};

    // Access token cambia casi siempre -> lo actualizo
    dataToUpdate.access_token = args.accessToken;

    // Refresh token: Google a veces no lo devuelve en re-consent; solo actualizo si me llega uno nuevo
    if (args.refreshToken) {
      dataToUpdate.refresh_token = args.refreshToken;
    }

    // Expires_at: si llega, actualizo
    if (typeof args.expiresAt === "number") {
      dataToUpdate.expires_at = args.expiresAt;
    }

    // Metadatos útiles
    dataToUpdate.accountEmail = args.accountEmail;
    dataToUpdate.accountName = args.accountName;
    dataToUpdate.providerUserId = args.providerUserId ?? null;
    dataToUpdate.scope = args.scope ?? null;

    await prisma.externalConnection.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });

    return {
      externalConnectionId: existing.id,
      created: false,
      updated: true,
    };
  }

  const created = await prisma.externalConnection.create({
    data: {
      userId: args.userId,
      provider: args.provider,
      accountEmail: args.accountEmail,
      access_token: args.accessToken,
      refresh_token: args.refreshToken,
      expires_at: args.expiresAt,
      accountName: args.accountName,
      providerUserId: args.providerUserId ?? null,
      scope: args.scope ?? null,
      status: "active",
    },
    select: { id: true },
  });

  return {
    externalConnectionId: created.id,
    created: true,
    updated: false,
  };
}
