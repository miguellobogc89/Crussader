// app/api/crussader-assistant/subscriptions/sports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }

  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "INVALID_BODY" },
        { status: 400 }
      );
    }

    const channel = parseString(body.channel, "whatsapp");
    const destination = parseString(body.destination);
    const provider = parseString(body.provider, "api-football");
    const sport = parseString(body.sport, "football");
    const subscriptionType = parseString(body.subscription_type);

    const config =
      typeof body.config === "object" && body.config !== null
        ? body.config
        : null;

    if (!destination) {
      return NextResponse.json(
        { ok: false, error: "MISSING_DESTINATION" },
        { status: 400 }
      );
    }

    if (!subscriptionType) {
      return NextResponse.json(
        { ok: false, error: "MISSING_SUBSCRIPTION_TYPE" },
        { status: 400 }
      );
    }

const configJson = config === null ? null : JSON.stringify(config);

const subscription = await prisma.$queryRawUnsafe(
  `
  insert into football_subscription (
    channel,
    destination,
    provider,
    sport,
    subscription_type,
    config
  )
  values ($1,$2,$3,$4,$5,$6::jsonb)
  returning *
  `,
  channel,
  destination,
  provider,
  sport,
  subscriptionType,
  configJson
);

    return NextResponse.json({
      ok: true,
      subscription,
    });
} catch (err: any) {
  console.error("CREATE_SUBSCRIPTION_FAILED");
  console.error(err);
  console.error(err?.message);
  console.error(err?.stack);

  return NextResponse.json(
    {
      ok: false,
      error: "CREATE_SUBSCRIPTION_FAILED",
      details: err?.message ?? "unknown",
    },
    { status: 500 }
  );
}
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "sports subscriptions",
    method: "POST",
  });
}