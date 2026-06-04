// app/components/mybusiness/home/MyBusinessHomeMockup.tsx
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import MyBusinessHero from "./MyBusinessHero";


type MyBusinessHomeMockupProps = {
  companyName: string;
  locationName: string;
};

export default function MyBusinessHomeMockup({
  companyName,
  locationName,
}: MyBusinessHomeMockupProps) {
  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_360px] gap-4">
      <section className="min-h-0 overflow-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
<MyBusinessHero
  companyName={companyName}
  locationName={locationName}
/>

        <div className="mt-5 grid grid-cols-4 gap-3">
          {[
            { icon: Users, title: "Equipo", value: "4 empleados" },
            { icon: BriefcaseBusiness, title: "Servicios", value: "12 activos" },
            { icon: CalendarDays, title: "Calendario", value: "Conectado" },
            { icon: MessageCircle, title: "WhatsApp", value: "Listo para usar" },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <item.icon className="h-5 w-5 text-blue-600" />
              <p className="mt-3 text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-950">Tu equipo</h3>
              <p className="text-sm text-slate-500">
                Los profesionales que atenderán las citas.
              </p>
            </div>
            <button className="text-sm font-semibold text-blue-600">
              Gestionar empleados
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["Laura Martín", "Fisioterapeuta", "LM"],
              ["Carlos Pereira", "Podólogo", "CP"],
              ["Ana Ruiz", "Nutricionista", "AR"],
            ].map(([name, role, initials]) => (
              <div key={name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold">
                    Calendario
                  </button>
                  <button className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold">
                    Huecos
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-bold text-slate-950">
            Qué quieres hacer hoy
          </h3>

          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              ["Gestionar agenda", CalendarDays],
              ["Recuperar huecos", Clock3],
              ["Hablar con pacientes", MessageCircle],
            ].map(([title, Icon]) => {
              const IconComponent = Icon as typeof CalendarDays;

              return (
                <button
                  key={title as string}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <span className="flex items-center gap-3 text-sm font-bold text-slate-900">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                    {title as string}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="min-h-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-950">
          Servicios de ejemplo
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Una muestra sencilla de cómo se verá tu catálogo.
        </p>

        <div className="mt-4 space-y-3">
          {[
            ["Fisioterapia", "45 min", "40 €"],
            ["Osteopatía", "60 min", "55 €"],
            ["Masaje deportivo", "30 min", "35 €"],
            ["Nutrición", "50 min", "50 €"],
          ].map(([name, duration, price]) => (
            <div key={name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-950">{name}</p>
                <p className="text-sm font-bold text-blue-600">{price}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">{duration}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}