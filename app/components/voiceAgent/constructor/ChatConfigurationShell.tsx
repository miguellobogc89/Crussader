// app/components/voiceAgent/constructor/ChatConfigurationShell.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ChatPanelWithCall, { type ChatMessage } from "@/app/components/voiceAgent/constructor/ChatCallTestingPanel";
import { useVoiceCallManager } from "@/app/components/voiceAgent/constructor/VoiceCallManager";
import type { AgentGeneralSettings } from "@/app/components/voiceAgent/constructor/AgentGeneralSettingsPanel";
import VoiceSettingsPanel, { type VoiceSettings } from "@/app/components/voiceAgent/constructor/VoiceSettingsPanel";

type Phase = "INTRO" | "INTENT" | "COLLECT" | "CONFIRM" | "END";

export default function ChatConfigurationShell({
  companyId,
  companyName,
  agentName,
  promptsByPhase,
  firstPromptFallback,
  generalSettings,
}: {
  companyId: string;
  companyName: string;
  agentName?: string;
  promptsByPhase?: Record<Phase, string | undefined>;
  firstPromptFallback?: string;
  generalSettings: AgentGeneralSettings;
}) {
  const [mode, setMode] = useState<"chat" | "voice" | "mic">("voice");
  const [input, setInput] = useState("");

  const [settings, setSettings] = useState<VoiceSettings>({
    model: "gpt-4o-realtime-preview",
    voice: "alloy",
    persona: "Recepcionista cercana, clara y profesional.",
    rate: 1.0,
  });

  // Texto parcial de la IA (streaming)
  const [aiPartial, setAiPartial] = useState<string>("");

  const {
    state,
    error,
    connect,
    disconnect,
    audioRef,
    partialText,
    micLevel,
    durationSec,
    aiSpeaking,
    sttSupported,
    transcript,
  } = useVoiceCallManager();

  const callState =
    state === "connected" ? "connected" : state === "connecting" ? "ringing" : "idle";
  const callBusy = state === "connecting" || state === "connected";

  // Anti-eco UI
  const aiGateUntil = useRef<number>(0);
  const [aiTalkingSmooth, setAiTalkingSmooth] = useState(false);

  const USER_THR = 0.08;
  const userTalkingRaw = callState === "connected" && (micLevel ?? 0) > USER_THR;
  const aiTalkingRaw = aiSpeaking;

  useEffect(() => {
    let to: ReturnType<typeof setTimeout> | null = null;
    if (userTalkingRaw) {
      setAiTalkingSmooth(false);
      return () => { if (to) clearTimeout(to); };
    }
    if (aiTalkingRaw) {
      setAiTalkingSmooth(true);
      aiGateUntil.current = Date.now() + 400;
    } else {
      to = setTimeout(() => setAiTalkingSmooth(false), 1000);
      aiGateUntil.current = Date.now() + 400;
    }
    return () => { if (to) clearTimeout(to); };
  }, [aiTalkingRaw, userTalkingRaw]);

  // Mostrar todo sin filtros
  const viewMessages = useMemo<ChatMessage[]>(
    () => transcript.map((e) => ({ who: e.who, text: e.text })),
    [transcript]
  );

  // Prompts / instrucciones
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
    if (generalSettings.stickToKnowledge) lines.push(`CÍÑETE al knowledge de la empresa; si no dispones de la información, dilo y pregunta o deriva.`);
    if (generalSettings.refusalGuard) lines.push(`No inventes datos. Si no estás seguro, dilo y solicita aclaración. Prioriza precisión a creatividad.`);
    lines.push(`Transcribe y responde en ${generalSettings.lang || "es-ES"} con puntuación correcta.`);
    return lines.join("\n");
  }, [companyName, agentName, settings.persona, promptsByPhase, firstPromptFallback, generalSettings]);

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <audio ref={audioRef} autoPlay playsInline />

        {/* Badges de estado */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
          <StatusBadge active={aiTalkingSmooth} label={aiTalkingSmooth ? "IA hablando" : "IA en silencio"} />
          <StatusBadge active={!aiTalkingSmooth && (callState === "connected" && (micLevel ?? 0) > USER_THR)} label={"Usuario (VAD)"} />
        </div>

        <ChatPanelWithCall
          agentName={agentName || "Agente"}
          mode={mode}
          onModeChange={(m) => !callBusy && setMode(m)}
          messages={viewMessages}
          draftUserText={partialText || ""}
          input={input}
          onInputChange={setInput}
          onSend={() => setInput("")}
          onResetConversation={() => disconnect()}
          callState={callState as any}
          durationSec={durationSec}
          sttSupported={sttSupported}
          partialText={partialText}
          lastError={error}
          aiSpeaking={aiTalkingSmooth}
          micLevel={micLevel}
          aiPartialText={aiPartial}
          onStartCall={() => {
            setAiPartial("");
            if (mode === "mic") {
              return connect({
                localOnly: true,
                vad: {
                  mode: generalSettings.vadMode || "strict",
                  endOfSpeechMs: generalSettings.endOfSpeechMs || 800,
                  minSpeechMs: Math.max(generalSettings.minSpeechMs, 250),
                  endpointSensitivity: Math.max(generalSettings.endpointSensitivity, 60),
                  confidenceMin: Math.max(generalSettings.confidenceMin, 0.75),
                  noiseSuppression: true,
                  echoCancellation: true,
                  lang: generalSettings.lang || "es-ES",
                },
                onAiDelta: (txt: string) => setAiPartial(txt), // ✅ tipado
              } as any);
            }
            return connect({
              model: settings.model,
              voice: settings.voice,
              instructions,
              autoGreetText: intro,
              tts: { rate: typeof settings.rate === "number" ? settings.rate : generalSettings.ttsRate },
              vad: {
                mode: generalSettings.vadMode || "strict",
                endOfSpeechMs: generalSettings.endOfSpeechMs || 800,
                minSpeechMs: Math.max(generalSettings.minSpeechMs, 250),
                endpointSensitivity: Math.max(generalSettings.endpointSensitivity, 60),
                confidenceMin: Math.max(generalSettings.confidenceMin, 0.75),
                noiseSuppression: true,
                echoCancellation: true,
                lang: generalSettings.lang || "es-ES",
                bargeIn: true,
              },
              policy: {
                stickToKnowledge: generalSettings.stickToKnowledge,
                refusalGuard: generalSettings.refusalGuard,
                hallucinationGuard: generalSettings.hallucinationGuard,
              },
              onAiDelta: (txt: string) => setAiPartial(txt), // ✅ tipado
            } as any);
          }}
          onHangUp={() => {
            setAiPartial("");
            disconnect();
          }}
        />
      </div>

      {/* Panel de ajustes de voz/modelo/persona */}
      <div className="space-y-3">
        <VoiceSettingsPanel value={settings} onChange={setSettings} disabled={callBusy} />
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
