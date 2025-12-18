// app/components/crussader/cards/StandardCard.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;

  icon: LucideIcon;
  bgIcon: LucideIcon;

  cardClassName?: string;
  borderClassName?: string;

  iconTintClassName?: string;
  bgIconTintClassName?: string;

  headerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;

  iconClassName?: string;

  children: React.ReactNode;
};

export default function StandardCard({
  title,
  icon: Icon,
  bgIcon: BgIcon,
  children,

  cardClassName = "",
  borderClassName = "",

  iconTintClassName = "",
  bgIconTintClassName = "",

  headerClassName = "",
  contentClassName = "",
  titleClassName = "",

  iconClassName = "",
}: Props) {
  const cardClasses = [
    "relative overflow-hidden",
    "min-h-[118px]", // ✅ baseline de altura (ajustable)
    "border",        // ✅ todas con borde siempre
    borderClassName ? borderClassName : "border-slate-100",
    cardClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className={cardClasses}>
      {/* BG icon estandar */}
      <BgIcon
        className={[
          "pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 opacity-20",
          bgIconTintClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      />

      <CardHeader
        className={[
          "pb-2 pt-4 px-4", // ✅ padding fijo (evita alturas distintas)
          headerClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <CardTitle
          className={[
            "flex items-center gap-2",
            "text-sm sm:text-base font-semibold", // ✅ título consistente
            "leading-tight",
            titleClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Icon
            className={[
              "h-5 w-5", // ✅ icono consistente
              iconTintClassName,
              iconClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <span className="min-w-0">{title}</span>
        </CardTitle>
      </CardHeader>

      <CardContent
        className={[
          "pt-0 pb-4 px-4", // ✅ padding fijo
          "space-y-1",      // ✅ spacing base
          contentClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </CardContent>
    </Card>
  );
}
