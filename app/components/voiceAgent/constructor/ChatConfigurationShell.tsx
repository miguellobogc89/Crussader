// app/components/voiceAgent/Constructor/ChatConfigurationShell.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import ChatPanelWithCall, { type ChatMessage } from "@/app/components/voiceAgent/constructor/ChatCallTestingPanel";
import { useVoiceCallManager } from "@/app/components/voiceAgent/constructor/VoiceCallManager";

type Phase = "INTRO" | "INTENT" | "COLLECT" | "CONFIRM" | "END";

type VoiceSettings = {
  model: string;
  voice: string;
  persona: string;
};

export default function ChatConfigurationShell({
  companyId,
  companyName,
  agentName,
  promptsByPhase,
  firstPromptFallback,
}: {
  companyId: string;
  companyName: string;
  agentName?: string;
  promptsByPhase?: Record<Phase, string | undefined>;
  firstPromptFallback?: string;
}) {
  // UI
  const [mode, setMode] = useState<"chat" | "voice" | "mic">("voice");
  const [input, setInput] = useState("");

  // Ajustes del agente (panel derecho)
  const [settings, setSettings] = useState<VoiceSettings>({
    model: "gpt-4o-realtime-preview",
    voice: "alloy",
    persona: "Recepcionista cercana, clara y profesional.",
  });

  // Realtime
  const {
    state,
    error,
    connect,
    disconnect,
    audioRef,
    partialText,
    micLevel,
    durationSec,
    aiSpeaking,     // IA hablando (RAW del analizador remoto)
    sttSupported,
    transcript,
  } = useVoiceCallManager();

  const callState =
    state === "connected" ? "connected" : state === "connecting" ? "ringing" : "idle";
  const callBusy = state === "connecting" || state === "connected";

  // Mensajes derivados del transcript
  const viewMessages = useMemo<ChatMessage[]>(
    () => transcript.map((e) => ({ who: e.who, text: e.text })),
    [transcript]
  );

  // Prompts → instrucciones y saludo
  const intro = useMemo(
    () => promptsByPhase?.INTRO?.trim() || firstPromptFallback?.trim() || "Hola, soy su asistente.",
    [promptsByPhase, firstPromptFallback]
  );

  const instructions = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Eres un agente telefónico para la empresa "${companyName}".`);
    lines.push(`Identidad: ${agentName || "Agente"}; estilo: ${settings.persona || "profesional y claro"}.`);
    lines.push(`Sigue este flujo: INTRO → INTENT → COLLECT → CONFIRM → END. Frases breves y confirmación de datos.`);
    if (promptsByPhase?.INTRO) lines.push(`INTRO: ${promptsByPhase.INTRO}`);
    if (promptsByPhase?.INTENT) lines.push(`INTENT: ${promptsByPhase.INTENT}`);
    if (promptsByPhase?.COLLECT) lines.push(`COLLECT: ${promptsByPhase.COLLECT}`);
    if (promptsByPhase?.CONFIRM) lines.push(`CONFIRM: ${promptsByPhase.CONFIRM}`);
    if (promptsByPhase?.END) lines.push(`END: ${promptsByPhase.END}`);
    if (!promptsByPhase?.INTRO && firstPromptFallback) lines.push(`Mensaje inicial sugerido: ${firstPromptFallback}`);
    lines.push(`Si falta información, pregunta con amabilidad. No inventes datos.`);
    return lines.join("\n");
  }, [companyName, agentName, settings.persona, promptsByPhase, firstPromptFallback]);

  // === Badges: quién habla (suavizado) ===
  const USER_THR = 0.08;
  const userTalkingRaw = callState === "connected" && (micLevel ?? 0) > USER_THR;
  const aiTalkingRaw = aiSpeaking;

  // IA: hangover 1s, sin solaparse con Usuario
  const [aiTalkingSmooth, setAiTalkingSmooth] = useState(false);
  useEffect(() => {
    let to: ReturnType<typeof setTimeout> | null = null;

    // si el usuario habla, apaga IA YA (no solapar)
    if (userTalkingRaw) {
      setAiTalkingSmooth(false);
      return () => { if (to) clearTimeout(to); };
    }

    if (aiTalkingRaw) {
      setAiTalkingSmooth(true);
    } else {
      to = setTimeout(() => setAiTalkingSmooth(false), 1000); // 1s
    }
    return () => { if (to) clearTimeout(to); };
  }, [aiTalkingRaw, userTalkingRaw]);

  // Usuario: hangover 0.5s, sin solaparse con IA
  const [userTalkingSmooth, setUserTalkingSmooth] = useState(false);
  useEffect(() => {
    let to: ReturnType<typeof setTimeout> | null = null;

    // si la IA habla (raw o smooth), apaga usuario YA (no solapar)
    if (aiTalkingRaw || aiTalkingSmooth) {
      setUserTalkingSmooth(false);
      return () => { if (to) clearTimeout(to); };
    }

    if (userTalkingRaw) {
      setUserTalkingSmooth(true);
    } else {
      to = setTimeout(() => setUserTalkingSmooth(false), 500); // 0.5s
    }
    return () => { if (to) clearTimeout(to); };
  }, [userTalkingRaw, aiTalkingRaw, aiTalkingSmooth]);

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      {/* Columna izquierda: audio, badges y chat */}
      <div className="space-y-4">
        {/* Audio remoto IA */}
        <audio ref={audioRef} autoPlay playsInline />

        {/* Badges de estado de voz (suavizados) */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
          <StatusBadge active={aiTalkingSmooth} label={aiTalkingSmooth ? "IA hablando" : "IA en silencio"} />
          <StatusBadge active={userTalkingSmooth} label={userTalkingSmooth ? "Usuario hablando" : "Usuario en silencio"} />
        </div>

        {/* Panel de prueba */}
        <ChatPanelWithCall
          agentName={agentName || "Agente"}
          mode={mode}
          onModeChange={(m) => !callBusy && setMode(m)} // evita cambiar modo en llamada
          messages={viewMessages}
          draftUserText={partialText}
          input={input}
          onInputChange={setInput}
          onSend={() => setInput("")}
          onResetConversation={() => disconnect()}
          callState={callState as any}
          durationSec={durationSec}
          sttSupported={sttSupported}
          partialText={partialText}
          lastError={error}
          aiSpeaking={aiTalkingSmooth}  // señal suavizada
          micLevel={micLevel}
          onStartCall={() => {
            if (mode === "mic") {
              return connect({ localOnly: true });
            }
            return connect({
              model: settings.model,
              voice: settings.voice,
              instructions,
              autoGreetText: intro,
            });
          }}
          onHangUp={disconnect}
        />
      </div>

      {/* Columna derecha: Panel de ajustes */}
      <div className="space-y-3">
        <VoiceSettingsPanelInline
          value={settings}
          onChange={setSettings}
          disabled={callBusy}
        />
      </div>
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 ${
        active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
      {label}
    </span>
  );
}

/** Panel de ajustes mínimo y funcional (inline) */
function VoiceSettingsPanelInline({
  value,
  onChange,
  disabled,
}: {
  value: { model: string; voice: string; persona: string };
  onChange: (v: { model: string; voice: string; persona: string }) => void;
  disabled?: boolean;
}) {
  const set = (patch: Partial<typeof value>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">Ajustes del agente</div>

      {/* Modelo */}
      <label className="mb-2 block text-xs font-medium text-slate-700">Modelo (Realtime)</label>
      <select
        className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60"
        value={value.model}
        onChange={(e) => set({ model: e.target.value })}
        disabled={disabled}
      >
        <option value="gpt-4o-realtime-preview">gpt-4o-realtime-preview</option>
        <option value="gpt-4o-realtime-latest">gpt-4o-realtime-latest</option>
      </select>

      {/* Voz */}
      <label className="mb-2 block text-xs font-medium text-slate-700">Voz</label>
      <select
        className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60"
        value={value.voice}
        onChange={(e) => set({ voice: e.target.value })}
        disabled={disabled}
      >
        <option value="alloy">alloy</option>
        <option value="verse">verse</option>
        <option value="aria">aria</option>
      </select>

      {/* Persona */}
      <label className="mb-2 block text-xs font-medium text-slate-700">Persona / estilo</label>
      <textarea
        className="mb-2 h-24 w-full resize-none rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60"
        value={value.persona}
        onChange={(e) => set({ persona: e.target.value })}
        disabled={disabled}
        placeholder="Tono de voz, actitud, formalidad…"
      />

      <p className="mt-2 text-[11px] leading-snug text-slate-500">
        Los cambios aplican en la próxima llamada. Durante una llamada, los controles se bloquean.
      </p>
    </div>
  );
}
