import "dotenv/config";

const baseUrl = process.env.CRON_BASE_URL || "http://localhost:3000";
const secret = process.env.CRON_CONCEPTS_SECRET;

if (!secret) {
  console.error("Falta CRON_CONCEPTS_SECRET en .env");
  process.exit(1);
}

const locationId = process.argv[2] || null; // opcional: node ... <locationId>

const res = await fetch(`${baseUrl}/api/cron/concepts`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${secret}`,
  },
  body: JSON.stringify(locationId ? { locationId } : {}),
});

const text = await res.text();
console.log("HTTP", res.status);
console.log(text);
process.exit(res.ok ? 0 : 1);
