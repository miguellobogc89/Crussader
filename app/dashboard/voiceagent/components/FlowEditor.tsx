"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Save,
  Sparkles,
  Edit3,
  MessageSquare,
  Square,
  ChevronRight,
} from "lucide-react";

type FlowNode = {
  id: string;
  key: string; // slug único, p.ej. "intro", "solicitud_datos"
  label: string; // nombre visible
  type: "intro" | "intent" | "collect" | "custom";
  prompt: string; // prompt principal (plantilla)
  meta?: Record<string, any>;
};

type Props = {
  initialFlow?: FlowNode[];
  onChange?: (flow: FlowNode[]) => void;
  onSave?: (flow: FlowNode[]) => void | Promise<void>;
  title?: string;
};

const defaultFlow: FlowNode[] = [
  {
    id: cryptoId(),
    key: "intro",
    label: "Recepción de la llamada",
    type: "intro",
    prompt: "{{greeting}}. Ha llamado a {{company.short}}, ¿en qué podemos ayudarle?",
  },
  {
    id: cryptoId(),
    key: "solicitud_datos",
    label: "Solicitud de datos",
    type: "collect",
    prompt:
      "Para localizar tu ficha, ¿me dices nombre y apellidos? Si no te encuentro, te pediré un teléfono de contacto.",
  },
];

function cryptoId() {
  // id corto legible
  return Math.random().toString(36).slice(2, 8) + "-" + Math.random().toString(36).slice(2, 6);
}

/* Utilidad de clases */
const cx = (...xs: Array<string | false | undefined>) => xs.filter(Boolean).join(" ");

