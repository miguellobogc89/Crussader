// app/api/reviews/tasks/topics/route.ts
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "Usa GET /api/reviews/tasks/topics/list y POST /api/reviews/tasks/topics/recompute",
  });
}
