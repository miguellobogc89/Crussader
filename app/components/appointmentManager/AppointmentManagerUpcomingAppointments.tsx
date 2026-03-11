// app/components/appointmentManager/AppointmentManagerUpcomingAppointments.tsx
"use client";

import { useEffect, useState } from "react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

type AppointmentRowData = {
  id: string;
  locationId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
};

type AppointmentsResponse = {
  ok: boolean;
  appointments?: AppointmentRowData[];
  error?: string;
};

export default function AppointmentManagerUpcomingAppointments() {
  const bootstrapData = useBootstrapData();
  const companyId = bootstrapData?.activeCompanyResolved?.id ?? "";

  const [appointments, setAppointments] = useState<AppointmentRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    async function loadAppointments() {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/appointments?companyId=${encodeURIComponent(companyId)}`,
          { cache: "no-store" }
        );

        const data: AppointmentsResponse = await res.json();

        if (!res.ok || !data.ok) {
          setError(data.error || "error_loading_appointments");
          setAppointments([]);
          return;
        }

        const sorted = [...(data.appointments || [])].sort((a, b) => {
          return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
        });

        setAppointments(sorted.slice(0, 8));
      } catch (err) {
        console.error("[appointments]", err);
        setError("error_loading_appointments");
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, [companyId]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h3 className="text-lg font-semibold text-slate-900">
          Próximas citas
        </h3>
        <p className="text-sm text-slate-500">
          Hoy y próximas horas
        </p>
      </div>

      <table className="min-w-full text-left">
        <thead>
          <tr className="border-b border-slate-200 text-sm text-slate-500">
            <th className="px-6 py-4">Cliente</th>
            <th className="px-6 py-4">Teléfono</th>
            <th className="px-6 py-4">Fecha / Hora</th>
            <th className="px-6 py-4">Estado</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-sm text-slate-500">
                Cargando citas...
              </td>
            </tr>
          )}

          {!loading && error && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-sm text-rose-600">
                Error cargando citas
              </td>
            </tr>
          )}

          {!loading && !error && appointments.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-sm text-slate-500">
                No hay citas próximas
              </td>
            </tr>
          )}

          {!loading &&
            !error &&
            appointments.map((a) => (
              <Row
                key={a.id}
                client={a.customerName || "Sin nombre"}
                phone={a.customerPhone || "—"}
                time={formatDate(a.startAt)}
                status={formatStatus(a.status)}
                statusClass={statusClass(a.status)}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  client,
  phone,
  time,
  status,
  statusClass,
}: {
  client: string;
  phone: string;
  time: string;
  status: string;
  statusClass: string;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-6 py-4 font-medium text-slate-900">{client}</td>
      <td className="px-6 py-4 text-slate-600">{phone}</td>
      <td className="px-6 py-4 text-slate-600">{time}</td>
      <td className="px-6 py-4">
        <span className={statusClass}>{status}</span>
      </td>
    </tr>
  );
}

function formatDate(value: string) {
  const d = new Date(value);

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatStatus(status: string) {
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Completada";
  return "Pendiente";
}

function statusClass(status: string) {
  if (status === "CONFIRMED") {
    return "rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700";
  }

  if (status === "CANCELLED") {
    return "rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700";
  }

  if (status === "COMPLETED") {
    return "rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700";
  }

  return "rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700";
}