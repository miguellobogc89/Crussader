// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

function buildClient() {
  const base = new PrismaClient({ log: ["warn", "error"] });

  // Extiende solo el modelo Review.create para disparar el auto-responder
  const extended = base.$extends({
    query: {
      review: {
        async create({ args, query }) {
          const result = await query(args); // crea la review

          const id = (result as { id?: string }).id;
          if (id) {
            (async () => {
              try {
                const { autoRespondForReview } = await import("@/lib/reviews/autoResponder");
                await autoRespondForReview(id);
              } catch (e: any) {
                console.error("[autoResponder] error:", e?.message ?? e);
              }
            })();
          }

          return result;
        },
      },
    },
  });

  return extended;
}

// 🔧 Tipo del cliente extendido
type ExtendedPrismaClient = ReturnType<typeof buildClient>;

// Cache global para evitar múltiples instancias en dev/HMR
const globalForPrisma = globalThis as unknown as { prisma?: ExtendedPrismaClient };

export const prisma: ExtendedPrismaClient = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
