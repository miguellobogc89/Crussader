// agent-sim.js — Simulador de clientes (personas) y transcripciones
import {
  fetchBootstrap,
  computeFreeSlotsAndBlocks,
  blocksToHuman,
  askOpenAI,
  pickRepresentativeSlots,
  fmtDate,
} from "./agent-openai-mock.js";

// ===== Personas =====
const personas = {
  // Tipo 1: nueva higiene, prefiere tardes, si puede con Marta, evita Cristina.
  tipo1: {
    name: "Cliente Tipo 1",
    profile: {
      prefers: "tarde",
      preferredEmployee: "Marta",
      avoidEmployee: "Cristina",
      serviceName: "Limpieza Dental",
      locationTitle: "Clínica HiperDental Centro",
    },
    intro: "Hola, quería una higiene dental hoy si es posible. Si puede ser por la tarde y, si hay hueco, con Marta. Con Cristina no me he tratado antes.",
    strategy(agentMsg, ctx) {
      // Regla simple: si el agente ya ofrece una hora de tarde, acepta la primera.
      const hours = extractHours(agentMsg);
      const tarde = hours.filter(h => toMins(h) >= 16*60);
      if (tarde.length) {
        const pick = tarde[0];
        return `Perfecto, me quedo con las ${pick}. ¿Podría ser con Marta?`;
      }
      // Si no hay tarde, pide explícitamente tarde
      return "¿Tenéis algo a partir de las 17:00? Si puede ser con Marta, mejor.";
    }
  },

  // Tipo 2: cambiar cita (ya tiene nombre y teléfono)
  tipo2: {
    name: "Juan Pérez",
    phone: "+34 600 112 233",
    profile: {
      action: "modificar",
      serviceName: "Limpieza Dental",
      locationTitle: "Clínica HiperDental Centro",
    },
    intro: "Hola, soy Juan Pérez (tel. 600 112 233). Tengo una cita hoy a media mañana y me ha surgido un imprevisto. ¿Podemos moverla a última hora de hoy?",
    strategy(agentMsg, ctx) {
      // Si el agente ofrece últimas horas (>=18:00), acepta.
      const hours = extractHours(agentMsg);
      const tarde = hours.filter(h => toMins(h) >= 18*60);
      if (tarde.length) {
        return `Gracias, ¿me reservas a las ${tarde[0]} a mi nombre, Juan Pérez?`;
      }
      // Si no, pide la más tardía disponible.
      if (hours.length) {
        const last = hours[hours.length - 1];
        return `Si no queda más tarde, me vale a las ${last}. ¿Podemos confirmar?`;
      }
      return "¿Qué última hora tendríais hoy?";
    }
  }
};

// ===== Utilidades del simulador =====
function extractHours(text) {
  // Muy simple: busca HH:MM en el mensaje del agente
  const re = /(?:^|\b)([01]?\d|2[0-3]):([0-5]\d)\b/g;
  const res = [];
  let m;
  while ((m = re.exec(text)) !== null) res.push(`${m[1].padStart(2,"0")}:${m[2]}`);
  // quitar duplicados y ordenar
  return [...new Set(res)].sort((a,b)=>toMins(a)-toMins(b));
}
function toMins(hhmm) {
  const [h,m] = hhmm.split(":").map(Number);
  return h*60+m;
}

async function runScenario(persona) {
  const bootstrap = await fetchBootstrap();

  const { blocks, slots, dateISO, durationMin } = computeFreeSlotsAndBlocks({
    bootstrap,
    locationTitle: persona.profile.locationTitle,
    serviceName: persona.profile.serviceName,
  });

  const meta = {
    company: bootstrap.company?.name || "Empresa",
    locationTitle: persona.profile.locationTitle,
    serviceName: persona.profile.serviceName,
    dateISO,
    dateHuman: fmtDate(dateISO),
    durationMin,
  };

  const freeBlocksHuman = blocksToHuman(blocks, dateISO).join(", ") || "(sin tramos)";
  const suggested = pickRepresentativeSlots(slots, blocks, 3).map(s=>s.startLocal).join(", ");

  const transcript = [];

  // Cliente abre conversación
  transcript.push({ role: "cliente", text: persona.intro });

  // Agente responde
  const agent1 = await askOpenAI({
    question: persona.intro,
    meta, blocks, slots, suggestedSlotsText: suggested
  });
  transcript.push({ role: "agente", text: agent1 });

  // Cliente reacciona según estrategia de persona
  const client2 = persona.strategy(agent1, { meta, blocks, slots });
  transcript.push({ role: "cliente", text: client2 });

  // Agente responde de nuevo (reutiliza los mismos huecos de hoy; si quieres, aquí podrías recalcular filtrando por tarde)
  const agent2 = await askOpenAI({
    question: client2,
    meta, blocks, slots,
    suggestedSlotsText: suggested // podrías construir uno solo-tardes si quieres afinar
  });
  transcript.push({ role: "agente", text: agent2 });

  // mostrar
  console.log("\n────────────────────────────────────────────");
  console.log(`🎭 Persona: ${persona.name}`);
  console.log(`🗓️  Disponibilidad: ${freeBlocksHuman}`);
  console.log("💬 Transcripción:");
  for (const turn of transcript) {
    const who = turn.role === "agente" ? "Agente" : "Cliente";
    console.log(`${who}: ${turn.text}`);
  }
  console.log("────────────────────────────────────────────\n");
}

async function main() {
  await runScenario(personas.tipo1);
  await runScenario(personas.tipo2);
}

main().catch((e) => console.error("❌ Sim error:", e.message || e));
