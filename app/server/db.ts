// app/server/db.ts
// ==============================================
// 📌 Descripción:
// Exporta una instancia única de PrismaClient para el backend.
// ==============================================
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
