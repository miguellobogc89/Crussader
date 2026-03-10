// lib/crussader-assistant/sports/football/runFootballEventDetector.ts
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RunFootballEventDetectorResult = {
  ok: true;
  matched: number;
  created: number;
};

export async function runFootballEventDetector(): Promise<RunFootballEventDetectorResult> {
  const rows = await prisma.$queryRaw<
    Array<{
      event_id: string;
      subscription_id: string;
      channel: string;
      destination: string;
    }>
  >(Prisma.sql`
    select
      e.id as event_id,
      s.id as subscription_id,
      s.channel,
      s.destination
    from live_football_event e
    inner join live_football_fixture f
      on f.provider = e.provider
     and f.fixture_id = e.fixture_id
    inner join football_subscription s
      on s.is_active = true
     and s.provider = e.provider
     and s.sport = e.sport
    where
      (
        s.subscription_type = 'team_event'
        and (s.config->>'team_id') is not null
        and (s.config->>'event_type') is not null
        and (s.config->>'team_id')::bigint = e.team_id
        and lower(s.config->>'event_type') = lower(
        case
        when e.event_type = 'Goal' then 'goal'
        when e.event_type = 'Card' and e.event_detail = 'Red Card' then 'red_card'
        when e.event_type = 'Match Start' then 'match_start'
        when e.event_type = 'Start' then 'match_start'
        when e.event_type = 'Half Time' then 'halftime'
        when e.event_type = 'Break Time' then 'halftime'
        when e.event_type = 'Match Finished' then 'fulltime'
        when e.event_type = 'End' then 'fulltime'
        else ''
        end
        )
      )
      or
      (
        s.subscription_type = 'competition_event'
        and (s.config->>'league_id') is not null
        and (s.config->>'event_type') is not null
        and (s.config->>'league_id')::bigint = f.league_id
        and lower(s.config->>'event_type') = lower(
          case
            when e.event_type = 'Goal' then 'goal'
            when e.event_type = 'Card' and e.event_detail = 'Red Card' then 'red_card'
            else ''
          end
        )
      )
      or
      (
        s.subscription_type = 'all_live'
        and (s.config->>'event_type') is not null
        and lower(s.config->>'event_type') = lower(
          case
            when e.event_type = 'Goal' then 'goal'
            when e.event_type = 'Card' and e.event_detail = 'Red Card' then 'red_card'
            else ''
          end
        )
      )
  `);

  let created = 0;

  for (const row of rows) {
    const inserted = await prisma.$executeRaw(
      Prisma.sql`
        insert into football_subscription_delivery (
          subscription_id,
          event_id,
          channel,
          destination,
          delivery_status,
          created_at,
          updated_at
        )
        values (
          ${row.subscription_id}::uuid,
          ${row.event_id}::uuid,
          ${row.channel},
          ${row.destination},
          'pending',
          now(),
          now()
        )
        on conflict (subscription_id, event_id)
        do nothing
      `
    );

    if (typeof inserted === "number") {
      if (inserted > 0) {
        created += inserted;
      }
    }
  }

  return {
    ok: true,
    matched: rows.length,
    created,
  };
}