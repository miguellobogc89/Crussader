// app/components/slots/GapManagement/SlotsGapControlPanel.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, Send, Users, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { SlotItem } from "@/app/components/slots/slots.types";

type SlotsGapControlPanelProps = {
  open: boolean;
  onClose: () => void;
  slot: SlotItem | null;
};

export function SlotsGapControlPanel({
  open,
  onClose,
  slot,
}: SlotsGapControlPanelProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-[440px] flex-col overflow-hidden bg-white shadow-[0_22px_60px_rgba(37,99,235,0.16)] sm:rounded-l-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-6 pt-6 pb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Control del hueco
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Seguimiento del envío y respuestas
                </p>
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted active:scale-95"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-auto px-6 py-5">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Resumen
                </p>

                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{slot?.time || "Sin hora"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Estado: {slot?.status || "Sin estado"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/60 bg-white p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Send className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Enviados
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-foreground">0</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-white p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Leídos
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-foreground">0</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-white p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Interés
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-foreground">0</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-white">
                <div className="border-b border-border/50 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    Clientes impactados
                  </p>
                </div>

                <div className="px-4 py-8 text-sm text-muted-foreground">
                  Aquí irá la lista de clientes enviados para este hueco.
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 px-6 py-5">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-12 w-full rounded-xl"
              >
                Cerrar
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}