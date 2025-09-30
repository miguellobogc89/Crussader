"use client";

import { Plus, GripVertical, Trash2, Save, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import React, { useMemo, useState, useEffect } from "react";

type StageType = "INTRO" | "COLLECT" | "INTENT" | "CUSTOM";

export type FlowStage = {
  id?: string;
  phaseId?: string;
  key?: string;
  label: string;
  type: StageType;
  order: number;
  priority?: number | null;
  prompt?: string;
  meta?: Record<string, any> | null;
  isEnabled?: boolean;
};

export default function FlowEditor(props: {
  initialFlow?: FlowStage[];
  onChange?: (flow: FlowStage[]) => void;
  onSave?: (flow: FlowStage[]) => Promise<void> | void;
  title?: string;
  /** Nombre del agente mostrado como título (y “Flujo del Agente” como subtítulo) */
  agentName?: string;
  /** Muestra overlay de carga y deshabilita acciones */
  loading?: boolean;
}) {
  const {
    initialFlow = [],
    onChange,
    onSave,
    title = "Flujo del Agente",
    agentName,
    loading = false,
  } = props;

  const [nodes, setNodes] = useState<FlowStage[]>(
    [...initialFlow].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Estado local de expansión por índice
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // ✅ Sincroniza con initialFlow SOLO si realmente cambian los datos (evita colapsar al teclear)
  useEffect(() => {
    const sorted = [...initialFlow].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const same = JSON.stringify(sorted) === JSON.stringify(nodes);
    if (!same) {
      setNodes(sorted);
      setExpanded({}); // reset visual solo cuando el flow realmente cambia (p.ej. otro agente)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFlow]);

  const types: { value: StageType; label: string }[] = useMemo(
    () => [
      { value: "INTRO", label: "Introducción" },
      { value: "INTENT", label: "Intención" },
      { value: "COLLECT", label: "Solicitud de datos" },
      { value: "CUSTOM", label: "Personalizada" },
    ],
    []
  );

  function reindex(xs: FlowStage[]) {
    return xs.map((n, i) => ({ ...n, order: i }));
  }

  function notify(xs: FlowStage[]) {
    setNodes(xs);
    onChange?.(xs);
  }

  function addNode() {
    const n: FlowStage = {
      label: "Nueva fase",
      type: "CUSTOM",
      order: nodes.length,
      isEnabled: true,
    };
    const xs = reindex([...nodes, n]);
    notify(xs);
  }

  function deleteNode(_id: string | undefined, idx: number) {
    const xs = reindex(nodes.filter((_, i) => i !== idx));
    notify(xs);
    // mantener estado de expansión consistente tras borrar
    setExpanded((e) => {
      const copy: Record<number, boolean> = {};
      xs.forEach((_, i) => {
        copy[i] = e[i] ?? false;
      });
      return copy;
    });
  }

  function moveNode(idx: number, dir: "up" | "down") {
    const j = dir === "up" ? idx - 1 : idx + 1;
    if (j < 0 || j >= nodes.length) return;
    const xs = [...nodes];
    const tmp = xs[idx];
    xs[idx] = xs[j];
    xs[j] = tmp;
    const re = reindex(xs);
    notify(re);

    // Remap de expansión acorde a nuevos índices
    setExpanded((e) => {
      const map: Record<number, boolean> = {};
      re.forEach((_, i) => {
        if (i === idx) map[i] = e[j] ?? false;
        else if (i === j) map[i] = e[idx] ?? false;
        else map[i] = e[i] ?? false;
      });
      return map;
    });
  }

  function updateNode(idx: number, patch: Partial<FlowStage>) {
    const xs = [...nodes];
    xs[idx] = { ...xs[idx], ...patch };
    notify(xs);
  }

  function toggleExpand(idx: number) {
    setExpanded((e) => ({ ...e, [idx]: !e[idx] }));
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      await onSave?.(nodes);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2200);
    } finally {
      setIsSaving(false);
    }
  }

  // Fondo “lienzo” con degradado/texture
  const canvasStyles: React.CSSProperties = {
    backgroundImage:
      "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.04) 0 1px, transparent 1px), radial-gradient(circle at 80% 0%, rgba(0,0,0,0.03) 0 1px, transparent 1px), linear-gradient(135deg, rgba(241,245,249,0.95) 0%, rgba(248,250,252,0.9) 60%, rgba(236,242,247,0.95) 100%)",
    backgroundSize: "18px 18px, 22px 22px, 100% 100%",
    backgroundBlendMode: "multiply",
  };

  const disabled = loading || isSaving;

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white/70 p-0 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Header con agente como título y “Flujo del Agente” como subtítulo */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-800">
            {agentName || title || "Flujo del Agente"}
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">
            {agentName ? "Flujo del Agente" : ""}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {loading ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando…
            </span>
          ) : savedAt ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Guardado ✓
            </span>
          ) : null}

          <button
            onClick={handleSave}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm text-white shadow hover:bg-emerald-600 disabled:opacity-60"
            title="Guardar flujo"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar
              </>
            )}
          </button>
          <button
            onClick={addNode}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50 disabled:opacity-60"
            title="Añadir fase"
          >
            <Plus className="h-4 w-4" /> Añadir fase
          </button>
        </div>
      </div>

      {/* Lienzo */}
      <div className="h-[560px] overflow-y-auto rounded-b-3xl p-4" style={canvasStyles} aria-busy={loading}>
        <div className={disabled ? "pointer-events-none opacity-60" : ""}>
          <div className="space-y-3">
            {nodes.map((n, i) => {
              const num = (n.priority ?? null) == null ? n.order + 1 : n.priority!;
              const isOpen = !!expanded[i];

              return (
                <div
                  key={i}
                  className="group relative w-full rounded-2xl border border-slate-200 bg-white/90 shadow-sm transition hover:border-slate-300"
                >
                  {/* Badge de orden/prioridad a la izquierda (ligeramente fuera) */}
                  <div className="absolute -left-2 top-3">
                    <div className="flex h-7 min-w-7 items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm">
                      {num}
                    </div>
                  </div>

                  {/* Barra superior de la fase */}
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <GripVertical className="h-4 w-4 text-slate-400" />
                      <input
                        value={n.label}
                        onChange={(e) => updateNode(i, { label: e.target.value })}
                        className="w-[220px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                        placeholder="Nombre de la fase"
                        disabled={disabled}
                      />
                      <select
                        value={n.type}
                        onChange={(e) => updateNode(i, { type: e.target.value as StageType })}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                        disabled={disabled}
                      >
                        {types.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <label className="ml-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                        <input
                          type="checkbox"
                          checked={n.isEnabled ?? true}
                          onChange={(e) => updateNode(i, { isEnabled: e.target.checked })}
                          disabled={disabled}
                        />
                        Activa
                      </label>
                    </div>

                    {/* Botonera fila: subir, bajar, eliminar + expand */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveNode(i, "up")}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-60"
                        title="Subir"
                        disabled={disabled || i === 0}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveNode(i, "down")}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-60"
                        title="Bajar"
                        disabled={disabled || i === nodes.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => deleteNode(n.id, i)}
                        className="rounded-md border border-slate-200 bg-white p-1 hover:bg-slate-50 disabled:opacity-60"
                        title="Eliminar"
                        disabled={disabled}
                      >
                        <Trash2 className="h-4 w-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => toggleExpand(i)}
                        className="ml-1 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-60"
                        title={isOpen ? "Contraer" : "Expandir"}
                        disabled={disabled}
                      >
                        {isOpen ? (
                          <>
                            Ocultar <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            Prompt <ChevronRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Contenido expandible: Prompt */}
                  {isOpen && (
                    <div className="border-t border-slate-200 px-4 py-3">
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="mb-2 text-xs font-medium text-slate-500">Prompt de la fase</div>
                        <textarea
                          value={n.prompt ?? ""}
                          onChange={(e) => updateNode(i, { prompt: e.target.value })}
                          rows={4}
                          placeholder="Escribe aquí el prompt que guiará a la IA durante esta fase…"
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {nodes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-500">
                No hay fases aún. Pulsa “Añadir fase”.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay de carga (bloquea interacción visualmente) */}
      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando fases…
          </div>
        </div>
      )}
    </div>
  );
}