// app/components/crussader/StandardModal.tsx
"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";

type Props = {
  open: boolean;
  title: string;
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">
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

            <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
              {children}
            </div>

            <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
              {footer ?? (
                <>
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>

                  <Button
                    onClick={onPrimary}
                    className="rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] px-5 text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition-all hover:shadow-[0_10px_24px_rgba(37,99,235,0.45)]"
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