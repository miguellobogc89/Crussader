import fs from "node:fs";
import * as dotenv from "dotenv";
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
dotenv.config();

import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const url = process.env.DATABASE_URL || "";
  console.log("DATABASE_URL =", url.replace(/:(?:[^@]+)@/, "://***:***@"));

  // Localiza todos los schemas que tengan una tabla "Company"
  const schemas: { schema_name: string }[] = await p.$queryRawUnsafe(`
    SELECT table_schema AS schema_name
    FROM information_schema.tables
    WHERE table_name = 'Company'
    ORDER BY table_schema;
  `);

  if (!schemas.length) {
    console.log("No existe ninguna tabla Company en este branch/DB.");
    await p.$disconnect();
    return;
  }

  // Cuenta filas por schema
  const results: { schema: string; count: number }[] = [];
  for (const s of schemas) {
    const row = await p.$queryRawUnsafe<{ n: number }[]>(
      `SELECT COUNT(*)::int AS n FROM "${s.schema_name}"."Company";`
    );
    results.push({ schema: s.schema_name, count: row[0]?.n ?? 0 });
  }

  console.table(results);
  const max = Math.max(...results.map(r => r.count));
  console.log("MAX count =", max);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
