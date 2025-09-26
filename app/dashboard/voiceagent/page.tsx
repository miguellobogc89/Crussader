"use client";

import React, { useEffect, useMemo, useState } from "react";
import { computeGreeting, shortCompanyName, renderTemplate } from "./_lib/template";
import FlowEditor from "./components/FlowEditor";
import AgentsSidebar from "./components/AgentsSidebar";
import {
  listVoiceAgents,
  createVoiceAgent,
  duplicateVoiceAgent,
  deleteVoiceAgent,
  renameVoiceAgent,
  toggleVoiceAgent,
  type AgentListItem as DbAgentListItem,
} from "./agents.actions";
import { listStages, saveFlowForAgent, type Stage } from "./flow.actions";
import { getVoiceAgentIdByAgent } from "./agents.helpers";
import PhaseList from "@/app/dashboard/voiceagent/components/PhaseList";
import ChatPanel, { type ChatMessage, type QuickPersona } from "./components/ChatPanel";
import { loadCompanyMeta } from "./actions";
import {
  generateIntroFromPrompt,
  generateReplyFromPrompt,
  classifyTurn,
  type Slots,
  type TurnInference,
} from "./chat.actions";


// Personas rápidas (sandbox)
const PERSONAS: QuickPersona[] = [
  {
    key: "tipo1",
    label: "Cliente Tipo 1 (Higiene, tarde, Marta)",
    firstMessage:
      "Hola, quería una higiene dental hoy si es posible. Si puede ser por la tarde y, si hay hueco, con Marta. Con Cristina no me he tratado antes.",
  },
  {
    key: "tipo2",
    label: "Cliente Tipo 2 (Modificar cita a última hora)",
    firstMessage:
      "Hola, soy Juan Pérez (tel. 600 112 233). Tengo una cita hoy a media mañana y me ha surgido un imprevisto. ¿Podemos moverla a última hora de hoy?",
  },
];


const hasHandlebars = (s?: string) => !!s && /\{\{\s*[\w.]+\s*\}\}/.test(s);

type Phase = "INTRO" | "INTENT" | "COLLECT" | "CONFIRM" | "END";

/* ===== Helpers ===== */

