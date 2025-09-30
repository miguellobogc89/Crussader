// app/dashboard/voiceagent/sandbox-lite/components/ChatCallPanel.tsx
"use client";

import { useEffect, useRef } from "react";
import { Phone, PhoneOff } from "lucide-react";

export type ChatRow = { who: "user" | "agent"; text: string };

export default function ChatCallPanel({
  title,
  mode,
  onModeChange,
  callState,
  onToggleCall,
  messages,
  input,
  onInputChange,
  onSend,
}: {
  title: string;
  mode: "chat" | "call";
  onModeChange: (m: "chat" | "call") => void;
  callState: "idle" | "ringing" | "connected";
  onToggleCall: () => void;

  messages: ChatRow[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const isCalling = callState === "ringing" || callState === "connected";
console.log("messages", messages);
  return (
    <div className="flex h-[720px] flex-col rounded-2xl border border-slate-200 bg-white/70 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <div className="truncate text-sm font-semibold text-slate-900">{title}</div>

        {/* Selector modo */}
        <div className="flex items-center gap-4 text-xs text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              className="h-4 w-4 accent-sky-600"
              checked={mode === "chat"}
              onChange={() => onModeChange("chat")}
              disabled={isCalling}
            />
            Chat
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              className="h-4 w-4 accent-sky-600"
              checked={mode === "call"}
              onChange={() => onModeChange("call")}
            />
            Llamada
          </label>

          {/* Botón teléfono (solo visible en modo llamada) */}
          {mode === "call" && (
            <button
              onClick={onToggleCall}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition ${
                isCalling ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-800"
              }`}
              title={isCalling ? "Colgar" : "Llamar"}
            >
              {isCalling ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              {isCalling ? "Colgar" : "Llamar"}
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
                  title="Agente"
                >
                  <span role="img" aria-label="robot">🤖</span>
                </div>
              )}
              {/* Burbuja estilo WhatsApp */}
              <div
                className={
                  isUser
                    ? "max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed text-white bg-gradient-to-r from-sky-500 to-indigo-500 shadow-sm"
                    : "max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed bg-slate-100 text-slate-800 shadow-sm"
                }
              >
                {m.text}
              </div>
            </div>
          );
        })}
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
    </div>
  );
}
