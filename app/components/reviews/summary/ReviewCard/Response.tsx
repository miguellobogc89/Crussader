"use client";

import { useMemo, useState } from "react";
import {
  RotateCcw,
  Edit3,
  Save,
  X,
  Send,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
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

  // 🔥 NUEVO: origen real de la respuesta
  // valores típicos en BD: "AI", "HUMAN", "GOOGLE", "GOOGLE_SYNC", etc.
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

  defaultEditing = false,
  versionInfo,
}: Props) {
  const isPublished = useMemo(() => {
    if (typeof published === "boolean") return published;
    return status === "published";
  }, [published, status]);

  // 🔥 Determinamos el origen REAL en base a `source`
  // y, si no está definido, hacemos un fallback:
  // - si está publicada → asumimos Google
  // - si no → asumimos IA (como hasta ahora)
  const origin = useMemo<"ai" | "google" | "human">(() => {
    const s = (source || "").toUpperCase();

    if (s === "AI") return "ai";
    if (s === "GOOGLE" || s === "GOOGLE_SYNC") return "google";
    if (s === "HUMAN") return "human";

    // Fallback para registros antiguos:
    if (isPublished) return "google";
    return "ai";
  }, [source, isPublished]);

  const isGoogleOrigin = origin === "google";
  const isAIOrigin = origin === "ai";
  const isHumanOrigin = origin === "human";

  const [isEditing, setIsEditing] = useState<boolean>(
    defaultEditing && !isPublished,
  );
  const [draft, setDraft] = useState<string>(content);

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

  // Texto de cabecera según origen
  const headerTitle = useMemo(() => {
    if (isGoogleOrigin) return "Respuesta escrita en Google";
    if (isHumanOrigin) return "Respuesta escrita a mano";
    // IA (o fallback) → usamos el título por defecto
    return title;
  }, [isGoogleOrigin, isHumanOrigin, title]);

  return (
    <section
      className="relative p-3 sm:p-4 max-w-full space-y-3 sm:space-y-4 rounded-xl"
      aria-live="polite"
    >
      {/* Overlay spinner mientras está ocupado */}
      {busy && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
        </div>
      )}

      {/* Header: icono + título */}
      <div className="flex items-center gap-2">
        {isGoogleOrigin ? (
          <img
            src="/platform-icons/google-business.png"
            alt="Google Business Profile"
            className="w-4 h-4"
          />
        ) : (
          <Sparkles className="w-4 h-4 text-violet-500" />
        )}
        <h5
          className="font-medium text-foreground"
          style={{ fontSize: "clamp(13px,1.2vw,14px)" }}
        >
          {headerTitle}
        </h5>
      </div>

      {/* Contenido */}
      {!isEditing ? (
        <div className="text-foreground/90 whitespace-pre-wrap text-[15px] leading-6">
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
              w-full rounded-lg border border-border p-3 text-[15px] leading-6 outline-none
              focus:border-muted-foreground/50 disabled:opacity-60
            "
            placeholder="Edita la respuesta…"
          />
        </div>
      )}

      {/* Footer: siempre misma línea horizontal */}
      <div className="pt-2">
        {/* Modo no edición: misma fila tanto para draft como publicado */}
        {!isEditing && (
          <div className="flex items-center gap-2 flex-nowrap w-full">
            {/* Draft / pendiente: botones activos */}
            {!isPublished && (
              <>
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
                  <IconButton
                    icon={<Send className="h-4 w-4" />}
                    label="Publicar"
                    onClick={onPublish}
                    disabled={busy}
                  />
                )}
              </>
            )}

            {/* Borrar: único botón visible cuando está publicada */}
            {onDelete && isPublished && (
              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                title="Eliminar"
                aria-label="Eliminar"
                className="ml-1 text-neutral-400 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}


            {/* Selector de versiones: siempre en la misma fila, pegado a la derecha */}
            {versionInfo && (
              <div className="ml-auto flex items-center gap-1 text-xs text-neutral-500">
                <button
                  type="button"
                  onClick={versionInfo.onPrev}
                  disabled={busy || versionInfo.total <= 1}
                  className="h-6 w-6 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="px-1 min-w-[40px] text-center text-neutral-500">
                  {versionInfo.index + 1}/{versionInfo.total}
                </span>
                <button
                  type="button"
                  onClick={versionInfo.onNext}
                  disabled={busy || versionInfo.total <= 1}
                  className="h-6 w-6 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modo edición */}
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
    </section>
  );
}

/* ======= Botón icono para toolbar ======= */
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
      className={`
        inline-flex items-center justify-center h-8 w-8 rounded-md text-neutral-600
        transition-colors disabled:opacity-50
        ${
          solid
            ? "bg-foreground text-white hover:brightness-95"
            : "hover:text-foreground"
        }
      `}
    >
      {icon}
    </button>
  );
}
