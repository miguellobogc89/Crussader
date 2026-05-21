// app/api/calendar/settings/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  var _prisma: PrismaClient | undefined;
}

if (!global._prisma) {
  global._prisma = new PrismaClient();
}

prisma = global._prisma;

const VALID_VIEWS = ["day", "threeDays", "workingWeek", "week", "month"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");

  if (!locationId) {
    return NextResponse.json(
      { ok: false, error: "locationId requerido" },
      { status: 400 }
    );
  }

  const settings = await prisma.calendarSettings.upsert({
    where: { locationId },
    update: {},
    create: {
      locationId,
      visibleStartHour: 10,
      visibleEndHour: 21,
      defaultView: "week",
    },
  });

  return NextResponse.json({
    ok: true,
    item: settings,
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();

  const {
    locationId,
    visibleStartHour,
    visibleEndHour,
    defaultView,
  } = body ?? {};

  if (!locationId) {
    return NextResponse.json(
      { ok: false, error: "locationId requerido" },
      { status: 400 }
    );
  }

  const data: any = {};

  if (Number.isInteger(visibleStartHour)) {
    data.visibleStartHour = visibleStartHour;
  }

  if (Number.isInteger(visibleEndHour)) {
    data.visibleEndHour = visibleEndHour;
  }

  if (VALID_VIEWS.includes(defaultView)) {
    data.defaultView = defaultView;
  }

  const settings = await prisma.calendarSettings.upsert({
    where: { locationId },
    update: data,
    create: {
      locationId,
      visibleStartHour: data.visibleStartHour ?? 10,
      visibleEndHour: data.visibleEndHour ?? 21,
      defaultView: data.defaultView ?? "week",
    },
  });

  return NextResponse.json({
    ok: true,
    item: settings,
  });
}