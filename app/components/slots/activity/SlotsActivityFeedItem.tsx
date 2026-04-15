// app/components/slots/activity/SlotsActivityFeedItem.tsx
"use client";

import { motion } from "framer-motion";
import {
  getActivityDescription,
  getActivityTitle,
  getItemVisual,
} from "@/app/components/slots/helpers/slotsActivityFeedHelpers";

type Props = {
  item: any;
  index: number;
};

export function SlotsActivityFeedItem({ item, index }: Props) {
  const visual = getItemVisual(item.status);
  const Icon = visual.icon;
  const title = getActivityTitle(item);

let rowClassName =
  "relative flex items-start gap-2 rounded-xl px-2.5 py-2.5 transition-colors xl:gap-2.5 xl:px-3 xl:py-3 xl2:gap-3 xl2:rounded-2xl xl2:px-3 xl2:py-3";

  if (visual.rowBg !== "") {
    rowClassName = `relative flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors xl:gap-3 xl:px-3 xl:py-3 xl2:gap-4 xl2:rounded-2xl xl2:px-3 xl2:py-3 ${visual.rowBg}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={rowClassName}
    >
<div
  className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center xl:h-6 xl:w-6 xl2:h-7 xl2:w-7"
>
        <Icon
        className={`h-3 w-3 xl:h-3 xl:w-3 xl2:h-3.5 xl2:w-3.5 ${visual.iconColor}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-baseline justify-between gap-2 xl:gap-3">
          <p className="text-[12px] font-semibold leading-tight text-slate-800 xl:text-[13px] xl2:text-[15px]">
            {title}
          </p>

          <span className="shrink-0 text-[10px] font-medium tabular-nums text-slate-500 xl:text-[11px] xl2:text-[13px]">
            {new Date(item.time).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <p className="pr-1 text-[11px] leading-4 text-slate-500 xl:pr-2 xl:text-xs xl2:text-[13px] xl2:leading-5">
          {getActivityDescription(item)}
        </p>
      </div>
    </motion.div>
  );
}