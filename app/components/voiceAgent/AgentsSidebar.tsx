"use client";

import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Copy,
  Trash2,
  Edit2,
  Check,
  X,
  Pause,
  Play,
  BadgeCheck,
} from "lucide-react";

export type AgentListItem = {
  id: string;
  name: string;
  slug?: string | null;
  isActive: boolean;
  companyCount?: number;
  updatedAt?: string; // ISO
};

type Props = {
  agents: AgentListItem[];
  selectedId?: string;
  onSelect: (id: string) => void;

  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onToggleActive: (id: string, next: boolean) => void;
};

const cx = (...xs: Array<string | false | undefined>) => xs.filter(Boolean).join(" ");

export default function AgentsSidebar({
  agents,
  selectedId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  onRename,
  onToggleActive,
}: Props) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return agents;
    const q = query.toLowerCase();
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.slug ?? "").toLowerCase().includes(q)
    );
  }, [agents, query]);

  const startRename = (agent: AgentListItem) => {
    setEditingId(agent.id);
    setDraftName(agent.name);
  };

  const confirmRename = (id: string) => {
    const name = draftName.trim();
    if (name) onRename(id, name);
    setEditingId(null);
    setDraftName("");
  };

  const cancelRename = () => {
    setEditingId(null);
    setDraftName("");
  };

  return (
    <aside className="h-full rounded-3xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 md:p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Agentes</h2>
          <p className="text-xs text-slate-500">Constructor y librería</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm text-white shadow hover:bg-emerald-600"
          title="Crear nuevo agente"
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </button>
      </div>

      {/* Search */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o slug…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {/* List */}
      <div className="space-y-2 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
            No hay agentes que coincidan.
          </div>
        )}

        {filtered.map((a) => {
          const isSelected = a.id === selectedId;
          const isEditing = editingId === a.id;
          return (
            <div
              key={a.id}
              className={cx(
                "group relative flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition",
                isSelected
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
              onClick={() => {
                if (!isEditing) onSelect(a.id);
              }}
            >
              {/* Status dot */}
              <div
                className={cx(
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                  a.isActive ? "bg-emerald-500" : "bg-slate-300"
                )}
                title={a.isActive ? "Activo" : "Pausado"}
              />

              {/* Main block */}
              <div className="min-w-0 flex-1">
                {/* Name (or inline edit) */}
                {!isEditing ? (
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium text-slate-800">
                      {a.name}
                    </div>
                    {a.isActive && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <BadgeCheck className="h-3 w-3" /> activo
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmRename(a.id);
                        if (e.key === "Escape") cancelRename();
                      }}
                      autoFocus
                      className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => confirmRename(a.id)}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 p-1 text-emerald-700 hover:bg-emerald-100"
                      title="Guardar"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelRename}
                      className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                      title="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Meta */}
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  {a.slug ? <span>/{a.slug}</span> : <span className="italic text-slate-400">sin slug</span>}
                  {typeof a.companyCount === "number" && (
                    <span>{a.companyCount} empresa{a.companyCount === 1 ? "" : "s"}</span>
                  )}
                  {a.updatedAt && (
                    <span>
                      act. {new Date(a.updatedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!isEditing && (
                <div
                  className="absolute right-2 top-2 hidden gap-1 rounded-lg bg-white/90 p-1 shadow-sm group-hover:flex"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => startRename(a)}
                    className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
                    title="Renombrar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDuplicate(a.id)}
                    className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onToggleActive(a.id, !a.isActive)}
                    className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
                    title={a.isActive ? "Pausar" : "Activar"}
                  >
                    {a.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => onDelete(a.id)}
                    className="rounded-md p-1 text-rose-600 hover:bg-rose-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500">
        Selecciona un agente para editar su flujo y ajustes. Crea o duplica para experimentar sin miedo.
      </div>
    </aside>
  );
}