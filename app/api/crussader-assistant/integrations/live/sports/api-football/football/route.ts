// app/api/crussader-assistant/integrations/live/sports/api-football/football/route.ts

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const API_BASE = "https://v3.football.api-sports.io";
const PROVIDER = "api-football";
const SPORT = "football";

const ALLOWED_COMPETITIONS = new Set<string>([
  "UEFA Champions League|World",
  "UEFA Europa League|World",
  "UEFA Europa Conference League|World",

  "La Liga|Spain",
  "Segunda División|Spain",

  "Premier League|England",
  "Bundesliga|Germany",
  "Serie A|Italy",
  "Ligue 1|France",
  "Eredivisie|Netherlands",
  "Primeira Liga|Portugal",

  "CONMEBOL Libertadores|World",
  "CONMEBOL Sudamericana|World",

  "Liga Profesional Argentina|Argentina",
  "Serie A|Brazil",
  "Primera División|Chile",
  "Primera A|Colombia",
  "Liga Pro|Ecuador",
]);

type LiveFootballMatch = {
  fixtureId: number;
  leagueId: number | null;
  league: string;
  country: string;
  homeTeamId: number | null;
  home: string;
  awayTeamId: number | null;
  away: string;
  status: string;
  minute: number | null;
  goals: {
    home: number | null;
    away: number | null;
  };
  startedAt: Date | null;
  rawPayload: any;
};

