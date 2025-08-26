// lib/reviews/sync.ts
import { prisma } from "@/lib/prisma";

export type SyncResult = {
  startedAt: string;
  finishedAt: string;
  totalLocations: number;
  updatedReviews: number;
  errors: Array<{ locationId: string; error: string }>;
};

export async function syncAllReviews(): Promise<SyncResult> {
  const startedAt = new Date();

  // Paso 1: solo comprobamos que podemos leer locations sin errores.
  // (Ajusta el select si tu modelo usa otro nombre de campo.)
  const locations = await prisma.location.findMany({
    select: { id: true },
  });

  // En el paso 2 conectaremos el fetch real a Google y los upserts.
  return {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    totalLocations: locations.length,
    updatedReviews: 0,
    errors: [],
  };
}

export const syncFakeReviews = syncAllReviews;