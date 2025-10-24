// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

function buildClient() {
  const base = new PrismaClient({ log: ["warn", "error"] })

  const extended = base.$extends({
    query: {
      review: {
        async create({ args, query }) {
          const result = await query(args)
          const id = result?.id
          if (id) {
            // 🎯 Auto responder
            ;(async () => {
              try {
                const { autoRespondForReview } = await import("@/lib/reviews/autoResponder")
                await autoRespondForReview(id)
              } catch (e: any) {
                console.error("[autoResponder] error:", e?.message ?? e)
              }
            })()

            // 🔔 Notificación automática
            ;(async () => {
              try {
                const { generateNotification } = await import("@/lib/notifications/generateNotification")
                await generateNotification({
                  model: "Review",
                  action: "create",
                  data: result as any,
                })
              } catch (e: any) {
                console.error("[notification] error:", e?.message ?? e)
              }
            })()
          }

          return result
        },
      },

      user: {
        async create({ args, query }) {
          const result = await query(args)
          const id = result?.id
          if (id) {
            // 🔔 Notificación automática
            ;(async () => {
              try {
                const { generateNotification } = await import("@/lib/notifications/generateNotification")
                await generateNotification({
                  model: "User",
                  action: "create",
                  data: result as any,
                })
              } catch (e: any) {
                console.error("[notification] error:", e?.message ?? e)
              }
            })()
          }

          return result
        },
      },
    },
  })

  return extended
}

type ExtendedPrismaClient = ReturnType<typeof buildClient>

const globalForPrisma = globalThis as unknown as { prisma?: ExtendedPrismaClient }
export const prisma: ExtendedPrismaClient = globalForPrisma.prisma ?? buildClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

// Prisma tipado estándar
import type { PrismaClient as PrismaClientType } from "@prisma/client"
export const prismaModels = prisma as unknown as PrismaClientType

// Prisma sin $extends (para uso interno como notificaciones)
import { PrismaClient as PrismaClientBase } from "@prisma/client"

let _prismaRaw: PrismaClientBase | undefined = (globalThis as any).__prismaRaw__
if (!_prismaRaw) {
  _prismaRaw = new PrismaClientBase({ log: ["warn", "error"] })
  if (process.env.NODE_ENV !== "production") {
    (globalThis as any).__prismaRaw__ = _prismaRaw
  }
}

export const prismaRaw = _prismaRaw
