// scripts/promote-admin.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const ADMIN_EMAIL = "miguel.lobogc.89@gmail.com";

await prisma.user.updateMany({
  where: { email: ADMIN_EMAIL },
  data: { role: "system_admin" },
});

console.log("OK: admin promovido");
await prisma.$disconnect();
