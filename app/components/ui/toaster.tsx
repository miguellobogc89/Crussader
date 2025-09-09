"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/app/components/ui/toast";
import { CheckCircle2, XCircle, Info } from "lucide-react";

const iconByVariant: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  error: <XCircle className="h-5 w-5 text-rose-600" />,
  info: <Info className="h-5 w-5 text-sky-600" />,
  default: null,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const Icon = iconByVariant[variant ?? "default"];
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              {Icon}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
