// app/components/crussader/UX/RevenueRecoveryToast.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { PartyPopper, X } from "lucide-react";

type RecoveryToastArgs = {
  customerName: string;
  timeLabel: string;
  serviceName?: string | null;
  durationMs?: number;
};

type ToastState = RecoveryToastArgs & {
  id: number;
};

type ContextValue = {
  showRecoveryToast: (args: RecoveryToastArgs) => void;
};

const RecoveryToastContext = createContext<ContextValue | undefined>(undefined);

export function RevenueRecoveryToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [visible, setVisible] = useState(false);

  const showRecoveryToast = useCallback((args: RecoveryToastArgs) => {
    const durationMs = args.durationMs ?? 7000;

    setToast({
      ...args,
      durationMs,
      id: Date.now(),
    });

    requestAnimationFrame(() => {
      setVisible(true);
    });

    if (durationMs > 0) {
      window.setTimeout(() => {
        setVisible(false);
      }, durationMs);
    }
  }, []);

  useEffect(() => {
    if (!visible && toast) {
      const timeout = window.setTimeout(() => {
        setToast(null);
      }, 260);

      return () => {
        window.clearTimeout(timeout);
      };
    }
  }, [visible, toast]);

  function handleClose() {
    setVisible(false);
  }

  return (
    <RecoveryToastContext.Provider value={{ showRecoveryToast }}>
      {children}

      {toast ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[1000] flex justify-end sm:right-5 sm:top-5 xl:right-6 xl:top-6">
          <div
            className={[
              "pointer-events-auto w-[calc(100vw-2rem)] max-w-[380px] rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-[0_22px_60px_rgba(16,185,129,0.22)]",
              "transition-all duration-300 ease-out",
              visible
                ? "translate-x-0 opacity-100"
                : "translate-x-[120%] opacity-0",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
                <PartyPopper className="h-5 w-5 text-emerald-600" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  ¡Hueco recuperado!
                </p>

                <p className="mt-0.5 text-sm text-slate-700">
                  {toast.customerName} ha reservado el hueco de las{" "}
                  <span className="font-semibold">{toast.timeLabel}</span>
                  {toast.serviceName ? ` para ${toast.serviceName}` : ""}.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </RecoveryToastContext.Provider>
  );
}

export function useRecoveryToast() {
  const context = useContext(RecoveryToastContext);

  if (!context) {
    throw new Error(
      "useRecoveryToast must be used within RevenueRecoveryToastProvider",
    );
  }

  return context;
}