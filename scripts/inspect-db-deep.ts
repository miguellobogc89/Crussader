// scripts/inspect-db-deep.ts
import fs from "node:fs";
import * as dotenv from "dotenv";
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
dotenv.config();

import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const url = process.env.DATABASE_URL || "";
  console.log("DATABASE_URL =", url.replace(/:(?:[^@]+)@/, "://***:***@"));

  // 1) Info de sesión
  const [session] = await p.$queryRawUnsafe<any[]>(`
    select current_database() as db,
           current_user as user,
           current_schema as current_schema,
           current_setting('search_path') as search_path,
           current_setting('server_version') as pg_version
  `);
  console.log("session =", session);

  // 2) Schemas disponibles
  const schemas = await p.$queryRawUnsafe<any[]>(`
    select schema_name
    from information_schema.schemata
    where schema_name not in ('pg_catalog','information_schema')
    order by schema_name;
  `);
  console.log("schemas =", schemas.map(s => s.schema_name));

  // 3) Tablas clave por schema (User, Company, Location, Review, Response, Activity, Type)
  const tables = await p.$queryRawUnsafe<any[]>(`
    select table_schema, table_name
    from information_schema.tables
    where table_schema not in ('pg_catalog','information_schema')
      and table_name in ('User','Company','Location','Review','Response','Activity','Type')
    order by table_schema, table_name;
  `);
  console.log("tables =", tables);

  // 4) Recuento rápido en el schema activo (el que usa Prisma): public por defecto
  const counts = await Promise.allSettled([
    p.activity.count().then(n => ({ model: "Activity", n })),
    p.type.count().then(n => ({ model: "Type", n })),
    p.user.count().then(n => ({ model: "User", n })),
    p.company.count().then(n => ({ model: "Company", n })),
    p.location.count().then(n => ({ model: "Location", n })),
    p.review.count().then(n => ({ model: "Review", n })),
    p.response.count().then(n => ({ model: "Response", n })),
  ]);
  console.log("counts(active schema) =", counts);

  await p.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
