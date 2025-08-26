import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Usuario de prueba
  const user = await prisma.user.upsert({
    where: { email: "miguel.lobogc.89@gmail.com" },
    update: {},
    create: {
      name: "Miguel",
      email: "miguel.lobogc.89@gmail.com",
    },
  });

  // Empresa de prueba
  const company = await prisma.company.create({
    data: {
      name: "Empresa de Prueba",
      createdById: user.id,
    },
  });

  // Relación usuario ↔ empresa
  await prisma.userCompany.create({
    data: {
      userId: user.id,
      companyId: company.id,
      role: "OWNER",
    },
  });

  // Conexión externa de prueba
  await prisma.externalConnection.create({
    data: {
      userId: user.id,
      provider: "google-business",
      accountEmail: "crussadersolutions@gmail.com",
      access_token: "fake_access_token",
      refresh_token: "fake_refresh_token",
      expires_at: Math.floor(Date.now() / 1000) + 3600, // +1h
    },
  });

  console.log("✅ Seed ejecutado correctamente");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
