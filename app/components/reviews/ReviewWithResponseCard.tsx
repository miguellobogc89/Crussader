// app/components/reviews/ReviewWithResponseCard.tsx
"use client";

import { useMemo, useState } from "react";
import { Stars } from "./Stars";
import ActionButton from "./ActionButton";
import { ChevronLeft, ChevronRight } from "lucide-react"; 

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
      setMsg("Generada ✔");
    } catch (e: any) {
      setMsg(`Error: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
      const t = setTimeout(() => setMsg(null), 2500);
      // opcional: clearTimeout(t) si desmonta
    }
  }

  async function handlePublish() {
    if (!current) return;
    setBusy(true);
    setMsg(null);

    // Optimista con reversión precisa
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
      if (!res.ok) {
        throw new Error("No se pudo publicar");
      }
      setMsg("Publicado ✔");
    } catch (e: any) {
      // Revertir si falla
      setList((prev) =>
        prev.map((r, i) =>
          i === idx ? { ...r, published: false, status: prevStatus } : r
        )
      );
      setMsg(`Error: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
      const t = setTimeout(() => setMsg(null), 2500);
      // opcional: clearTimeout(t)
    }
  }

  function goPrev() {
    if (isEditing || list.length === 0) return;
    setIdx((i) => {
      if (i <= 0) return list.length - 1;
      return i - 1;
    });
  }
  function goNext() {
    if (isEditing || list.length === 0) return;
    setIdx((i) => {
      if (i >= list.length - 1) return 0;
      return i + 1;
    });
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
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "No se pudo guardar la respuesta");
      }

      const updated = data?.response as ResponseRow | undefined;
      setList((prev) =>
        prev.map((r, i) =>
          i === idx
            ? { ...r, ...(updated ?? { content: draft, edited: true }) }
            : r
        )
      );
      setIsEditing(false);
      setMsg("Guardada ✔");
    } catch (e: any) {
      setMsg(`Error: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
      const t = setTimeout(() => setMsg(null), 2500);
      // opcional: clearTimeout(t)
    }
  }

  function cancelEdit() {
    setIsEditing(false);
    setDraft("");
  }

  return (
    <div className="relative">
      {/* Card superior: REVIEW */}
      <div className="rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm">
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
      </div>

      {/* Conector visual */}
      <div className="h-5 w-px bg-neutral-300 ml-12" />

      {/* Card inferior: RESPUESTA */}
      <div className="rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-medium text-neutral-700">
            Respuesta del negocio
          </div>
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

        {/* Footer con acciones */}
        <div className="mt-4 items-center gap-3 border-t pt-3">
          <div className="grid grid-flow-col auto-cols-fr gap-2 flex-1">
            <ActionButton
              variant="regen"
              label={
                busy ? "Generando..." : list.length > 0 ? "Regenerar" : "Generar"
              }
              onClick={handleGenerateOrRegenerate}
              disabled={busy || isEditing}
              title="Generar o regenerar respuesta"
            />

            {current && !isEditing && (
              <ActionButton
                variant="edit"
                label="Editar"
                onClick={startEdit}
                disabled={busy}
                title="Editar manualmente"
              />
            )}

            {current && isEditing && (
              <>
                <ActionButton
                  variant="edit"
                  label={busy ? "Guardando..." : "Guardar"}
                  onClick={saveEdit}
                  disabled={busy || draft.trim().length === 0}
                  title="Guardar cambios"
                />
                <ActionButton
                  variant="edit"
                  label="Cancelar"
                  onClick={cancelEdit}
                  disabled={busy}
                  title="Cancelar edición"
                />
              </>
            )}

            {current && (
              <ActionButton
                variant="publish"
                label={
                  busy
                    ? "Publicando..."
                    : current.published
                    ? "Publicado"
                    : "Publicar"
                }
                onClick={handlePublish}
                disabled={busy || isEditing || current.published}
                title="Publicar"
              />
            )}
          </div>

          {/* Mensaje + paginación */}
          <div className="flex w-full items-center justify-between gap-3 shrink-0">
            <div>{msg && <span className="text-sm text-neutral-600">{msg}</span>}</div>

            <div className="pt-2 flex items-center gap-3">
              <button
                className="rounded-full border px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                onClick={goPrev}
                disabled={isEditing || !canCycle}
                title="Anterior"
                aria-label="Anterior"
              >
                ‹
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
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
