// app/components/appointmentManager/AppointmentManagerKpiCards.tsx

import { CalendarDays, Clock3, Star, XCircle } from "lucide-react";

export default function AppointmentManagerKpiCards() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

      <KpiCard
        title="Citas hoy"
        value="12"
        subtitle="Actividad prevista"
        icon={<CalendarDays className="h-5 w-5" />}
      />

      <KpiCard
        title="Pendientes de confirmar"
        value="4"
        subtitle="Esperando respuesta"
        icon={<Clock3 className="h-5 w-5" />}
      />

      <KpiCard
        title="Cancelaciones hoy"
        value="1"
        subtitle="Detectadas por WhatsApp"
        icon={<XCircle className="h-5 w-5" />}
      />

      <KpiCard
        title="Nuevas reseñas"
        value="6"
        subtitle="Últimas 24h"
        icon={<Star className="h-5 w-5" />}
      />

    </section>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-2 text-slate-600">
          {icon}
        </div>

      </div>

      <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}