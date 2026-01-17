// app/components/crussader/cards/StandardCard.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { motion, type Variants } from "framer-motion";

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

  // ✅ Nuevo: footer estándar “pegado abajo”
  footer?: React.ReactNode;
  footerClassName?: string;
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
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

  footer,
  footerClassName = "",
}: Props) {
  const cardClasses = [
    "relative overflow-hidden",
    "min-h-[118px]",
    "border",
    "flex flex-col", // ✅ necesario para que el contenido pueda “estirar”
    borderClassName ? borderClassName : "border-slate-100",
    cardClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div variants={itemVariants}>
      <Card className={cardClasses}>
        <BgIcon
          className={[
            "pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 opacity-20",
            bgIconTintClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        />

        <CardHeader className={["pb-2 pt-4 px-4", headerClassName].filter(Boolean).join(" ")}>
          <CardTitle
            className={[
              "flex items-center gap-2",
              "text-sm sm:text-base font-semibold",
              "leading-tight",
              titleClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Icon className={["h-5 w-5", iconTintClassName, iconClassName].filter(Boolean).join(" ")} />
            <span className="min-w-0">{title}</span>
          </CardTitle>
        </CardHeader>

        <CardContent
          className={[
            "pt-0 pb-4 px-4",
            "space-y-1",
            "flex-1 flex flex-col", // ✅ permite footer abajo con mt-auto
            contentClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {/* contenido */}
          <div className="space-y-1">
            {children}
          </div>

          {/* footer estándar */}
          {footer ? (
            <div className={["mt-auto", footerClassName].filter(Boolean).join(" ")}>
              {footer}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
