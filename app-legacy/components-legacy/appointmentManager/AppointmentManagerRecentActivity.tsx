// app/components/appointmentManager/AppointmentManagerRecentActivity.tsx
"use client";

import { useEffect, useState } from "react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import {
  CalendarPlus2,
  CheckCircle2,
  MessageSquareText,
  Star,
  XCircle,
} from "lucide-react";

type ActivityItemType =
  | "appointment_created"
  | "appointment_cancelled"
  | "appointment_completed"
  | "whatsapp_sent"
  | "review_received"
  | "review_replied";

type ActivityItem = {
  id: string;
  type: ActivityItemType;
  title: string;
  description: string;
  createdAt: string;
};

type ActivityResponse = {
  ok: boolean;
  activity?: ActivityItem[];
  error?: string;
};

export default function AppointmentManagerRecentActivity() {
  const bootstrapData = useBootstrapData();
  const companyId = bootstrapData?.activeCompanyResolved?.id ?? "";

  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setItems([]);
      return;
    }

    let cancelled = false;

    async function loadActivity() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/appointments/activity?companyId=${encodeURIComponent(companyId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: ActivityResponse = await res.json();

        if (!res.ok || !data.ok) {
          if (!cancelled) {
            setError(data.error || "error_loading_activity");
            setItems([]);
          }
          return;
        }

        if (!cancelled) {
          setItems(data.activity || []);
        }
      } catch (err) {
        console.error("[AppointmentManagerRecentActivity]", err);

        if (!cancelled) {
          setError("error_loading_activity");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadActivity();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h3 className="text-lg font-semibold text-slate-900">
          Actividad reciente
        </h3>
        <p className="text-sm text-slate-500">Últimos eventos del negocio</p>
      </div>

      <div className="h-[540px] overflow-y-auto px-6 py-5">
        {loading && (
          <div className="py-8 text-sm text-slate-500">Cargando actividad...</div>
        )}

        {!loading && error && (
          <div className="py-8 text-sm text-rose-600">
            No se pudo cargar la actividad.
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="py-8 text-sm text-slate-500">
            No hay actividad reciente.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-0">
            {items.map((item, index) => (
              <ActivityRow
                key={item.id}
                item={item}
                isLast={index === items.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityRow({
  item,
  isLast,
}: {
  item: ActivityItem;
  isLast: boolean;
}) {
  const iconWrapClass = getIconWrapClass(item.type);
  const connectorClass = getConnectorClass(isLast);

  return (
    <div className="grid grid-cols-[48px_1fr] gap-4 pb-6 last:pb-0">
      <div className="flex flex-col items-center">
        <div
          className={[
            "flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-inset",
            iconWrapClass,
          ].join(" ")}
        >
          {getActivityIcon(item.type)}
        </div>

        <div className={connectorClass} />
      </div>

      <div className="pt-1">
        <p className="text-[15px] font-semibold leading-5 text-slate-900">
          {item.title}
        </p>
        <p className="mt-1 text-sm leading-5 text-slate-500">
          {item.description}
        </p>
        <p className="mt-2 text-xs font-medium text-slate-400">
          {formatRelativeTime(item.createdAt)}
        </p>
      </div>
    </div>
  );
}

function getActivityIcon(type: ActivityItemType) {
  if (type === "appointment_created") {
    return <CalendarPlus2 className="h-4 w-4" />;
  }

  if (type === "appointment_cancelled") {
    return <XCircle className="h-4 w-4" />;
  }

  if (type === "appointment_completed") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (type === "whatsapp_sent") {
    return <MessageSquareText className="h-4 w-4" />;
  }

  if (type === "review_received") {
    return <Star className="h-4 w-4" />;
  }

  return <MessageSquareText className="h-4 w-4" />;
}

function getIconWrapClass(type: ActivityItemType) {
  if (type === "appointment_created") {
    return "bg-violet-50 text-violet-600 ring-violet-200";
  }

  if (type === "appointment_cancelled") {
    return "bg-rose-50 text-rose-600 ring-rose-200";
  }

  if (type === "appointment_completed") {
    return "bg-emerald-50 text-emerald-600 ring-emerald-200";
  }

  if (type === "whatsapp_sent") {
    return "bg-sky-50 text-sky-600 ring-sky-200";
  }

  if (type === "review_received") {
    return "bg-amber-50 text-amber-600 ring-amber-200";
  }

  return "bg-slate-50 text-slate-600 ring-slate-200";
}

function getConnectorClass(isLast: boolean) {
  if (isLast) {
    return "mt-2 h-0 w-px bg-transparent";
  }

  return "mt-2 h-10 w-px bg-slate-200";
}

function formatRelativeTime(value: string) {
  const now = Date.now();
  const date = new Date(value).getTime();
  const diffMs = now - date;

  if (Number.isNaN(date)) {
    return "Fecha no disponible";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "Hace un momento";
  }

  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `Hace ${minutes} min`;
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);

    if (hours === 1) {
      return "Hace 1 h";
    }

    return `Hace ${hours} h`;
  }

  const days = Math.floor(diffMs / day);

  if (days === 1) {
    return "Hace 1 día";
  }

  return `Hace ${days} días`;
}