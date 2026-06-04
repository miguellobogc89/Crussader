// app/components/mybusiness/home/MyBusinessHero.tsx

"use client";

import { Building2, MapPin } from "lucide-react";

type MyBusinessHeroProps = {
  companyName: string;
  locationName: string;
};

export default function MyBusinessHero({
  companyName,
  locationName,
}: MyBusinessHeroProps) {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Building2 className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {locationName}
              </h2>

              <div className="mt-1 flex items-center gap-2 text-sm text-blue-50">
                <MapPin className="h-4 w-4" />
                <span>{companyName}</span>
              </div>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-6 text-blue-50">
            Esta es la foto principal de tu negocio: equipo, servicios,
            calendario y recuperación de huecos en un único lugar.
          </p>
        </div>

        <button className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
          Completar negocio
        </button>
      </div>
    </section>
  );
}