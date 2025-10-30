"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Edit3, Save, X, Send } from "lucide-react";

export type UIStatus = "pending" | "published" | "draft";

type Props = {
  content: string;
  status?: UIStatus;
  published?: boolean;
  edited?: boolean;
  title?: string;

  allowRegenerate?: boolean;
  allowPublish?: boolean;
  allowEdit?: boolean;

  busy?: boolean;

  onRegenerate?: () => Promise<void> | void;
  onPublish?: () => Promise<void> | void;
  onSave?: (newContent: string) => Promise<void> | void;

  defaultEditing?: boolean;
};

export default function Response({
  content,
  status = "draft",
  published,
  edited,
  title = "Respuesta del negocio",
  allowRegenerate = true,
  allowPublish = true,
  allowEdit = true,
  busy = false,
  onRegenerate,
  onPublish,
  onSave,
  defaultEditing = false,
}: Props) {
  const isPublished = useMemo(() => {
    if (typeof published === "boolean") return published;
    return status === "published";
  }, [published, status]);

  const [isEditing, setIsEditing] = useState<boolean>(defaultEditing && !isPublished);
  const [draft, setDraft] = useState<string>(content);

  function startEdit() {
    if (!allowEdit || isPublished || busy) return;
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
    if (next.length === 0) return;
    await onSave(next);
    setIsEditing(false);
  }

  return (
    <section
      className="
        rounded-xl border border-border/70 bg-gradient-to-br from-white to-muted/20
        p-3 sm:p-4 space-y-3 sm:space-y-4 max-w-full
      "
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h5 className="font-medium text-foreground" style={{ fontSize: "clamp(13px,1.2vw,14px)" }}>
          {title}
        </h5>
        {!isPublished && (
          <small
            className="
              inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium
              bg-neutral-50 text-neutral-700 border-neutral-200
            "
          >
            {status === "draft" ? "Borrador" : status === "pending" ? "Pendiente" : "Publicado"}
            {edited ? " · editada" : ""}
          </small>
        )}
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

      {/* Toolbar de acciones — SIEMPRE EN LÍNEA Y REDONDA */}
      {!isPublished && (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 max-w-full overflow-x-auto">
            {!isEditing && allowRegenerate && (
              <IconRoundButton
                icon={<RotateCcw className="h-4 w-4" />}
                srLabel="Regenerar"
                onClick={onRegenerate}
                disabled={busy}
              />
            )}

            {!isEditing && allowEdit && (
              <IconRoundButton
                icon={<Edit3 className="h-4 w-4" />}
                srLabel="Editar"
                onClick={startEdit}
                disabled={busy}
              />
            )}

            {!isEditing && allowPublish && (
              <IconRoundButton
                icon={<Send className="h-4 w-4" />}
                srLabel="Publicar"
                onClick={onPublish}
                disabled={busy}
              />
            )}

            {isEditing && (
              <>
                <IconRoundButton
                  variant="solid"
                  icon={<Save className="h-4 w-4" />}
                  srLabel="Guardar"
                  onClick={saveEdit}
                  disabled={busy || draft.trim().length === 0}
                />
                <IconRoundButton
                  icon={<X className="h-4 w-4" />}
                  srLabel="Cancelar"
                  onClick={cancelEdit}
                  disabled={busy}
                />
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ======= Botón redondo ======= */
function IconRoundButton({
  icon,
  srLabel,
  onClick,
  disabled,
  variant = "ghost",
}: {
  icon: React.ReactNode;
  srLabel: string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  variant?: "ghost" | "solid";
}) {
  const base =
    "inline-flex items-center justify-center rounded-full text-xs transition-colors h-10 w-10 shrink-0";
  const ghost = "border border-border bg-white hover:bg-muted/50 disabled:opacity-50";
  const solid = "bg-foreground text-background hover:brightness-95 disabled:opacity-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variant === "solid" ? solid : ghost}`}
      title={srLabel}
      aria-label={srLabel}
    >
      {icon}
      <span className="sr-only">{srLabel}</span>
    </button>
  );
}
