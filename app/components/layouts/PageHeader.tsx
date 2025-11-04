// app/components/layouts/PageHeader.tsx
"use client";

import PageTitle from "./PageTitle";

type Props = {
  title: string;
  description?: string;
  titleIconName?: React.ComponentProps<typeof PageTitle>["iconName"];
  className?: string;
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
}: Props) {
  return (
    <header
      className={[
        "w-full h-20 flex items-center",
        "bg-white px-4 sm:px-6 lg:px-8",
        className,
      ].join(" ")}
    >
      <PageTitle
        title={title}
        subtitle={description}
        iconName={titleIconName}
        size="lg"
        gradient="from-indigo-600 via-violet-600 to-fuchsia-600"
      />
    </header>
  );
}
