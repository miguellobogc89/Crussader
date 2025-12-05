"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

type ToastState = {
  id: number;
  message: string;
  title?: string;
  variant: ToastVariant;
};

type ShowToastArgs = {
  message: string;
  title?: string;
  variant?: ToastVariant;
  durationMs?: number; // 0 = no auto-close
};

type ToastContextValue = {
  showToast: (args: ShowToastArgs) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback(
    ({
      message,
      title,
      variant = "info",
      durationMs = 4000,
    }: ShowToastArgs) => {
      const id = Date.now();
      setToast({ id, message, title, variant });

      // activamos animación de entrada
      requestAnimationFrame(() => setVisible(true));

      if (durationMs > 0) {
        window.setTimeout(() => {
          setVisible(false);
        }, durationMs);
      }
    },
    [],
  );

  const handleClose = () => {
    setVisible(false);
  };

  // cuando visible pasa a false, quitamos el toast tras la animación
  useEffect(() => {
    if (!visible && toast) {
      const t = window.setTimeout(() => {
        setToast(null);
      }, 220); // debe cuadrar con duration-200
      return () => window.clearTimeout(t);
    }
  }, [visible, toast]);

  const iconFor = (variant: ToastVariant) => {
    if (variant === "success") {
      return (
        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
      );
    }
    if (variant === "error") {
      return (
        <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0" />
      );
    }
    return <Info className="h-5 w-5 text-sky-500 flex-shrink-0" />;
  };

  const borderClass =
    toast?.variant === "success"
      ? "border-emerald-400"
      : toast?.variant === "error"
      ? "border-rose-400"
      : "border-sky-300";

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center">
          <div
            className={[
              "pointer-events-auto w-[90%] max-w-md rounded-2xl border bg-white text-slate-900 shadow-xl",
              "px-4 py-3 sm:px-5 sm:py-4",
              "transition-transform transition-opacity duration-200 ease-out",
              visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              borderClass,
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{iconFor(toast.variant)}</div>

              <div className="flex-1 text-center sm:text-left">
                {toast.title && (
                  <div className="text-sm font-semibold mb-0.5">
                    {toast.title}
                  </div>
                )}
                <div className="text-xs sm:text-sm text-slate-800">
                  {toast.message}
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="ml-2 mt-0.5 rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
