// agent-flow.js
import { getAgentSettings } from "./agent-settings.js";
import { fetchBootstrap, computeFreeSlotsAndBlocks, pickRepresentativeSlots, fmtDate } from "./agent-openai-mock.js";

// Simula búsqueda de cliente por nombre/teléfono (conecta a tu BBDD cuando la tengas)
async function findCustomer({ name, phone }) {
  // TODO: integra aquí tu prisma.customer.findFirst
  return null; // simular: no encontrado
}

function normalizeService(nlu, text) {
  const t = (text || "").toLowerCase();
  for (const [canon, aliases] of Object.entries(nlu.services || {})) {
    if (aliases.some(a => t.includes(a.toLowerCase()))) return canon;
  }
  for (const [canon, aliases] of Object.entries(nlu.actions || {})) {
    if (aliases.some(a => t.includes(a.toLowerCase()))) return canon; // p.ej. "modificar"
  }
  return null;
}

export async function runFlowTurn({ companyId, state, userText }) {
  const { settings, bootstrap } = await getAgentSettings(companyId);
  const flow = settings.flow;

  // 1) IDENTIFY
  if (state.phase === "identify") {
    if (!state.customer?.name) {
      // pedir nombre y apellidos
      return {
        nextState: { ...state, phase: "identify", asked: "name" },
        reply: flow.identify.assistantPrompt
      };
    }
    // si no ficha -> pedir teléfono
    if (!state.customer?.id && !state.customer?.phone) {
      return {
        nextState: { ...state, phase: "identify", asked: "phone" },
        reply: flow.identify.missingPhoneFollowup || "¿Me dejas un teléfono de contacto?"
      };
    }
    // identificado → pasar a intent
    return {
      nextState: { ...state, phase: "intent" },
      reply: flow.intent.assistantPrompt
    };
  }

  // 2) INTENT → mapear a servicio/acción
  if (state.phase === "intent") {
    const mapped = normalizeService(settings.nlu, userText);
    if (!mapped) {
      // no entendido
      if (state.intentRetries >= 1) {
        const note = (flow.fallback.leaveCommentTemplate || "Cliente: {{rawUserText}}")
          .replace("{{rawUserText}}", userText || "");
        return {
          nextState: { ...state, phase: "fallback", comment: note },
          reply: flow.fallback.secondRetry
        };
      }
      return {
        nextState: { ...state, phase: "intent", intentRetries: (state.intentRetries || 0) + 1 },
        reply: flow.fallback.firstRetry
      };
    }

    // 3) SERVICE PIPELINE (ej.: higiene)
    if (mapped === "higiene" || mapped === "revisión" || mapped === "modificar") {
      const locTitle = "Clínica HiperDental Centro";
      const svcName = mapped === "higiene" ? "Limpieza Dental" :
                      mapped === "revisión" ? "Revisión" : "Limpieza Dental";

      const { blocks, slots, dateISO, durationMin } = computeFreeSlotsAndBlocks({
        bootstrap,
        locationTitle: locTitle,
        serviceName: svcName
      });

      const suggested = pickRepresentativeSlots(slots, blocks, settings.style.suggestMaxSlots || 3)
        .map(s => s.startLocal).join(", ") || "(sin sugerencias)";

      const pipeline = flow.servicePipelines[mapped] || {};
      const checklist = pipeline.checklist || [];
      const confirm = (pipeline.confirmPrompt || "Tengo {{slots}} en {{location}}. ¿Cuál te encaja?")
        .replace("{{slots}}", suggested)
        .replace("{{location}}", locTitle);

      const preQ = checklist.length ? (checklist[0] + (checklist[1] ? " " + checklist[1] : "")) : "";

      return {
        nextState: {
          ...state,
          phase: "service",
          service: mapped,
          meta: {
            locationTitle: locTitle,
            serviceName: svcName,
            dateISO,
            dateHuman: fmtDate(dateISO),
            durationMin
          },
          suggested
        },
        reply: preQ ? `${confirm}\n${preQ}` : confirm
      };
    }

    // servicio desconocido (pero mapeado distinto)
    return {
      nextState: { ...state, phase: "intent" },
      reply: flow.fallback.firstRetry
    };
  }

  // 4) SERVICE: aquí continuarías con más preguntas del checklist, recoges preferencia tarde/mañana, profesional, etc.
  if (state.phase === "service") {
    // Por simplicidad, confirmamos si el usuario menciona una de las horas sugeridas:
    const hours = (state.suggested || "").split(",").map(s => s.trim()).filter(Boolean);
    const pick = hours.find(h => (userText || "").includes(h));
    if (pick) {
      return {
        nextState: { ...state, phase: "confirm", picked: pick },
        reply: `Perfecto, anoto ${pick}. ¿Quieres que lo deje confirmado a tu nombre o prefieres que te llamemos para validar un detalle?`
      };
    }
    // Si no selecciona, repregunta
    return {
      nextState: { ...state, phase: "service" },
      reply: `¿Te encaja alguna de estas horas: ${state.suggested}?`
    };
  }

  // 5) FALLBACK
  if (state.phase === "fallback") {
    return { nextState: state, reply: flow.fallback.secondRetry };
  }

  return { nextState: state, reply: "¿Puedes repetirlo, por favor?" };
}
