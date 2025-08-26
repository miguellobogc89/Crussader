import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🟢 Probando prisma.company...");
  const companies = await prisma.company.findMany();
  console.log("Companies:", companies);

  console.log("🟢 Probando prisma.userCompany...");
  const memberships = await prisma.userCompany.findMany();
  console.log("UserCompany:", memberships);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Error:", e);
    await prisma.$disconnect();
  });
