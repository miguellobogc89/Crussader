"use client";

import type { ComponentProps } from "react";
import { Textarea } from "@/app/components/ui/textarea";
import { cn } from "@/lib/utils";

export const MODAL_TEXTAREA_CLASS =
  "min-h-[120px] w-full resize-none rounded-xl border-[#E5E7EB] bg-white px-3 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-primary/30";

type ModalTextareaProps = ComponentProps<typeof Textarea>;

export default function ModalTextarea({
  className,
  ...props
}: ModalTextareaProps) {
  return <Textarea {...props} className={cn(MODAL_TEXTAREA_CLASS, className)} />;
}
