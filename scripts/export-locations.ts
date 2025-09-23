// scripts/export-locations.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function main() {
  const locations = await prisma.location.findMany({
    include: {
      company: true, // si quieres traer también datos de la empresa
    },
  });

  fs.writeFileSync(
    "locations_export.json",
    JSON.stringify(locations, null, 2),
    "utf-8"
  );

  console.log(`Exportadas ${locations.length} ubicaciones a locations_export.json`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
