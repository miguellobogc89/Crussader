"use client";

import { Badge } from "@/app/components/ui/badge";

type UIStatus = "pending" | "published" | "draft";

type Props = {
  content: string;
  /** Si la respuesta está publicada, solo se muestra el texto (sin badge) */
  published?: boolean;
  /** Estado actual si no está publicada */
  status?: UIStatus;
  /** Marca “edited” opcional en el badge (solo si no publicada) */
  edited?: boolean;
  /** Mostrar badge de estado cuando no publicada */
  showBadge?: boolean;
  /** Título opcional (por defecto “Respuesta del negocio”) */
  title?: string;
};

export default function Response({
  content,
  published = false,
  status = "draft",
  edited,
  showBadge = false,
  title = "Respuesta del negocio",
}: Props) {
  const textSize = "clamp(13px,1.3vw,14px)";
  const line = "clamp(18px,2vw,22px)";

  return (
    <section className="space-y-[clamp(8px,1.3vw,12px)]">
      <h5
        className="font-medium text-foreground"
        style={{ fontSize: "clamp(13px,1.2vw,14px)" }}
      >
        {title}
      </h5>

      {/* Texto (si publicada no mostramos badge) */}
      <p
        className="text-foreground/90 whitespace-pre-wrap"
        style={{ fontSize: textSize, lineHeight: line }}
      >
        {content}
      </p>

      {!published && showBadge && (
        <div>
          <StatusBadge status={status} edited={edited} />
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status, edited }: { status: UIStatus; edited?: boolean }) {
  const variants: Record<UIStatus, string> = {
    pending:
      "bg-[hsl(var(--pending))] text-[hsl(var(--pending-foreground))]",
    published:
      "bg-[hsl(var(--published))] text-[hsl(var(--published-foreground))]",
    draft: "bg-[hsl(var(--draft))] text-[hsl(var(--draft-foreground))]",
  };
  return (
    <Badge className={`capitalize font-medium ${variants[status]} whitespace-nowrap`}>
      {status}
      {edited ? " · edited" : ""}
    </Badge>
  );
}
