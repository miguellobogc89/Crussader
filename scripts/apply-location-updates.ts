import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

type Update = {
  id: string;
  country: string;
  email: string;
  reviewsAvg: string | number; // Prisma Decimal acepta string
  reviewsCount: number;
};

const prisma = new PrismaClient();

function loadUpdates(file = "location-updates.json"): Update[] {
  const p = path.join(process.cwd(), file);
  const raw = fs.readFileSync(p, "utf-8");
  const arr = JSON.parse(raw) as Update[];
  return arr.map(u => ({
    ...u,
    // normalizamos reviewsAvg a string con 2 decimales (Decimal(3,2))
    reviewsAvg: typeof u.reviewsAvg === "number" ? u.reviewsAvg.toFixed(2) : u.reviewsAvg,
  }));
}

async function main() {
  const updates = loadUpdates();

  for (const u of updates) {
    await prisma.location.update({
      where: { id: u.id },
      data: {
        country: u.country,
        email: u.email,
        reviewsAvg: u.reviewsAvg,     // string "4.60"
        reviewsCount: u.reviewsCount, // int
      },
    });
    console.log(`✅ Updated ${u.id}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
