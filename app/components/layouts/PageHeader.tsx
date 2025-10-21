"use client";

import Breadcrumbs, {
} from "@/app/components/crussader/navigation/Breadcrumbs";

type Props = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Cabecera de página estándar: muestra breadcrumbs + título + descripción + acciones.
 */
export default function PageHeader({
  title,
  description,
  actions,
  className = "",
}: Props) {
  return (
    <header
      className={[
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-2">

        {/* === Título y descripción === */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {/* === Acciones (botones, toggles, etc.) === */}
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
