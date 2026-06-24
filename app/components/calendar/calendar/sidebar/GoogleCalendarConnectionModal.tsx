// app/components/calendar/calendar/sidebar/GoogleCalendarConnectionModal.tsx
"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Loader2, LogOut } from "lucide-react";

import StandardModal from "@/app/components/crussader/StandardModal";

type GoogleStatus = {
  connected: boolean;
  accountEmail: string | null;
};

type Props = {
  open: boolean;
  companyId: string | null;
  locationId: string | null;
  onClose: () => void;
};

export default function GoogleCalendarConnectionModal({
  open,
  onClose,
}: Props) {
  const [status, setStatus] = useState<GoogleStatus>({
    connected: false,
    accountEmail: null,
  });

  const [loading, setLoading] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    void fetchGoogleStatus();
  }, [open]);

  async function fetchGoogleStatus() {
    try {
      setLoading(true);

      const res = await fetch("/api/integrations/google/calendar/status");
      const data = await res.json();

      setStatus({
        connected: Boolean(data.connected),
        accountEmail: data.connection?.accountEmail || null,
      });
    } catch (error) {
      console.error("[GoogleCalendarModal] fetch status error:", error);

      setStatus({
        connected: false,
        accountEmail: null,
      });
    } finally {
      setLoading(false);
    }
  }

  async function disconnectGoogle() {
    try {
      setDisconnectingGoogle(true);

      const res = await fetch("/api/integrations/google/calendar/disconnect", {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.ok) {
        setStatus({
          connected: false,
          accountEmail: null,
        });

        onClose();
      }
    } catch (error) {
      console.error("[GoogleCalendarModal] disconnect google error:", error);
    } finally {
      setDisconnectingGoogle(false);
    }
  }

  return (
    <StandardModal
      open={open}
      title="Google Calendar"
      contentClassName="sm:max-w-[440px]"
      hideFooter
      onClose={onClose}
    >
      <div className="space-y-5 px-1 py-1">
        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 xl:p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 xl:h-11 xl:w-11">
            <CalendarDays size={22} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-950 xl:text-base">
              Cuenta de Google Calendar
            </h3>

            {loading ? (
              <p className="mt-1 flex items-center gap-2 text-xs text-slate-500 xl:text-sm">
                <Loader2 size={14} className="animate-spin" />
                Comprobando conexión...
              </p>
            ) : (
              <p className="mt-1 truncate text-xs text-slate-500 xl:text-sm">
                {status.connected
                  ? status.accountEmail || "Cuenta conectada"
                  : "No hay ninguna cuenta conectada"}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={disconnectGoogle}
            disabled={!status.connected || loading || disconnectingGoogle}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {disconnectingGoogle ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}

            Desconectar
          </button>
        </div>
      </div>
    </StandardModal>
  );
}