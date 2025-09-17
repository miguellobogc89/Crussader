import fs from "node:fs";
import * as dotenv from "dotenv";
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
dotenv.config();

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function run() {
  const now = new Date();
  const passwordHash = await bcrypt.hash("Test1234!", 10);

  const users = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    const idx = String(n).padStart(2, "0");
    const daysAgo = Math.floor(Math.random() * 60);
    const lastLoginAt = new Date(now);
    lastLoginAt.setDate(now.getDate() - daysAgo);
    const lastSeenAt = new Date(lastLoginAt.getTime() + Math.floor(Math.random() * 12) * 3600 * 1000);
    const phone = `+346${Math.floor(10000000 + Math.random() * 90000000)}`;

    return {
      email: `test${idx}@example.com`,
      name: `Test User ${idx}`,
      role: Role.test,
      isActive: true,
      isSuspended: false,
      suspendedAt: null,
      suspendedReason: null,
      deactivatedAt: null,
      lastLoginAt,
      lastSeenAt,
      loginCount: Math.floor(Math.random() * 50),
      failedLoginCount: Math.floor(Math.random() * 5),
      locale: "es-ES",
      timezone: "Europe/Madrid",
      phone,
      marketingOptIn: n % 2 === 0,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      notes: `Usuario de pruebas #${idx}`,
      passwordHash,
    };
  });

  let created = 0, updated = 0;

  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (exists) {
      await prisma.user.update({ where: { email: u.email }, data: u });
      updated++;
    } else {
      await prisma.user.create({ data: u });
      created++;
    }
  }

  console.log(`✅ Usuarios test listos. Creados: ${created}, Actualizados: ${updated}`);
  console.log(`ℹ️  Emails: test01@example.com … test20@example.com — contraseña: "Test1234!"`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
