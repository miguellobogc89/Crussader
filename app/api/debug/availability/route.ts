//app/api/debug/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { appointmentAvailabilityLookup } from "@/lib/agents/actions/appointmentAvailabilityLookup";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const sessionId = url.searchParams.get("sessionId") || "debug-session";
    const companyId = url.searchParams.get("companyId") || "";
    const serviceId = url.searchParams.get("serviceId") || "";
    const locationId = url.searchParams.get("locationId") || "";
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    if (!companyId || !serviceId || !locationId || !from || !to) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing query params. Required: companyId, serviceId, locationId, from, to",
        },
        { status: 400 }
      );
    }

    const result = await appointmentAvailabilityLookup({
      sessionId,
      companyId,
      serviceId,
      locationId,
      from,
      to,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}