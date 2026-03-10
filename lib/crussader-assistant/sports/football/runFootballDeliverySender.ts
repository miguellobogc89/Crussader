import { prisma } from "@/lib/prisma";

type PendingDelivery = {
  id: string;
  destination: string;
  event_type: string;
  event_detail: string | null;
  team_name: string | null;
  fixture_id: number;
  event_elapsed: number | null;
  home_team_name: string | null;
  away_team_name: string | null;
  home_goals: number | null;
  away_goals: number | null;
};

type TemplatePayload = {
  templateName: string;
  variables: string[];
};

function buildScoreString(delivery: PendingDelivery): string {
  const homeTeam = delivery.home_team_name ?? "Local";
  const awayTeam = delivery.away_team_name ?? "Visitante";

  let homeGoals = "0";
  let awayGoals = "0";

  if (typeof delivery.home_goals === "number") {
    homeGoals = String(delivery.home_goals);
  }

  if (typeof delivery.away_goals === "number") {
    awayGoals = String(delivery.away_goals);
  }

  return `${homeTeam} ${homeGoals} - ${awayGoals} ${awayTeam}`;
}

function buildMatchString(delivery: PendingDelivery): string {
  const homeTeam = delivery.home_team_name ?? "Local";
  const awayTeam = delivery.away_team_name ?? "Visitante";

  return `${homeTeam} vs ${awayTeam}`;
}

function buildMinuteString(delivery: PendingDelivery): string {
  if (typeof delivery.event_elapsed === "number") {
    return String(delivery.event_elapsed);
  }

  return "0";
}

function buildTemplatePayload(delivery: PendingDelivery): TemplatePayload {
  if (delivery.event_type === "Goal") {
    return {
      templateName: "sports_goal_alert",
      variables: [
        delivery.team_name ?? "Equipo",
        buildScoreString(delivery),
        buildMinuteString(delivery),
      ],
    };
  }

  if (delivery.event_type === "Card" && delivery.event_detail === "Red Card") {
    return {
      templateName: "sports_red_card_alert",
      variables: [
        delivery.team_name ?? "Equipo",
        buildScoreString(delivery),
        buildMinuteString(delivery),
      ],
    };
  }

  if (delivery.event_type === "Match Start" || delivery.event_type === "Start") {
    return {
      templateName: "sports_match_start",
      variables: [buildMatchString(delivery)],
    };
  }

  if (delivery.event_type === "Half Time" || delivery.event_type === "Break Time") {
    return {
      templateName: "sports_match_status",
      variables: ["Descanso", buildScoreString(delivery)],
    };
  }

  if (delivery.event_type === "Match Finished" || delivery.event_type === "End") {
    return {
      templateName: "sports_match_status",
      variables: ["Final del partido", buildScoreString(delivery)],
    };
  }

  return {
    templateName: "sports_match_status",
    variables: ["Actualización", buildScoreString(delivery)],
  };
}

async function sendWhatsappTemplate(
  destination: string,
  templateName: string,
  variables: string[]
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_PERMANENT_TOKEN;

  if (!phoneNumberId) {
    throw new Error("Missing WHATSAPP_PHONE_NUMBER_ID");
  }

  if (!token) {
    throw new Error("Missing WHATSAPP_PERMANENT_TOKEN");
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: destination,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "es",
          },
          components: [
            {
              type: "body",
              parameters: variables.map((value) => ({
                type: "text",
                text: value,
              })),
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText);
  }
}

export async function runFootballDeliverySender() {
  const deliveries = await prisma.$queryRawUnsafe<PendingDelivery[]>(`
    select
      d.id,
      d.destination,
      e.event_type,
      e.event_detail,
      e.team_name,
      e.fixture_id,
      e.event_elapsed,
      f.home_team_name,
      f.away_team_name,
      f.home_goals,
      f.away_goals
    from football_subscription_delivery d
    join live_football_event e
      on e.id = d.event_id
    join live_football_fixture f
      on f.provider = e.provider
     and f.fixture_id = e.fixture_id
    where
      d.delivery_status = 'pending'
      or (
        d.delivery_status = 'failed'
        and d.retry_count < 3
        and (
          d.next_retry_at is null
          or d.next_retry_at <= now()
        )
      )
    order by d.created_at asc
    limit 20
  `);

  let sent = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    try {
      const payload = buildTemplatePayload(delivery);

      await sendWhatsappTemplate(
        delivery.destination,
        payload.templateName,
        payload.variables
      );

      await prisma.$executeRawUnsafe(`
        update football_subscription_delivery
        set delivery_status = 'sent',
            delivered_at = now(),
            error_message = null,
            next_retry_at = null,
            updated_at = now()
        where id = '${delivery.id}'
      `);

      sent += 1;
    } catch (err: any) {
      const safeMessage = String(err?.message ?? "unknown").replace(/'/g, "''");

      await prisma.$executeRawUnsafe(`
        update football_subscription_delivery
        set delivery_status = 'failed',
            error_message = '${safeMessage}',
            retry_count = retry_count + 1,
            next_retry_at = now() + interval '5 minutes',
            updated_at = now()
        where id = '${delivery.id}'
      `);

      failed += 1;
    }
  }

  return {
    ok: true,
    processed: deliveries.length,
    sent,
    failed,
  };
}