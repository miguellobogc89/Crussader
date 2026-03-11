// app/api/crussader-assistant/integrations/live/sports/api-football/football/fixtures/route.ts

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE = "https://v3.football.api-sports.io";

function parseString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return "";
}

function parseNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function isValidDateString(value: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (!regex.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return true;
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.APIFOOTBALL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing APIFOOTBALL_API_KEY" },
        { status: 500 }
      );
    }

    const searchParams = req.nextUrl.searchParams;

    let date = parseString(searchParams.get("date"));
    if (date === "") {
      date = new Date().toISOString().slice(0, 10);
    }

    if (!isValidDateString(date)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid date. Expected format YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    const league = parseString(searchParams.get("league"));
    const season = parseString(searchParams.get("season"));
    const timezone = parseString(searchParams.get("timezone"));

    const url = new URL(`${API_BASE}/fixtures`);
    url.searchParams.set("date", date);

    if (league !== "") {
      url.searchParams.set("league", league);
    }

    if (season !== "") {
      url.searchParams.set("season", season);
    }

    if (timezone !== "") {
      url.searchParams.set("timezone", timezone);
    }

    const res = await fetch(url.toString(), {
      headers: {
        "x-apisports-key": apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();

      return NextResponse.json(
        {
          ok: false,
          error: "API_FOOTBALL_ERROR",
          details: text,
        },
        { status: 500 }
      );
    }

    const data = await res.json();

    let response: any[] = [];
    if (Array.isArray(data?.response)) {
      response = data.response;
    }

    const fixtures = response.map((m: any) => {
      const fixtureId = parseNullableNumber(m?.fixture?.id);
      const leagueId = parseNullableNumber(m?.league?.id);
      const homeTeamId = parseNullableNumber(m?.teams?.home?.id);
      const awayTeamId = parseNullableNumber(m?.teams?.away?.id);
      const minute = parseNullableNumber(m?.fixture?.status?.elapsed);
      const homeGoals = parseNullableNumber(m?.goals?.home);
      const awayGoals = parseNullableNumber(m?.goals?.away);

      return {
        fixtureId,
        leagueId,
        league: parseString(m?.league?.name),
        country: parseString(m?.league?.country),
        date: parseString(m?.fixture?.date),
        timestamp: parseNullableNumber(m?.fixture?.timestamp),
        status: parseString(m?.fixture?.status?.short),
        statusLong: parseString(m?.fixture?.status?.long),
        minute,
        homeTeamId,
        home: parseString(m?.teams?.home?.name),
        awayTeamId,
        away: parseString(m?.teams?.away?.name),
        goals: {
          home: homeGoals,
          away: awayGoals,
        },
      };
    });

return NextResponse.json({
  ok: true,
  debug: {
    date,
    league,
    season,
    timezone,
    finalUrl: url.toString(),
  },
  total: fixtures.length,
  fixtures,
});
  } catch (err: any) {
    let details = "Unknown error";

    if (err instanceof Error) {
      details = err.message;
    }

    return NextResponse.json(
      {
        ok: false,
        error: "UNEXPECTED_ERROR",
        details,
      },
      { status: 500 }
    );
  }
}