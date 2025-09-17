import fs from "node:fs";
import * as dotenv from "dotenv";
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
dotenv.config();

import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

(async () => {
  const url = process.env.DATABASE_URL || "";
  console.log("DATABASE_URL =", url.replace(/:(?:[^@]+)@/, "://***:***@"));

  const [activities, types, users, companies] = await Promise.all([
    p.activity.count(),
    p.type.count(),
    p.user.count(),
    p.company.count(),
  ]);
  console.log({ activities, types, users, companies });

  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