// Regex básica para extraer “slots” de mensajes del cliente
function regexSlotExtract(text: string): Partial<Slots> {
  const out: Partial<Slots> = {};
  const phone = text.match(/\b(?:\+34\s*)?(?:\d[\s-]?){9,13}\b/);
  if (phone) out.phone = phone[0].replace(/\s|-/g, "");
  const name = text.match(/\b(mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/i);
  if (name) out.name = name[2];
  const avail = text.match(/\b(mañana|tarde|noche|lunes|martes|miércoles|miercoles|jueves|viernes|sáb|sab|sábado|domingo)[^.!?]{0,40}/i);
  if (avail) out.availability = avail[0];
  return out;
}

// Detección de “volver a COLLECT” si el cliente aporta/actualiza datos en cualquier punto
function shouldReopenCollect(
  userText: string,
  llmInf: TurnInference,
  prev: Slots,
  next: Slots,
  curr: Phase
): boolean {
  // Si detectamos nuevos datos o cambios en los existentes
  const provided = llmInf.intent === "provide_data" || /te doy|mejor usa|otro.*tel|cambio/i.test(userText);
  const phoneChanged = next.phone && next.phone !== prev.phone;
  const nameChanged = next.name && next.name !== prev.name;
  const availChanged = next.availability && next.availability !== prev.availability;

  // Volver a COLLECT si hay datos nuevos o actualizados, incluso desde CONFIRM
  if (provided && (phoneChanged || nameChanged || availChanged)) return true;

  // Si en fases tempranas el usuario ya da datos, podemos saltar a COLLECT
  if ((curr === "INTRO" || curr === "INTENT") && (next.name || next.phone || next.availability)) return true;

  return false;
}

// Avance secuencial por defecto (si no se reabre COLLECT)
function nextPhase(curr: Phase, inf: TurnInference, merged: Slots): Phase {
  if (inf.intent === "cancel") return "END";
  if (curr === "INTRO") return "INTENT";
  if (curr === "INTENT") {
    // Si ya hay algo de datos, pasa a COLLECT; si no, sigue en INTENT
    if (merged.name || merged.phone || merged.availability) return "COLLECT";
    return "INTENT";
  }
  if (curr === "COLLECT") {
    if (merged.name && merged.phone && merged.availability) return "CONFIRM";
    return "COLLECT";
  }
  return curr;
}

export default function VoiceAgentConstructorPage() {
  // Agentes
  const [agents, setAgents] = useState<DbAgentListItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);

  // Empresa
  const [companyId] = useState<string>("cmfmxqxqx0000i5i4ph2bb3ij");
  const [companyName, setCompanyName] = useState<string>("—");
  const companyShort = useMemo(() => shortCompanyName(companyName), [companyName]);

  // Flujo del agente
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Motor de fases + slots
  const [currentPhase, setCurrentPhase] = useState<Phase>("INTRO");
  const [slots, setSlots] = useState<Slots>({});

  // Cargar agentes
  useEffect(() => {
    (async () => {
      const list = await listVoiceAgents(companyId);
      setAgents(list);
      setSelectedAgentId(list[0]?.id ?? undefined);
    })();
  }, [companyId]);

  // Cargar nombre empresa
  useEffect(() => {
    (async () => {
      const meta = await loadCompanyMeta(companyId);
      setCompanyName(meta?.name || "—");
    })();
  }, [companyId]);

  // Cargar fases al cambiar de agente
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingStages(true);
      try {
        if (!selectedAgentId) {
          if (alive) setStages([]);
          return;
        }
        const voiceAgentId = await getVoiceAgentIdByAgent(selectedAgentId);
        if (!voiceAgentId) {
          if (alive) setStages([]);
          return;
        }
        const flow = await listStages(voiceAgentId);
        if (alive) setStages(flow ?? []);
      } finally {
        if (alive) setLoadingStages(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedAgentId]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  // Prompts por fase
  const orderedStages = useMemo(
    () => [...stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [stages]
  );

  const promptsByPhase = useMemo(() => {
    const pick = (t: string) => orderedStages.find((s) => s.type === (t as any))?.prompt?.trim();
    return {
      INTRO: pick("INTRO"),
      INTENT:
        pick("INTENT") ??
        orderedStages.find((s) => s.type !== "INTRO")?.prompt?.trim(),
      COLLECT: pick("COLLECT"),
      CONFIRM: pick("CONFIRM"),
    } as Record<Phase, string | undefined>;
  }, [orderedStages]);

  // Iniciar conversación SIEMPRE desde la fase 1 (INTRO si existe; si no, el primer stage)
  const resetDialog = async () => {
    setCurrentPhase("INTRO");
    setSlots({});

    const phase1Prompt =
      (promptsByPhase.INTRO && promptsByPhase.INTRO.trim() !== "" ? promptsByPhase.INTRO : undefined) ??
      orderedStages[0]?.prompt?.trim();

    const ctx = { greeting: computeGreeting(), companyName, companyShort };
    let first: string;

    if (phase1Prompt && hasHandlebars(phase1Prompt)) {
      first = renderTemplate(phase1Prompt as string, {
        greeting: ctx.greeting,
        company: { name: ctx.companyName, short: ctx.companyShort },
      });
    } else if (phase1Prompt) {
      first = await generateIntroFromPrompt({
        prompt: phase1Prompt,
        ctx,
        model: "gpt-4o-mini",
        temperature: 0.4,
        maxTokens: 120,
      });
    } else {
      first = `${ctx.greeting}. Has llamado a ${ctx.companyShort}. ¿En qué puedo ayudarte?`;
    }

    setMessages([{ who: "agent", text: first }]);
    setInput("");
    setCurrentPhase("INTENT");
  };

  // Enviar turno del cliente → IA
  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { who: "user", text: trimmed };
    setMessages((xs) => [...xs, userMsg]);
    setInput("");

    setSending(true);
    try {
      // 1) Inferencia ligera + fusión de slots
      const prevSlots = { ...slots };
      const regexUpdates = regexSlotExtract(trimmed);
      const llmInf = await classifyTurn({ userText: trimmed, ctx: { companyShort } });
      const merged: Slots = { ...prevSlots, ...regexUpdates, ...llmInf.slotUpdates };
      setSlots(merged);

      // 2) Flex: si el cliente aporta/actualiza datos, reabrimos COLLECT
      let next: Phase = currentPhase;
      if (shouldReopenCollect(trimmed, llmInf, prevSlots, merged, currentPhase)) {
        next = "COLLECT";
      } else {
        // Si no, avanzamos secuencial por regla
        next = nextPhase(currentPhase, llmInf, merged);
      }
      setCurrentPhase(next);

      // 3) Prompt de la fase resultante
      const phasePrompt =
        promptsByPhase[next] ||
        "Actúa como recepcionista. Ayuda brevemente y conduce al siguiente paso. Si faltan datos, pídelos de forma natural. Trata al cliente por su nombre de pila si está disponible.";

      const history = [...messages, userMsg].map((m) => ({
        role: m.who === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      // 4) Responder
      const agentText = await generateReplyFromPrompt({
        stagePrompt: phasePrompt,
        messages: history,
        ctx: {
          greeting: computeGreeting(),
          companyName,
          companyShort,
          phase: next,
          slots: merged,
        },
        model: "gpt-4o-mini",
        temperature: 0.5,
        maxTokens: 220,
      });

      setMessages((xs) => [...xs, { who: "agent", text: agentText }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] w-full bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-slate-900 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Fila superior: agentes · editor · fases sugeridas */}
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[320px_1fr_320px]">
          <div className="min-h-[560px]">
            <AgentsSidebar
              agents={agents}
              selectedId={selectedAgentId}
              onSelect={(id) => setSelectedAgentId(id)}
              onCreate={async () => {
                const created = await createVoiceAgent(companyId);
                setAgents((xs) => [created, ...xs]);
                setSelectedAgentId(created.id);
              }}
              onDuplicate={async (id) => {
                const dup = await duplicateVoiceAgent(id);
                setAgents((xs) => [dup, ...xs]);
                setSelectedAgentId(dup.id);
              }}
              onDelete={async (id) => {
                await deleteVoiceAgent(id);
                setAgents((xs) => xs.filter((a) => a.id !== id));
                if (selectedAgentId === id) {
                  setSelectedAgentId((xs) =>
                    agents[0]?.id && agents[0].id !== id ? agents[0].id : undefined
                  );
                }
              }}
              onRename={async (id, name) => {
                await renameVoiceAgent(id, name);
                setAgents((xs) =>
                  xs.map((a) =>
                    a.id === id ? { ...a, name, updatedAt: new Date().toISOString() } : a
                  )
                );
              }}
              onToggleActive={async (id, next) => {
                await toggleVoiceAgent(id, next);
                setAgents((xs) =>
                  xs.map((a) =>
                    a.id === id ? { ...a, isActive: next, updatedAt: new Date().toISOString() } : a
                  )
                );
              }}
            />
          </div>

          <div className="min-h-[560px]">
            <FlowEditor
              initialFlow={stages}
              onChange={(flow) => setStages(flow)}
              onSave={async (flow) => {
                if (!selectedAgentId) return;
                const voiceAgentId = await getVoiceAgentIdByAgent(selectedAgentId);
                if (!voiceAgentId) return;
                await saveFlowForAgent(voiceAgentId, flow);
              }}
              agentName={selectedAgent?.name}
              loading={loadingStages}
            />
          </div>

          <div className="min-h-[560px]">
            <PhaseList onSelect={(_tpl) => { /* próxima iteración: insertar plantilla en stages */ }} />
          </div>
        </div>

        {/* Fila inferior: Chat + lateral debug */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_360px]">
          <ChatPanel
            agentName={selectedAgent?.name}
            companyName={companyName}
            phase={currentPhase}        // 👈 indicador visual en cabecera
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSend={() => { void send(); }}
            onStartConversation={() => { void resetDialog(); }}
            quickPersonas={PERSONAS}
            onPersonaClick={(p) => {
              const u: ChatMessage = { who: "user", text: p.firstMessage };
              setMessages((xs) => [...xs, u]);
              setInput("");
              void (async () => {
                const prevSlots = { ...slots };
                const regexUpdates = regexSlotExtract(p.firstMessage);
                const llmInf = await classifyTurn({ userText: p.firstMessage, ctx: { companyShort } });
                const merged: Slots = { ...prevSlots, ...regexUpdates, ...llmInf.slotUpdates };
                setSlots(merged);

                let next: Phase = currentPhase;
                if (shouldReopenCollect(p.firstMessage, llmInf, prevSlots, merged, currentPhase)) {
                  next = "COLLECT";
                } else {
                  next = nextPhase(currentPhase, llmInf, merged);
                }
                setCurrentPhase(next);

                const phasePrompt =
                  (promptsByPhase[next] ||
                    "Actúa como recepcionista. Ayuda brevemente y conduce al siguiente paso. Si faltan datos, pídolos de forma natural.");

                const history = [...messages, u].map((m) => ({
                  role: m.who === "user" ? ("user" as const) : ("assistant" as const),
                  content: m.text,
                }));

                const agentText = await generateReplyFromPrompt({
                  stagePrompt: phasePrompt,
                  messages: history,
                  ctx: {
                    greeting: computeGreeting(),
                    companyName,
                    companyShort,
                    phase: next,
                    slots: merged,
                  },
                  model: "gpt-4o-mini",
                  temperature: 0.5,
                  maxTokens: 220,
                });
                setMessages((xs) => [...xs, { who: "agent", text: agentText }]);
              })();
            }}
          />

          <aside className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 md:p-5">
            <div className="text-sm text-slate-600">
              <div className="font-semibold mb-1">Debug</div>
              <div>Fase actual: <span className="font-mono">{currentPhase}</span></div>
              <div className="mt-2">Slots:</div>
              <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-[11px]">
                {JSON.stringify(slots, null, 2)}
              </pre>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
