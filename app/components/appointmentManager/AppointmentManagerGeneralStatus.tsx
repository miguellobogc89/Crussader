// app/components/appointmentManager/AppointmentManagerGeneralStatus.tsx

import { ShieldCheck } from "lucide-react";

export default function AppointmentManagerGeneralStatus() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-medium text-slate-500">
              Estado del sistema
            </p>
          </div>

          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Automatizaciones funcionando correctamente
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">

          <StatusBox title="Citas hoy" value="12" />
          <StatusBox title="Pendientes" value="4" />
          <StatusBox title="Recordatorios" value="8" />
          <StatusBox title="Cancelaciones" value="1" />
          <StatusBox title="Reseñas solicitadas" value="18" />
          <StatusBox title="Reseñas recibidas" value="6" />

        </div>
      </div>
    </section>
  );
}

function StatusBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}