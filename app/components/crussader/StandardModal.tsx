// app/components/crussader/StandardModal.tsx
"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";

type Props = {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  onClose: () => void;
};

export default function StandardModal({
  open,
  title,
  children,
  footer,
  primaryLabel = "Aceptar",
  onPrimary,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="
          fixed inset-0 z-[100]
          flex items-end justify-center
          bg-slate-900/35
          sm:items-center sm:px-4 sm:py-4
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="
            relative flex h-[100dvh] w-full flex-col overflow-hidden
            rounded-none bg-white shadow-2xl
            sm:h-auto sm:max-h-[92vh] sm:max-w-[560px] sm:rounded-2xl
            "
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-[14px] font-semibold text-slate-900 xl:text-[15px] xl2:text-base">
                {title}
              </h2>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-auto px-4 py-3 pb-24 xl:px-5 xl:py-4">
              {children}
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 xl:px-5 xl:py-4">
              {footer ?? (
                <>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="h-9 text-[12px] xl:text-[13px]"
                  >
                    Cerrar
                  </Button>

                  <Button
                    onClick={onPrimary}
                    className="h-9 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] px-5 text-[12px] text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition-all hover:shadow-[0_10px_24px_rgba(37,99,235,0.45)] xl:text-[13px]"
>
                    {primaryLabel}
                  </Button>
                </>
              )}
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}