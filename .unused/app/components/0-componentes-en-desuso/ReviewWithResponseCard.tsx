// app/components/reviews/ReviewWithResponseCard.tsx
"use client";

import { useMemo, useState } from "react";
import { Stars } from "@/app/components/reviews/summary/ReviewCard/Stars";
// import ActionButton from "./ActionButton";  // ya no lo usamos
import {
  ChevronLeft,
  ChevronRight,
  Wand2,
  RotateCcw,
  Edit3,
  Save,
  X,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  reviewerName?: string | null;
  createdAtG?: string | Date | null;
  ingestedAt: string | Date;
};

type ResponseRow = {
  id: string;
  content: string;
  status: "PENDING" | "APPROVED" | "PUBLISHED" | "REJECTED" | "DISABLED";
  published: boolean;
  createdAt: string | Date;
  edited: boolean;
};

type Props = {
  review: Review;
  responses?: ResponseRow[];
};

function fmt(d: string | Date | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeZone: "Europe/Madrid",
  }).format(date);
}

export default function ReviewWithResponseCard({ review, responses }: Props) {
  // ---- estado existente ----
  const initialList = useMemo<ResponseRow[]>(() => responses ?? [], [responses]);
  const initialIndex = useMemo(() => {
    const i = initialList.findIndex((r) => r.published);
    return i >= 0 ? i : 0;
  }, [initialList]);

  const [list, setList] = useState<ResponseRow[]>(initialList);
  const [idx, setIdx] = useState<number>(list.length > 0 ? initialIndex : -1);
  const current = idx >= 0 ? list[idx] : undefined;

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");

  // Nuevo: mostrar/ocultar el panel de respuesta (si existe)
  const [showResponse, setShowResponse] = useState(false);

  const canCycle = list.length > 1;

  // ---- Handlers ----
  async function handleGenerateOrRegenerate() {
    if (isEditing) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.response) {
        throw new Error(data?.error || "No se pudo generar la respuesta");
      }
      const r = data.response as ResponseRow;
      setList((prev) => [r, ...prev]);
      setIdx(0);
      setShowResponse(true);
      setMsg("Generada ✔");
    } catch (e: any) {
      setMsg(`Error: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  async function handlePublish() {
    if (!current) return;
    setBusy(true);
    setMsg(null);

    const prevStatus: ResponseRow["status"] = current.status;
    setList((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, published: true, status: "PUBLISHED" } : r
      )
    );

    try {
      const res = await fetch(`/api/responses/${current.id}/publish`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("No se pudo publicar");
      setMsg("Publicado ✔");
    } catch (e: any) {
      setList((prev) =>
        prev.map((r, i) =>
          i === idx ? { ...r, published: false, status: prevStatus } : r
        )
      );
      setMsg(`Error: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  function goPrev() {
    if (isEditing || list.length === 0) return;
    setIdx((i) => (i <= 0 ? list.length - 1 : i - 1));
  }
  function goNext() {
    if (isEditing || list.length === 0) return;
    setIdx((i) => (i >= list.length - 1 ? 0 : i + 1));
  }

  function startEdit() {
    if (!current) return;
    setDraft(current.content);
    setIsEditing(true);
    setMsg(null);
  }

  async function saveEdit() {
    if (!current) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/responses/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "No se pudo guardar la respuesta");

      const updated = data?.response as ResponseRow | undefined;
      setList((prev) =>
        prev.map((r, i) =>
          i === idx ? { ...r, ...(updated ?? { content: draft, edited: true }) } : r
        )
      );
      setIsEditing(false);
      setMsg("Guardada ✔");
    } catch (e: any) {
      setMsg(`Error: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  function cancelEdit() {
    setIsEditing(false);
    setDraft("");
  }

  return (
    <div className="relative">
      {/* CARD SUPERIOR: REVIEW (solo review por defecto) */}
      <div className="relative rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Stars value={review.rating} />
              <span className="text-sm text-neutral-500">
                {fmt(review.createdAtG ?? review.ingestedAt)}
              </span>
            </div>
            <div className="mt-1 text-sm text-neutral-600 truncate">
              {review.reviewerName ?? "Cliente"}
            </div>
          </div>
        </div>

        <div className="mt-3 whitespace-pre-wrap text-[15px] leading-6 text-neutral-900">
          {review.comment ?? "—"}
        </div>

        {/* Botón flotante para generar / regenerar (esquina inferior derecha) */}
        {list.length === 0 ? (
          <button
            onClick={handleGenerateOrRegenerate}
            disabled={busy}
            title="Generar respuesta"
            aria-label="Generar respuesta"
            className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white shadow hover:bg-neutral-50 disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
          </button>
        ) : (
          /* Si ya hay respuestas, mostramos un toggle para expandir/ocultar */
          <button
            onClick={() => setShowResponse((v) => !v)}
            className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 text-xs text-neutral-700 shadow hover:bg-neutral-50"
            title={showResponse ? "Ocultar respuesta" : "Ver respuesta"}
            aria-label={showResponse ? "Ocultar respuesta" : "Ver respuesta"}
          >
            {showResponse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showResponse ? "Ocultar" : "Ver respuesta"}
          </button>
        )}
      </div>

      {/* Conector visual */}
      {showResponse && <div className="h-5 w-px bg-neutral-300 ml-12" />}

      {/* CARD INFERIOR: RESPUESTA (colapsable; solo si showResponse) */}
      {showResponse && (
        <div className="rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium text-neutral-700">Respuesta del negocio</div>
            {current ? (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                  current.published
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : current.status === "PENDING"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-neutral-50 text-neutral-700 border border-neutral-200"
                }`}
              >
                {current.published ? "PUBLISHED" : current.status}
                {current.edited ? " · EDITED" : ""}
              </span>
            ) : null}
          </div>

          <div className="mt-3 min-h-[48px] text-[15px] leading-6 text-neutral-900">
            {current ? (
              isEditing ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 p-3 text-[15px] leading-6 outline-none focus:border-neutral-400"
                  rows={5}
                />
              ) : (
                <div className="whitespace-pre-wrap">{current.content}</div>
              )
            ) : (
              <span className="text-neutral-500">Sin respuesta todavía.</span>
            )}
          </div>

          {/* FOOTER: icon-only actions + paginación pegada abajo */}
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between">
              {/* Grupo de iconos (no ocupan toda la barra) */}
              <div className="flex items-center gap-2">
                {/* Generar / Regenerar */}
                <button
                  onClick={handleGenerateOrRegenerate}
                  disabled={busy || isEditing}
                  title={list.length > 0 ? "Regenerar" : "Generar"}
                  aria-label={list.length > 0 ? "Regenerar" : "Generar"}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-50"
                >
                  {list.length > 0 ? <RotateCcw className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
                </button>

                {/* Editar / Guardar / Cancelar */}
                {!isEditing && current && (
                  <button
                    onClick={startEdit}
                    disabled={busy}
                    title="Editar"
                    aria-label="Editar"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-50"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={saveEdit}
                      disabled={busy || draft.trim().length === 0}
                      title="Guardar"
                      aria-label="Guardar"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={busy}
                      title="Cancelar"
                      aria-label="Cancelar"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}

                {/* Publicar */}
                {current && (
                  <button
                    onClick={handlePublish}
                    disabled={busy || isEditing || current.published}
                    title={current.published ? "Publicado" : "Publicar"}
                    aria-label={current.published ? "Publicado" : "Publicar"}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}

                {/* Mensaje de estado */}
                {msg && <span className="ml-2 text-sm text-neutral-600">{msg}</span>}
              </div>

              {/* Paginación pegada al bottom (ya está en el extremo inferior del card) */}
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  onClick={goPrev}
                  disabled={isEditing || !canCycle}
                  title="Anterior"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="px-2 text-xs text-neutral-500">
                  {list.length > 0 ? `${idx + 1} / ${list.length}` : "0 / 0"}
                </div>
                <button
                  className="rounded-full border px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  onClick={goNext}
                  disabled={isEditing || !canCycle}
                  title="Siguiente"
                  aria-label="Siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
