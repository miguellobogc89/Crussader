// app/api/crussader-assistant/sports/football/sender/route.ts
import { NextResponse } from "next/server";
import { runFootballDeliverySender } from "@/lib/crussader-assistant/sports/football/runFootballDeliverySender";

export async function POST() {

  const result = await runFootballDeliverySender();

  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "football sender",
    method: "POST"
  });
}