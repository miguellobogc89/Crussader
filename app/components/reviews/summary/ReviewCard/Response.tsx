// app/components/reviews/summary/ReviewCard/Response.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  RotateCcw,
  Edit3,
  Save,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";

export type UIStatus = "pending" | "published" | "draft";

type VersionInfo = {
  index: number; // índice actual (0-based)
  total: number; // total de versiones
  onPrev?: () => void;
  onNext?: () => void;
};

type Props = {
  content: string;
  status?: UIStatus;
  published?: boolean;
  edited?: boolean;
  title?: string;
  onUnpublish?: () => Promise<void> | void;

  // origen real (AI/HUMAN/GOOGLE/GOOGLE_SYNC...)
  source?: string;

  allowRegenerate?: boolean;
  allowPublish?: boolean;
  allowEdit?: boolean;

  busy?: boolean;

  onRegenerate?: () => Promise<void> | void;
  onPublish?: () => Promise<void> | void;
  onSave?: (newContent: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;

  reviewId?: string;
  responseId?: string;

  defaultEditing?: boolean;

  versionInfo?: VersionInfo;
};

export default function Response({
  content,
  status = "draft",
  published,
  edited, // mantenido por compat aunque no se pinte
  title = "Respuesta generada con IA",
  source,

  allowRegenerate = true,
  allowPublish = true,
  allowEdit = true,

  busy = false,

  onRegenerate,
  onPublish,
  onSave,
  onDelete,
  onUnpublish,

  defaultEditing = false,
  versionInfo,
}: Props) {
  const isPublished = useMemo(() => {
    if (typeof published === "boolean") return published;
    return status === "published";
  }, [published, status]);

  const origin = useMemo<"ai" | "google" | "human">(() => {
    const s = (source || "").toUpperCase();
    if (s === "AI") return "ai";
    if (s === "GOOGLE" || s === "GOOGLE_SYNC") return "google";
    if (s === "HUMAN") return "human";

    if (isPublished) return "google";
    return "ai";
  }, [source, isPublished]);

  const isGoogleOrigin = origin === "google";
  const isHumanOrigin = origin === "human";

  const [isEditing, setIsEditing] = useState<boolean>(
    defaultEditing && !isPublished
  );
  const [draft, setDraft] = useState<string>(content);

  useEffect(() => {
    if (!isEditing) {
      setDraft(content);
    }
  }, [content, isEditing]);

  function startEdit() {
    if (!allowEdit || busy) return;
    setDraft(content);
    setIsEditing(true);
  }

  function cancelEdit() {
    if (busy) return;
    setIsEditing(false);
    setDraft(content);
  }

  async function saveEdit() {
    if (!onSave || busy) return;
    const next = draft.trim();
    if (!next.length) return;
    await onSave(next);
    setIsEditing(false);
  }

  const canRegenerate = !!onRegenerate && allowRegenerate && !isPublished;
  const canPublish = !!onPublish && allowPublish && !isPublished;
  const canUnpublish = !!onUnpublish && isPublished;

  const headerTitle = useMemo(() => {
    if (isGoogleOrigin) return "Respuesta escrita en Google";
    if (isHumanOrigin) return "Respuesta escrita a mano";
    return title;
  }, [isGoogleOrigin, isHumanOrigin, title]);

  const showPaginator =
    !!versionInfo && versionInfo.total > 1 && !isPublished;

  const baseTextStyle: CSSProperties = {
    fontSize: "clamp(14px,1.0vw,15px)",
    lineHeight: "clamp(20px,2.2vw,24px)",
    letterSpacing: "0.005em",
  };

  const headerTextStyle: CSSProperties = {
    fontSize: "clamp(14px,1.3vw,16px)",
    lineHeight: "clamp(18px,2.0vw,22px)",
    letterSpacing: "0.005em",
    fontWeight: 600,
  };

  const wrapperStyle: CSSProperties = {
    fontFamily:
      '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontWeight: 400,
  };

  return (
    <section
      className={[
        "relative max-w-full rounded-xl",
        isPublished ? "p-2 sm:p-3 space-y-2" : "p-3 sm:p-4 space-y-3 sm:space-y-4",
      ].join(" ")}
      aria-live="polite"
      style={wrapperStyle}
    >
      {busy && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
        </div>
      )}

      {/* Header: izquierda (icono+título) / derecha (paginador o papelera) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {isGoogleOrigin ? (
            <img
              src="/platform-icons/google-business.png"
              alt="Google Business Profile"
              className="w-[clamp(14px,1.2vw,16px)] h-[clamp(14px,1.2vw,16px)]"
            />
          ) : (
            <Sparkles className="w-4 h-4 text-violet-500" />
          )}
          <h5 className="text-foreground truncate" style={headerTextStyle}>
            {headerTitle}
          </h5>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-2 shrink-0">
          {canUnpublish && (
            <button
              type="button"
              onClick={onUnpublish}
              disabled={busy}
              title="Quitar de Google"
              aria-label="Quitar de Google"
              className="
                inline-flex items-center justify-center
                h-8 w-8 rounded-md
                bg-white
                text-red-600
                ring-1 ring-red-200/60
                hover:bg-red-50
                disabled:opacity-50
                transition-colors
              "
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          {showPaginator && (
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <button
                type="button"
                onClick={versionInfo.onPrev}
                disabled={busy || versionInfo.total <= 1}
                className="
                  h-7 w-7 flex items-center justify-center rounded-full
                  border border-neutral-200 text-neutral-400
                  hover:text-neutral-700 hover:bg-neutral-50
                  disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-400
                "
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="px-1 min-w-[44px] text-center text-neutral-500">
                {versionInfo.index + 1}/{versionInfo.total}
              </span>
              <button
                type="button"
                onClick={versionInfo.onNext}
                disabled={busy || versionInfo.total <= 1}
                className="
                  h-7 w-7 flex items-center justify-center rounded-full
                  border border-neutral-200 text-neutral-400
                  hover:text-neutral-700 hover:bg-neutral-50
                  disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-400
                "
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      {!isEditing ? (
        <div className="text-foreground/90 whitespace-pre-wrap" style={baseTextStyle}>
          {content}
        </div>
      ) : (
        <div className="mt-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            disabled={busy}
            className="
              w-full rounded-lg border border-border p-3 outline-none
              focus:border-muted-foreground/50 disabled:opacity-60
            "
            style={baseTextStyle}
            placeholder="Edita la respuesta…"
          />
        </div>
      )}

      {/* Footer: solo si NO está publicada (si está publicada, no queremos botones abajo) */}
      {!isPublished && (
        <div className="pt-0">
          {!isEditing && (
            <div className="flex items-center gap-2 flex-nowrap w-full justify-end">
              {canRegenerate && (
                <IconButton
                  icon={<RotateCcw className="h-4 w-4" />}
                  label="Regenerar"
                  onClick={onRegenerate}
                  disabled={busy}
                />
              )}

              {allowEdit && (
                <IconButton
                  icon={<Edit3 className="h-4 w-4" />}
                  label="Editar"
                  onClick={startEdit}
                  disabled={busy}
                />
              )}

              {canPublish && (
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={busy}
                  title="Publicar"
                  aria-label="Publicar"
                  className="
                    inline-flex items-center gap-2
                    h-8 px-3 rounded-full
                    text-[11px] font-medium
                    text-white
                    bg-gradient-to-r from-violet-600 to-fuchsia-600
                    shadow-sm
                    hover:brightness-110
                    focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-violet-300
                    disabled:opacity-50
                    transition
                  "
                >
                  <Send className="h-4 w-4" />
                  Publicar
                </button>
              )}


            </div>
          )}

          {isEditing && (
            <div className="flex items-center gap-2">
              <IconButton
                icon={<Save className="h-4 w-4" />}
                label="Guardar"
                onClick={saveEdit}
                disabled={busy || draft.trim().length === 0}
                solid
              />
              <IconButton
                icon={<X className="h-4 w-4" />}
                label="Cancelar"
                onClick={cancelEdit}
                disabled={busy}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  disabled,
  solid,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  solid?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={[
        "inline-flex items-center justify-center h-8 w-8 rounded-md text-neutral-600",
        "transition-colors disabled:opacity-50",
        solid ? "bg-foreground text-white hover:brightness-95" : "hover:text-foreground",
      ].join(" ")}
    >
      {icon}
    </button>
  );
}
