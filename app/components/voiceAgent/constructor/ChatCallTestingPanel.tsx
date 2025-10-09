"use client";

import React, { useEffect, useRef } from "react";
import { PhoneCall, PhoneOff, MessageSquare, Mic, MicOff, AlertTriangle } from "lucide-react";

type CallState = "idle" | "ringing" | "connected";
type Mode = "chat" | "voice" | "mic";
export type ChatMessage = { who: "user" | "agent"; text: string };

function VUMeter({ level = 0 }: { level?: number }) {
  const segments = 10;
  const active = Math.round(Math.max(0, Math.min(1, level)) * segments);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`h-3 w-1 rounded-sm ${i < active ? "bg-sky-500" : "bg-slate-200"}`}
          style={{ transition: "background-color 100ms linear" }}
        />
      ))}
    </div>
  );
}

export default function ChatPanelWithCall({
  agentName,

  mode,
  onModeChange,

  messages,
  draftUserText,
  input,
  onInputChange,
  onSend,
  onResetConversation,

  callState,
  durationSec,
  sttSupported,
  partialText,
  lastError,
  aiSpeaking,
  micLevel,
  aiPartialText, // 🔹 nuevo prop
  onStartCall,
  onHangUp,

  className = "h:[640px] md:h-[640px]",
}: {
  agentName?: string;

  mode: Mode;
  onModeChange: (m: Mode) => void;

  messages: ChatMessage[];
  draftUserText?: string | null;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onResetConversation?: () => void;

  callState: CallState;
  durationSec: number;
  sttSupported: boolean;
  partialText?: string | null;
  lastError?: string | null;
  aiSpeaking?: boolean;
  micLevel?: number;
  aiPartialText?: string | null; // 🔹
  onStartCall: () => void;
  onHangUp: () => void;

  className?: string;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);

  // Autoscroll incluyendo cambios de parciales
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, draftUserText, partialText, aiPartialText]);

  // Duración
  const pad = (n: number) => n.toString().padStart(2, "0");
  const mm = pad(Math.floor((durationSec || 0) / 60));
  const ss = pad((durationSec || 0) % 60);

  // Sólo errores reales (no close 1000)
  const showError = lastError && !/1000/.test(lastError) ? lastError : null;

  // Cambios de modo
  const toChat = () => onModeChange("chat");
  const toVoice = () => onModeChange("voice");
  const toMic = () => onModeChange("mic");

  const isCalling = callState === "ringing" || callState === "connected";
  const inMicSession = mode === "mic" && callState === "connected";

  const headerButton =
    mode === "voice" ? (
      <button
        onClick={isCalling ? onHangUp : onStartCall}
        className={`rounded-xl p-2 transition ${
          isCalling
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-slate-900 text-white hover:bg-slate-800"
        }`}
        aria-label={isCalling ? "Colgar" : "Iniciar llamada"}
        title={isCalling ? "Colgar" : "Iniciar llamada"}
      >
        {isCalling ? <PhoneOff className="h-4 w-4" /> : <PhoneCall className="h-4 w-4" />}
      </button>
    ) : mode === "mic" ? (
      <button
        onClick={inMicSession ? onHangUp : onStartCall}
        className={`rounded-xl p-2 transition ${
          inMicSession
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-slate-900 text-white hover:bg-slate-800"
        }`}
        aria-label={inMicSession ? "Parar prueba" : "Iniciar prueba de micro"}
        title={inMicSession ? "Parar prueba" : "Iniciar prueba de micro"}
      >
        {inMicSession ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>
    ) : null;

  return (
    <div className={`flex h-[640px] flex-col rounded-2xl border border-slate-200 bg-white/70 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">
            {agentName || "Agente"}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de modo */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-sky-600"
                checked={mode === "chat"}
                onChange={toChat}
                disabled={isCalling || inMicSession}
              />
              Chat
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-sky-600"
                checked={mode === "voice"}
                onChange={toVoice}
                disabled={isCalling || inMicSession}
              />
              Voz
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-sky-600"
                checked={mode === "mic"}
                onChange={toMic}
                disabled={isCalling || inMicSession}
              />
              Prueba micro
            </label>
          </div>

          {/* Botón */}
          {headerButton}

          {onResetConversation && (
            <button
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={onResetConversation}
            >
              Reiniciar
            </button>
          )}
        </div>
      </div>

      {/* Mensajes */}
      <div ref={listRef} className="flex-1 space-y-2 overflow-auto px-4 py-3">
        {messages.map((m, i) => {
          const isUser = m.who === "user";
          return (
            <div key={i} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
              {/* Avatar IA a la izquierda */}
              {!isUser && (
                <div
                  className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm"
                  title={agentName || "Agente"}
                >
                  <span role="img" aria-label="robot">🤖</span>
                </div>
              )}

              {/* Burbuja */}
              <div
                className={
                  isUser
                    ? "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed text-white bg-gradient-to-r from-sky-500/90 to-indigo-500/90 shadow-sm"
                    : "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed bg-slate-100 text-slate-800 shadow-sm"
                }
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {/* 🔵 Draft del usuario — SIEMPRE que haya llamada */}
        {callState === "connected" && draftUserText && draftUserText.trim() !== "" && (
          <div className="flex w-full justify-end">
            <div className="max-w-[80%] rounded-2xl bg-gradient-to-r from-sky-200 to-indigo-200 px-3 py-2 text-sm text-slate-800 ring-1 ring-sky-100">
              <span className="opacity-70">Usuario (draft)… </span>
              <span className="italic">{draftUserText}</span>
              <span className="ml-1 inline-block animate-pulse">▌</span>
            </div>
          </div>
        )}

        {/* 🟡 Parcial STT crudo — SIEMPRE que haya llamada */}
        {callState === "connected" && partialText && partialText.trim() !== "" && (
          <div className="flex w-full justify-end">
            <div className="max-w-[80%] rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">
              <span className="opacity-80 font-medium">Usuario (parcial):</span> {partialText}
            </div>
          </div>
        )}

        {/* 🤖 Parcial de IA (streaming) — SIEMPRE que haya llamada */}
        {callState === "connected" && aiPartialText?.trim() && (
          <div className="flex w-full justify-start">
            <div
              className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm"
              title={agentName || "Agente"}
            >
              <span role="img" aria-label="robot">🤖</span>
            </div>
            <div className="max-w-[80%] rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200">
              <span className="opacity-70">IA (parcial)… </span>
              <span className="italic">{aiPartialText}</span>
              <span className="ml-1 inline-block animate-pulse">▌</span>
            </div>
          </div>
        )}
      </div>

      {/* Input solo en chat */}
      {mode === "chat" && (
        <div className="border-t border-slate-200 bg-white/60 px-3 py-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="Escribe tu mensaje…"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      {/* Footer — estados */}
      <div className="border-t border-slate-200 bg-white/70 px-3 py-2">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
          {mode === "voice" ? (
            <>
              <div className="inline-flex items-center gap-2">
                <Mic className="h-4 w-4 opacity-70" />
                {callState === "idle" && <span>Llamada inactiva</span>}
                {callState === "ringing" && <span>Llamando…</span>}
                {callState === "connected" && <span>Conectado · {mm}:{ss}</span>}
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-md px-2 py-1 ${
                  aiSpeaking ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
                title={aiSpeaking ? "La IA está locutando" : "La IA está en silencio"}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    aiSpeaking ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                {aiSpeaking ? "IA hablando…" : "IA en silencio"}
              </div>

              <div className="inline-flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Nivel mic:</span>
                <VUMeter level={callState === "connected" ? micLevel ?? 0 : 0} />
              </div>

              {!sttSupported && (
                <div className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Dictado no soportado</span>
                </div>
              )}

              {showError && (
                <div
                  className="inline-flex max-w-[50%] items-center gap-1 truncate rounded-md bg-rose-100 px-2 py-1 text-rose-700"
                  title={showError}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>STT: {showError}</span>
                </div>
              )}
            </>
          ) : mode === "mic" ? (
            <>
              <div className="inline-flex items-center gap-2">
                <Mic className="h-4 w-4 opacity-70" />
                {callState === "connected" ? (
                  <span>Prueba de micro activa</span>
                ) : (
                  <span>Prueba de micro inactiva</span>
                )}
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Nivel mic:</span>
                <VUMeter level={callState === "connected" ? micLevel ?? 0 : 0} />
              </div>
              {showError && (
                <div
                  className="inline-flex max-w-[50%] items-center gap-1 truncate rounded-md bg-rose-100 px-2 py-1 text-rose-700"
                  title={showError}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>STT: {showError}</span>
                </div>
              )}
            </>
          ) : (
            <div className="inline-flex items-center gap-2">
              <MessageSquare className="h-4 w-4 opacity-70" />
              <span>MODO CHAT activo</span>
            </div>
          )}
        </div>

        {/* 📜 Transcripción en vivo (usuario): visible si hay parciales/draft */}
        {callState === "connected" && (draftUserText?.trim() || partialText?.trim()) && (
          <div className="mt-2 rounded-md border border-slate-200 bg-white/60 p-2">
            <div className="mb-1 text-[11px] font-semibold text-slate-700">Transcripción en vivo</div>
            {draftUserText?.trim() && (
              <div className="text-[12px] text-slate-700">
                <span className="mr-1 rounded-sm bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-800 ring-1 ring-sky-200">Usuario (draft)</span>
                <span className="italic">{draftUserText}</span>
                <span className="ml-1 inline-block animate-pulse">▌</span>
              </div>
            )}
            {partialText?.trim() && (
              <div className="mt-1 text-[12px] text-slate-700">
                <span className="mr-1 rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200">Usuario (parcial)</span>
                {partialText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
