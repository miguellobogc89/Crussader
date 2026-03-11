// app/api/crussader-assistant/sports/football/debug/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const subscriptions = await prisma.$queryRawUnsafe(`
      select
        id,
        channel,
        destination,
        provider,
        sport,
        subscription_type,
        config,
        is_active,
        created_at
      from football_subscription
      order by created_at desc
      limit 10
    `);

    const events = await prisma.$queryRawUnsafe(`
      select
        id,
        provider,
        sport,
        fixture_id,
        event_elapsed,
        event_type,
        event_detail,
        team_id,
        team_name,
        player_id,
        player_name,
        created_at
      from live_football_event
      order by created_at desc
      limit 10
    `);

    const deliveries = await prisma.$queryRawUnsafe(`
      select
        id,
        subscription_id,
        event_id,
        channel,
        destination,
        delivery_status,
        delivered_at,
        error_message,
        created_at
      from football_subscription_delivery
      order by created_at desc
      limit 10
    `);

    return NextResponse.json({
      ok: true,
      subscriptions,
      events,
      deliveries,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "DEBUG_ROUTE_FAILED",
        details: err?.message ?? "unknown",
      },
      { status: 500 }
    );
  }
}