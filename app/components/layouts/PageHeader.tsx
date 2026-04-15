// app/components/layouts/PageHeader.tsx
"use client";

import { ReactNode } from "react";
import PageTitle from "./PageTitle";
import PageHeaderUserMenu from "./PageHeaderUserMenu";
import { PAGE_HEADER_HEIGHT, PAGE_HEADER_PADDING } from "@/app/layout/config";

type Props = {
  title: string;
  description?: string;
  titleIconName?: React.ComponentProps<typeof PageTitle>["iconName"];
  className?: string;
  rightSlot?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  titleIconName,
  className = "",
  rightSlot,
}: Props) {
  return (
    <header
      className={[
        "w-full border-b border-slate-200 bg-white",
        "flex items-center justify-between gap-3",
        "h-12 px-3",
        "md:h-[64px] md:px-4",
        "xl:h-[66px] xl:px-5",
        "xl2:h-18 xl2:px-8",
        className,
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <PageTitle
          title={title}
          subtitle={description}
          iconName={titleIconName}
          size="lg"
          gradient="from-indigo-600 via-violet-600 to-fuchsia-600"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        {rightSlot}

        <PageHeaderUserMenu />
      </div>
    </header>
  );
}