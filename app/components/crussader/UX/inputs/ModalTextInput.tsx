"use client";

import type { ComponentProps } from "react";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";

export const MODAL_INPUT_CLASS =
  "h-11 w-full rounded-xl border-[#E5E7EB] bg-white px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-primary/30";

type ModalTextInputProps = ComponentProps<typeof Input>;

export default function ModalTextInput({
  className,
  ...props
}: ModalTextInputProps) {
  return <Input {...props} className={cn(MODAL_INPUT_CLASS, className)} />;
}
