import { NextResponse } from "next/server";
import { llmGroupConcepts } from "@/app/server/topics/llmCluster";

export async function GET(req: Request) {
  // Preview fijo: dryRun=true, limit=200 (ajusta si quieres)
  const result = await llmGroupConcepts({ dryRun: true, limit: 200 });
  return NextResponse.json(result);
}
