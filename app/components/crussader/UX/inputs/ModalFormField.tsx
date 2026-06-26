"use client";

import type { ReactNode } from "react";
import { Label } from "@/app/components/ui/label";

export const MODAL_FIELD_LABEL_CLASS = "text-sm font-medium text-foreground";

export type ModalFormFieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
};

export default function ModalFormField({
  label,
  children,
  hint,
  required = false,
}: ModalFormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className={MODAL_FIELD_LABEL_CLASS}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>

      {children}

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
