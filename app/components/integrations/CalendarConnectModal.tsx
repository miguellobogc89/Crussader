"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Calendar, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;

  companyId?: string;
  returnTo?: string;

  loading?: boolean;
};

export function CalendarConnectModal({
  open,
  onClose,
  companyId,
  returnTo,
  loading = false,
}: Props) {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isBusy = loading || submitting;

const handleConfirm = () => {
  setError(null);
  const trimmed = email.trim();

  if (!trimmed || !trimmed.includes("@")) {
    setError("Introduce un correo válido para asociar la integración de Calendar.");
    return;
  }

  setSubmitting(true);

  try {
    const params = new URLSearchParams();
    params.set("email", trimmed);
    if (companyId) params.set("companyId", companyId);
    if (returnTo) params.set("returnTo", returnTo);

    window.location.href = `/api/integrations/google/calendar/connect?${params.toString()}`;
  } catch (e) {
    console.error(e);
    setError("No se ha podido iniciar la conexión. Revisa la configuración.");
    setSubmitting(false);
  }
};


  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100/80 overflow-hidden">
              {/* Header */}
              <div className="relative px-5 pt-4 pb-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-900" />
                      Conectar Google Calendar
                    </h2>
                    <p className="text-xs text-slate-600 max-w-xl">
                      Indica el correo con el que gestionas tu agenda. Usaremos este
                      acceso básico para crear tu{" "}
                      <span className="font-semibold">“Crussader calendar”</span> y
                      vincular tus reservas sin pedir permisos innecesarios.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full"
                    onClick={onClose}
                    disabled={isBusy}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {companyId && (
                  <div className="mt-2 text-[9px] text-slate-500">
                    Empresa activa: <span className="font-medium">{companyId}</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-800">
                    Correo de Google Calendar
                  </label>
                  <Input
                    type="email"
                    placeholder="tucorreo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isBusy}
                    className="h-9 text-xs"
                  />
                  <p className="text-[9px] text-slate-500">
                    Debe ser el correo con el que tienes acceso al calendario donde se
                    gestionan tus citas.
                  </p>
                </div>

                {error && (
                  <div
                    className={cn(
                      "text-[10px] rounded-md px-3 py-1.5 border",
                      "bg-red-50 border-red-100 text-red-700",
                    )}
                  >
                    {error}
                  </div>
                )}

                {isBusy && !error && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-600 rounded-md bg-slate-50 px-3 py-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Preparando la redirección segura con Google…
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pb-4 pt-2 flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60">
                <div className="text-[9px] text-slate-500">
                  Podrás revisar o revocar este acceso desde tu cuenta de Google cuando
                  quieras.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={onClose}
                    disabled={isBusy}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 px-4 text-xs"
                    onClick={handleConfirm}
                    disabled={isBusy}
                  >
                    Conectar con Google
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
