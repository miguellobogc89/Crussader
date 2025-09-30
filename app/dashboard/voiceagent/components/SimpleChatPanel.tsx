"use client";

import React, { useEffect, useRef } from "react";

export type ChatRow = { who: "user" | "agent"; text: string };

export default function SimpleChatPanel({
  title = "Agente",
  messages,
  partialUserText,
  className = "",
}: {
  title?: string;
  messages: ChatRow[];
  partialUserText?: string | null;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, partialUserText]);

  return (
    <div className={`flex h-[640px] flex-col rounded-2xl border border-slate-200 bg-white/70 shadow-sm ${className}`}>
      {/* Header simple */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
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

        {/* Parcial del usuario (voz) */}
        {partialUserText && partialUserText.trim() !== "" && (
          <div className="flex w-full justify-end">
            <div className="max-w-[80%] rounded-2xl bg-gradient-to-r from-sky-200 to-indigo-200 px-3 py-2 text-sm text-slate-800 ring-1 ring-sky-100">
              <span className="opacity-70">Hablando… </span>
              <span className="italic">{partialUserText}</span>
              <span className="ml-1 inline-block animate-pulse">▌</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
