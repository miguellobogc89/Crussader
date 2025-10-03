"use client";

import React from "react";
import { Plus, MessageSquare, Target, Database, Wand2 } from "lucide-react";

export type StageType = "INTRO" | "COLLECT" | "INTENT" | "CUSTOM";

export type PhaseTemplate = {
  id: string;
  label: string; // nombre de la fase (título)
  type: StageType; // subtítulo visible
};

const DEFAULT_TEMPLATES: PhaseTemplate[] = [
  { id: "intro-basic", label: "Intro básica", type: "INTRO" },
  { id: "intro-privacy", label: "Intro con privacidad", type: "INTRO" },
  { id: "intent-general", label: "Identificar intención", type: "INTENT" },
  { id: "intent-urgency", label: "Intención con urgencia", type: "INTENT" },
  { id: "collect-contact", label: "Recoger contacto", type: "COLLECT" },
  { id: "collect-service", label: "Recoger servicio", type: "COLLECT" },
  { id: "collect-preferences", label: "Preferencias de horario", type: "COLLECT" },
  { id: "custom-checkout", label: "Cierre personalizado", type: "CUSTOM" },
];

function TypeIcon({ t }: { t: StageType }) {
  if (t === "INTRO") return <MessageSquare className="h-4 w-4 text-slate-500" />;
  if (t === "INTENT") return <Target className="h-4 w-4 text-slate-500" />;
  if (t === "COLLECT") return <Database className="h-4 w-4 text-slate-500" />;
  return <Wand2 className="h-4 w-4 text-slate-500" />;
}

function typeLabel(t: StageType) {
  if (t === "INTRO") return "Introducción";
  if (t === "INTENT") return "Intención";
  if (t === "COLLECT") return "Solicitud de datos";
  return "Personalizada";
}

export default function PhaseList({
  items,
  onSelect,
}: {
  items?: PhaseTemplate[];
  onSelect?: (item: PhaseTemplate) => void;
}) {
  const data = items && items.length > 0 ? items : DEFAULT_TEMPLATES;

  return (
    <div className="h-full flex flex-col rounded-3xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mb-2 px-1 text-sm font-semibold text-slate-800">Fases sugeridas</div>

      {/* Lista estilo “agentes” */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <ul className="space-y-2">
          {data.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:bg-slate-50"
            >
              <div className="flex min-w-0 items-center gap-2">
                <TypeIcon t={it.type} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-800">{it.label}</div>
                  <div className="text-xs text-slate-500">{typeLabel(it.type)}</div>
                </div>
              </div>

              <button
                onClick={() => onSelect?.(it)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm hover:bg-slate-100"
                title="Añadir fase"
              >
                <Plus className="h-4 w-4 text-slate-700" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Pie con conteo (discreto) */}
      <div className="mt-2 px-1 text-right text-xs text-slate-500">
        {data.length} resultado{data.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}