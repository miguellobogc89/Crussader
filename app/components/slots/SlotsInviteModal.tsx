// app/components/slots/SlotsInviteModal.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import StandardCard from "@/app/components/crussader/UX/standardCard";

type SlotsInviteModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SlotsInviteModal({
  open,
  onClose,
}: SlotsInviteModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <StandardCard
            className="w-full max-w-md"
            contentClassName=""
            >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary-muted flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground tracking-tight">
                    Invitar a clientes
                  </h2>
                </div>

                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Envía esta plantilla a tus clientes para que se suscriban a las alertas de huecos disponibles.
                </p>

                <div className="bg-[#e8f5e1] rounded-2xl p-5 space-y-3">
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    ¡Hola! 👋 ¿Quieres que te avisemos cuando se libere un hueco disponible en nuestra clínica?
                  </p>

                  <div className="flex flex-col gap-2">
                    <button className="w-full py-2.5 bg-surface/80 rounded-xl text-sm font-medium text-primary border border-primary/20 hover:bg-surface transition-colors">
                      ✅ Sí, quiero recibir avisos
                    </button>
                    <button className="w-full py-2.5 bg-surface/80 rounded-xl text-sm font-medium text-muted-foreground border border-border/50 hover:bg-surface transition-colors">
                      No, gracias
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground text-right tabular-nums">
                    14:32 ✓✓
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium shadow-primary-glow transition-all duration-150">
                  Enviar plantilla
                </Button>
              </div>
            </div>
            </StandardCard>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}