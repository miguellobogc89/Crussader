"use client";

import React, { useEffect, useRef } from "react";
import { MessageSquare, Send, Sparkles, User, Bot, RotateCcw } from "lucide-react";

export type ChatMessage = { who: "user" | "agent"; text: string };

export type QuickPersona = {
  key: string;
  label: string;
  firstMessage: string;
};

const cx = (...xs: Array<string | false | undefined>) => xs.filter(Boolean).join(" ");

export default function ChatPanel(props: {
  agentName?: string;
  companyName: string;
  phase?: string; // 👈 indicador visual
  messages: ChatMessage[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onStartConversation: () => void;
  quickPersonas: QuickPersona[];
  onPersonaClick: (p: QuickPersona) => void;
}) {
  const {
    agentName,
    companyName,
    phase,
    messages,
    input,
    onInputChange,
    onSend,
    onStartConversation,
    quickPersonas,
    onPersonaClick,
  } = props;

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  function Bubble({ who, children }: { who: "user" | "agent"; children: React.ReactNode }) {
    const isUser = who === "user";
    return (
      <div className={cx("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}>
        {!isUser && (
          <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow">
            <Bot className="h-4 w-4" />
          </div>
        )}
        <div
          className={cx(
            "max-w-[76%] rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
              : "border border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60"
          )}
        >
          {children}
        </div>
        {isUser && (
          <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="font-semibold">
              {agentName ? `${agentName} · ${companyName}` : companyName}
            </span>
            {/* Indicador visual de fase */}
            {phase && (
              <span className="mt-0.5 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Fase: <span className="font-semibold">{phase}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onStartConversation}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50"
            title="Iniciar conversación"
          >
            <RotateCcw className="h-4 w-4" /> Iniciar conversación
          </button>
        </div>
      </div>

      {/* Mensajes */}
      <div className="h-[48vh] w-full space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,255,255,0.9))] p-4 md:p-6">
        {messages.map((m, i) => (
          <Bubble key={i} who={m.who}>
            {m.text}
          </Bubble>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-3 md:p-4">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="Escribe como el cliente…"
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-[15px] shadow-sm outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <div className="pointer-events-none absolute right-3 top-3 text-xs text-slate-400">
              Enter para enviar
            </div>
          </div>
          <button
            onClick={onSend}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-white shadow hover:bg-emerald-600"
          >
            <Send className="h-4 w-4" /> Enviar
          </button>
        </div>

        {/* Personas rápidas */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Personas rápidas:</span>
          {quickPersonas.map((p) => (
            <button
              key={p.key}
              onClick={() => onPersonaClick(p)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm hover:bg-slate-50"
            >
              <Sparkles className="mr-1 inline h-3.5 w-3.5" /> {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
