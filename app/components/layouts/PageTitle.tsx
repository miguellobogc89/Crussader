// app/components/layouts/PageTitle.tsx
"use client";

import * as Icons from "lucide-react";
import { ComponentType } from "react";

type LucideIconName = keyof typeof Icons;
type PageTitleSize = "sm" | "md" | "lg" | "xl";

type PageTitleProps = {
  title: string;
  subtitle?: string;
  iconName?: LucideIconName;
  className?: string;
  gradient?: string;
  size?: PageTitleSize;
};

const ICON_BOX_BY_SIZE = {
  sm: "h-6 w-6 rounded-lg md:h-7 md:w-7 xl:h-6 xl:w-6 xl2:h-7 xl2:w-7",
  md: "h-7 w-7 rounded-lg md:h-8 md:w-8 xl:h-7 xl:w-7 xl2:h-8 xl2:w-8",
  lg: "h-8 w-8 rounded-xl md:h-9 md:w-9 xl:h-8 xl:w-8 xl2:h-9 xl2:w-9",
  xl: "h-9 w-9 rounded-xl md:h-10 md:w-10 xl:h-10 xl:w-10 xl2:h-11 xl2:w-11",
};

const ICON_SIZE_BY_SIZE: Record<PageTitleSize, string> = {
  sm: "h-3.5 w-3.5 md:h-4 md:w-4 xl:h-3.5 xl:w-3.5 xl2:h-4 xl2:w-4",
  md: "h-4 w-4 md:h-5 md:w-5 xl:h-4 xl:w-4 xl2:h-5 xl2:w-5",
  lg: "h-4 w-4 md:h-5 md:w-5 xl:h-4 xl:w-4 xl2:h-5 xl2:w-5",
  xl: "h-5 w-5 md:h-6 md:w-6 xl:h-5 xl:w-5 xl2:h-6 xl2:w-6",
};

const TITLE_SIZE_BY_SIZE = {
  sm: "text-[13px] md:text-sm xl:text-[13px] xl2:text-sm",
  md: "text-sm md:text-[15px] xl:text-[15px] xl2:text-base",
  lg: "text-[15px] md:text-lg xl:text-[17px] xl2:text-lg",
  xl: "text-lg md:text-xl xl:text-[20px] xl2:text-[24px]",
};

const SUBTITLE_SIZE_BY_SIZE = {
  sm: "text-[11px] md:text-xs xl:text-[11px] xl2:text-xs",
  md: "text-[11px] md:text-xs xl:text-[12px] xl2:text-sm",
  lg: "text-[11px] md:text-xs xl:text-[12px] xl2:text-sm",
  xl: "text-xs md:text-sm xl:text-[13px] xl2:text-base",
};

const GAP_BY_SIZE: Record<PageTitleSize, string> = {
  sm: "gap-2 md:gap-2.5 xl:gap-2 xl2:gap-2.5",
  md: "gap-2.5 md:gap-3 xl:gap-2.5 xl2:gap-3",
  lg: "gap-2.5 md:gap-3 xl:gap-2.5 xl2:gap-3",
  xl: "gap-2.5 md:gap-3 xl:gap-2.5 xl2:gap-3",
};

export default function PageTitle({
  title,
  subtitle,
  iconName,
  className = "",
  gradient = "from-indigo-600 via-violet-600 to-fuchsia-600",
  size = "lg",
}: PageTitleProps) {
  const iconKey = iconName as LucideIconName | undefined;
  const hasIcon = Boolean(iconKey && Icons[iconKey]);

  let Icon: ComponentType<{ className?: string }> | undefined;

  if (hasIcon && iconKey) {
    Icon = Icons[iconKey] as ComponentType<{ className?: string }>;
  }

  const iconBox = ICON_BOX_BY_SIZE[size];
  const iconSize = ICON_SIZE_BY_SIZE[size];
  const titleSize = TITLE_SIZE_BY_SIZE[size];
  const subtitleSize = SUBTITLE_SIZE_BY_SIZE[size];
  const gapSize = GAP_BY_SIZE[size];

  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className={`flex items-center ${gapSize}`}>
        {Icon ? (
          <div
            className={`grid shrink-0 place-items-center bg-gradient-to-r text-white shadow-lg ${gradient} ${iconBox}`}
            aria-hidden="true"
          >
            <Icon className={iconSize} />
          </div>
        ) : null}

        <div className="min-w-0">
          <h1 className={`font-bold leading-tight text-foreground ${titleSize}`}>
            {title}
          </h1>

          {subtitle ? (
            <p className={`text-muted-foreground ${subtitleSize}`}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}