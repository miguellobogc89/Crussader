// app/components/slots/configuration/ConfigurationCalendarModal.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";

type ConfigurationCalendarModalProps = {
  open: boolean;
  onClose: () => void;
};

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

const MOCK_DAYS = [
  { day: 1, active: false },
  { day: 2, active: false },
  { day: 3, active: true },
  { day: 4, active: false },
  { day: 5, active: true },
  { day: 6, active: false },
  { day: 7, active: false },
  { day: 8, active: false },
  { day: 9, active: true },
  { day: 10, active: false },
  { day: 11, active: false },
  { day: 12, active: true },
  { day: 13, active: false },
  { day: 14, active: false },
  { day: 15, active: false },
  { day: 16, active: true },
  { day: 17, active: false },
  { day: 18, active: false },
  { day: 19, active: true },
  { day: 20, active: false },
  { day: 21, active: false },
  { day: 22, active: false },
  { day: 23, active: true },
  { day: 24, active: false },
  { day: 25, active: false },
  { day: 26, active: true },
  { day: 27, active: false },
  { day: 28, active: false },
  { day: 29, active: false },
  { day: 30, active: true },
];

export function ConfigurationCalendarModal({
  open,
  onClose,
}: ConfigurationCalendarModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[6px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-violet-50 via-sky-50 to-emerald-50" />

            <div className="relative border-b border-slate-100 px-6 pb-5 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <CalendarDays className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      Configuración visual
                    </div>

                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                      Calendario de slots
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Vista previa elegante del calendario para gestionar huecos,
                      disponibilidad y contexto operativo.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Mes actual
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      Marzo 2026
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-2">
                  {DAYS.map((label) => (
                    <div
                      key={label}
                      className="flex h-10 items-center justify-center text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                      {label}
                    </div>
                  ))}

                  {MOCK_DAYS.map((item) => (
                    <button
                      key={item.day}
                      type="button"
                      className={[
                        "relative flex aspect-square items-start justify-end rounded-2xl border p-3 text-sm font-medium transition",
                        item.active
                          ? "border-violet-200 bg-violet-50 text-violet-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span>{item.day}</span>

                      {item.active ? (
                        <span className="absolute bottom-3 left-3 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          slots
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Resumen
                  </p>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                      <p className="text-xs text-slate-500">
                        Días con huecos activos
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                        8
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        <p className="text-xs">Tiempo medio de respuesta</p>
                      </div>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                        12 min
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Qué irá aquí
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Este modal puede terminar mostrando el calendario real, filtros
                    por empleado, servicios del slot y acciones rápidas de envío.
                  </p>

                  <div className="mt-5 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="h-10 rounded-xl border-slate-200"
                    >
                      Cerrar
                    </Button>

                    <Button
                      type="button"
                      className="h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Abrir calendario
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}