export default function FlowEditor({ initialFlow, onChange, onSave, title = "Flujo del Agente" }: Props) {
  const [nodes, setNodes] = useState<FlowNode[]>(initialFlow?.length ? initialFlow : defaultFlow);
  const [selectedId, setSelectedId] = useState<string>(nodes[0]?.id ?? "");
  const selected = useMemo(() => nodes.find((n) => n.id === selectedId), [nodes, selectedId]);

  useEffect(() => {
    if (onChange) onChange(nodes);
  }, [nodes, onChange]);

  // Acciones sobre nodos
  const addNode = () => {
    const n: FlowNode = {
      id: cryptoId(),
      key: "custom_" + (nodes.length + 1),
      label: "Nueva fase",
      type: "custom",
      prompt: "Escribe aquí el prompt para esta fase…",
    };
    setNodes((xs) => [...xs, n]);
    setSelectedId(n.id);
  };

  const deleteNode = (id: string) => {
    setNodes((xs) => xs.filter((n) => n.id !== id));
    if (selectedId === id) {
      const first = nodes.find((n) => n.id !== id);
      setSelectedId(first?.id || "");
    }
  };

  const duplicateNode = (id: string) => {
    const ref = nodes.find((n) => n.id === id);
    if (!ref) return;
    const dup: FlowNode = {
      ...ref,
      id: cryptoId(),
      key: ref.key + "_copy",
      label: ref.label + " (copia)",
    };
    const idx = nodes.findIndex((n) => n.id === id);
    const next = [...nodes.slice(0, idx + 1), dup, ...nodes.slice(idx + 1)];
    setNodes(next);
    setSelectedId(dup.id);
  };

  const moveNode = (id: string, dir: "up" | "down") => {
    const idx = nodes.findIndex((n) => n.id === id);
    if (idx < 0) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= nodes.length) return;
    const next = [...nodes];
    const [a, b] = [next[idx], next[target]];
    next[idx] = b;
    next[target] = a;
    setNodes(next);
  };

  const updateSelected = (patch: Partial<FlowNode>) => {
    setNodes((xs) => xs.map((n) => (n.id === selectedId ? { ...n, ...patch } : n)));
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">{title}</span>
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            editor visual
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addNode}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50"
            title="Añadir fase"
          >
            <Plus className="h-4 w-4" /> Añadir fase
          </button>
          <button
            onClick={() => (onSave ? onSave(nodes) : null)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-1.5 text-sm text-white shadow hover:bg-emerald-600"
            title="Guardar flujo"
          >
            <Save className="h-4 w-4" /> Guardar
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_420px] gap-4 p-4">
        {/* Lado izquierdo: lista de fases (cajas) */}
        <div className="space-y-3">
          {nodes.map((n, i) => (
            <button
              key={n.id}
              onClick={() => setSelectedId(n.id)}
              className={cx(
                "group w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition",
                selectedId === n.id
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-slate-400" />
                  <div className="font-medium">{n.label}</div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {prettyType(n.type)}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveNode(n.id, "up");
                    }}
                    className="rounded-md border border-slate-200 bg-white p-1 hover:bg-slate-50"
                    title="Subir"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveNode(n.id, "down");
                    }}
                    className="rounded-md border border-slate-200 bg-white p-1 hover:bg-slate-50"
                    title="Bajar"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateNode(n.id);
                    }}
                    className="rounded-md border border-slate-200 bg-white p-1 hover:bg-slate-50"
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(n.id);
                    }}
                    className="rounded-md border border-rose-200 bg-white p-1 text-rose-600 hover:bg-rose-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="ml-1 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="mt-2 line-clamp-2 text-sm text-slate-600">{n.prompt}</div>
            </button>
          ))}
          {nodes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
              No hay fases todavía. <br />
              <button
                onClick={addNode}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" /> Añadir la primera fase
              </button>
            </div>
          )}
        </div>

        {/* Lado derecho: editor de la fase seleccionada */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-slate-500" />
              <div className="font-medium">Propiedades de la fase</div>
            </div>

            {!selected ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">
                Selecciona una fase para editar.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Nombre</label>
                    <input
                      value={selected.label}
                      onChange={(e) => updateSelected({ label: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      placeholder="Ej. Recepción de la llamada"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Tipo</label>
                    <select
                      value={selected.type}
                      onChange={(e) => updateSelected({ type: e.target.value as FlowNode["type"] })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <option value="intro">Introducción</option>
                      <option value="collect">Solicitud de datos</option>
                      <option value="intent">Detección de intención</option>
                      <option value="custom">Personalizada</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs text-slate-500">Clave (slug)</label>
                  <input
                    value={selected.key}
                    onChange={(e) => updateSelected({ key: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    placeholder="intro, solicitud_datos…"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-xs text-slate-500">Prompt (plantilla)</label>
                  <textarea
                    rows={5}
                    value={selected.prompt}
                    onChange={(e) => updateSelected({ prompt: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    placeholder="Ej.: {{greeting}}. Ha llamado a {{company.short}}, ¿en qué podemos ayudarle?"
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    Puedes usar variables como <code>{`{{greeting}}`}</code>, <code>{`{{company.name}}`}</code>,{" "}
                    <code>{`{{company.short}}`}</code>. Próximamente añadiremos más (ubicación, servicios, etc.).
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => duplicateNode(selected.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50"
                  >
                    <Copy className="h-4 w-4" /> Duplicar
                  </button>
                  <button
                    onClick={() => deleteNode(selected.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm text-rose-600 shadow-sm hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Ayuda / tips */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Sugerencias
            </div>
            <ul className="ml-4 list-disc space-y-1">
              <li>Usa frases cortas, cálidas y profesionales.</li>
              <li>En “Solicitud de datos”, pide nombre y apellidos; si no existe ficha, solicita teléfono.</li>
              <li>
                Prepara una fase de “Detección de intención” para distinguir entre Higiene, Modificar cita u otras
                consultas.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function prettyType(t: FlowNode["type"]) {
  switch (t) {
    case "intro":
      return "Introducción";
    case "collect":
      return "Solicitud de datos";
    case "intent":
      return "Intención";
    default:
      return "Personalizada";
  }
}
