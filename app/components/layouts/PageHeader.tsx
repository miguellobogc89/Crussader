// app/components/layouts/PageHeader.tsx
"use client";

import { ReactNode } from "react";
import PageTitle from "./PageTitle";

type Props = {
  title: string;
  description?: string;
  titleIconName?: React.ComponentProps<typeof PageTitle>["iconName"];
  className?: string;
  /** Contenido opcional alineado a la derecha (botón, actions, etc.) */
  rightSlot?: ReactNode;
};

/**
 * Cabecera superior fija sin márgenes: ocupa todo el ancho,
 * mantiene el formato de PageTitle, sin borde ni iconos laterales.
 */
export default function PageHeader({
  title,
  description,
  titleIconName,
  className = "",
  rightSlot,
}: Props) {
  const hasRight = !!rightSlot;

  return (
    <header
      className={[
        "w-full h-20 flex items-center bg-white px-4 sm:px-6 lg:px-8 border",
        hasRight ? "justify-between gap-4" : "",
        className,
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <PageTitle
          title={title}
          subtitle={description}
          iconName={titleIconName}
          size="lg"
          gradient="from-indigo-600 via-violet-600 to-fuchsia-600"
        />
      </div>

      {hasRight && (
        <div className="shrink-0 flex items-center justify-end">
          {rightSlot}
        </div>
      )}
    </header>
  );
}
