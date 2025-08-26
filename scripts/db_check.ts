import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Muestra a qué DB te conectas (nombre y usuario en Neon)
  const dbInfo = await prisma.$queryRawUnsafe<any[]>(`
    SELECT current_database() AS db, current_user AS "user"
  `);
  console.log("DB info:", dbInfo);

  // Conteos rápidos
  const [users, companies, memberships, connections] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.userCompany.count(),
    prisma.externalConnection.count(),
  ]);
  console.log({ users, companies, memberships, connections });

  // Lista breve (primeras 5) para comprobar contenido
  const sample = await prisma.company.findMany({
    take: 5,
    select: { id: true, name: true, createdById: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  console.log("companies sample:", sample);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("DB CHECK ERROR:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