function parseNullableNumber(value: unknown): number | null {
  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return value;
    }
  }

  if (typeof value === "string") {
    if (value.trim() !== "") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function parseString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return "";
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  if (value.trim() === "") {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function buildEventKey(args: {
  provider: string;
  fixtureId: number;
  elapsed: number | null;
  extra: number | null;
  type: string;
  detail: string;
  teamId: number | null;
  playerId: number | null;
  assistId: number | null;
}): string {
  const parts = [
    args.provider,
    String(args.fixtureId),
    String(args.elapsed),
    String(args.extra),
    args.type,
    args.detail,
    String(args.teamId),
    String(args.playerId),
    String(args.assistId),
  ];

  return parts.join(":");
}

export async function GET() {
  try {
    const apiKey = process.env.APIFOOTBALL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing APIFOOTBALL_API_KEY",
        },
        { status: 500 }
      );
    }

    const res = await fetch(`${API_BASE}/fixtures?live=all`, {
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

    const matches: LiveFootballMatch[] = response.map((m: any) => {
      let fixtureId = 0;

      const fixtureIdRaw = parseNullableNumber(m?.fixture?.id);
      if (fixtureIdRaw !== null) {
        fixtureId = fixtureIdRaw;
      }

      const leagueId = parseNullableNumber(m?.league?.id);
      const homeTeamId = parseNullableNumber(m?.teams?.home?.id);
      const awayTeamId = parseNullableNumber(m?.teams?.away?.id);
      const minute = parseNullableNumber(m?.fixture?.status?.elapsed);
      const homeGoals = parseNullableNumber(m?.goals?.home);
      const awayGoals = parseNullableNumber(m?.goals?.away);
      const startedAt = parseDate(m?.fixture?.date);

      return {
        fixtureId,
        leagueId,
        league: parseString(m?.league?.name),
        country: parseString(m?.league?.country),
        homeTeamId,
        home: parseString(m?.teams?.home?.name),
        awayTeamId,
        away: parseString(m?.teams?.away?.name),
        status: parseString(m?.fixture?.status?.short),
        minute,
        goals: {
          home: homeGoals,
          away: awayGoals,
        },
        startedAt,
        rawPayload: m,
      };
    });

    let persisted = 0;
    let insertedEvents = 0;
    const visibleMatches: LiveFootballMatch[] = [];

    for (const match of matches) {
      if (!match.fixtureId) {
        continue;
      }

      const competitionKey = `${match.league}|${match.country}`;

      if (!ALLOWED_COMPETITIONS.has(competitionKey)) {
        continue;
      }

      visibleMatches.push(match);

      await prisma.$executeRaw(
        Prisma.sql`
          insert into live_football_fixture (
            provider,
            sport,
            fixture_id,
            league_id,
            league_name,
            country_name,
            home_team_id,
            home_team_name,
            away_team_id,
            away_team_name,
            status_short,
            minute,
            home_goals,
            away_goals,
            started_at,
            raw_payload,
            first_seen_at,
            last_seen_at,
            created_at,
            updated_at
          )
          values (
            ${PROVIDER},
            ${SPORT},
            ${match.fixtureId},
            ${match.leagueId},
            ${match.league},
            ${match.country},
            ${match.homeTeamId},
            ${match.home},
            ${match.awayTeamId},
            ${match.away},
            ${match.status},
            ${match.minute},
            ${match.goals.home},
            ${match.goals.away},
            ${match.startedAt},
            ${JSON.stringify(match.rawPayload)}::jsonb,
            now(),
            now(),
            now(),
            now()
          )
          on conflict (provider, fixture_id)
          do update set
            league_id = excluded.league_id,
            league_name = excluded.league_name,
            country_name = excluded.country_name,
            home_team_id = excluded.home_team_id,
            home_team_name = excluded.home_team_name,
            away_team_id = excluded.away_team_id,
            away_team_name = excluded.away_team_name,
            status_short = excluded.status_short,
            minute = excluded.minute,
            home_goals = excluded.home_goals,
            away_goals = excluded.away_goals,
            started_at = excluded.started_at,
            raw_payload = excluded.raw_payload,
            last_seen_at = now(),
            updated_at = now()
        `
      );

      persisted += 1;

      let events: any[] = [];

      if (Array.isArray(match.rawPayload?.events)) {
        events = match.rawPayload.events;
      }

      for (const ev of events) {
        const elapsed = parseNullableNumber(ev?.time?.elapsed);
        const extra = parseNullableNumber(ev?.time?.extra);

        const type = parseString(ev?.type);
        const detail = parseString(ev?.detail);
        const comments = parseString(ev?.comments);

        const teamId = parseNullableNumber(ev?.team?.id);
        const teamName = parseString(ev?.team?.name);

        const playerId = parseNullableNumber(ev?.player?.id);
        const playerName = parseString(ev?.player?.name);

        const assistId = parseNullableNumber(ev?.assist?.id);
        const assistName = parseString(ev?.assist?.name);

        const eventKey = buildEventKey({
          provider: PROVIDER,
          fixtureId: match.fixtureId,
          elapsed,
          extra,
          type,
          detail,
          teamId,
          playerId,
          assistId,
        });

        const insertedRows = await prisma.$executeRaw(
          Prisma.sql`
            insert into live_football_event (
              provider,
              sport,
              fixture_id,
              event_elapsed,
              event_extra,
              event_type,
              event_detail,
              event_comments,
              team_id,
              team_name,
              player_id,
              player_name,
              assist_id,
              assist_name,
              event_key,
              raw_payload,
              first_seen_at,
              created_at,
              updated_at
            )
            values (
              ${PROVIDER},
              ${SPORT},
              ${match.fixtureId},
              ${elapsed},
              ${extra},
              ${type},
              ${detail},
              ${comments},
              ${teamId},
              ${teamName},
              ${playerId},
              ${playerName},
              ${assistId},
              ${assistName},
              ${eventKey},
              ${JSON.stringify(ev)}::jsonb,
              now(),
              now(),
              now()
            )
            on conflict (event_key)
            do nothing
          `
        );

        if (typeof insertedRows === "number") {
          if (insertedRows > 0) {
            insertedEvents += insertedRows;
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      total: visibleMatches.length,
      persisted,
      insertedEvents,
      matches: visibleMatches.map((match) => ({
        fixtureId: match.fixtureId,
        leagueId: match.leagueId,
        league: match.league,
        country: match.country,
        status: match.status,
        minute: match.minute,
        home: match.home,
        away: match.away,
        goals: match.goals,
      })),
    });
  } catch (err: unknown) {
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