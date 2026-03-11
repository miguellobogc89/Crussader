// lib/brain/brainTick.ts
import type { BrainInsight, BrainContextV1 } from "@/lib/brain/types";

export function brainTick(ctx: BrainContextV1): BrainInsight[] {
  const insights: BrainInsight[] = [];

  if (ctx.scope.mode === "single_location") {
    insights.push({
      code: "SCOPE_SINGLE_LOCATION",
      severity: "info",
      text: `Scope: 1 location (${ctx.scope.primaryLocationId}) tz=${ctx.scope.primaryTimezone}.`,
    });
  } else {
    insights.push({
      code: "SCOPE_MULTI_LOCATION",
      severity: "warn",
      text: `Scope: multi-location (${ctx.facts.locations.length}). Necesito desambiguar locationId antes de ejecutar acciones.`,
    });
  }

  const apptCount = ctx.state.appointments.items.length;
  if (apptCount === 0) {
    insights.push({
      code: "APPTS_EMPTY",
      severity: "info",
      text:
        "No hay citas en ventana (" +
        ctx.windows.appointments.apptWindowStart +
        " → " +
        ctx.windows.appointments.apptWindowEnd +
        ").",
    });
  }

  const reviewItems = ctx.state.reviews.items;
  const reviewCount = reviewItems.length;
  if (reviewCount > 0) {
    let unanswered = 0;
    for (const r of reviewItems) {
      if (!r.responded) unanswered += 1;
    }

    if (unanswered > 0) {
      insights.push({
        code: "REVIEWS_BACKLOG",
        severity: "warn",
        text: "Reseñas en ventana: " + reviewCount + ". Sin responder: " + unanswered + ".",
      });
    } else {
      insights.push({
        code: "REVIEWS_ALL_REPLIED",
        severity: "info",
        text: "Reseñas en ventana: " + reviewCount + ". Todas respondidas.",
      });
    }
  }

  return insights;
}