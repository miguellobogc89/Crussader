"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Star, Store, Users, Building2 } from "lucide-react";

export function CompanyInfoCard({
  name,
  email,
  phone,
  address,
  employeesText,
  totalUsers,
  totalEstablishments,
  averageRating,
  totalReviews
}: {
  name: string;
  email: string;
  phone: string;
  address: string;
  employeesText: string;
  totalUsers: number;
  totalEstablishments: number;
  averageRating: string;
  totalReviews: string;
}) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-sky-50 border border-slate-100 shadow-card">

      {/* --- FONDO DECORATIVO RESTAURADO --- */}
      <Building2
        className="
          pointer-events-none absolute
          -right-6 -bottom-6
          h-24 w-24
          text-blue-400/20
        "
      />

      {/* --- HEADER: Nombre + Rating a la derecha --- */}
<CardHeader className="pb-3">
  <div className="flex items-center justify-between gap-3">

    {/* Icono + nombre (lado izquierdo) */}
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div
        className="
          relative
          h-10 w-10
          sm:h-11 sm:w-11
          lg:h-12 lg:w-12
          rounded-xl overflow-hidden bg-slate-100
          flex-shrink-0
        "
      >
        <Image
          src="/icon/company.png"
          alt="Empresa"
          fill
          className="object-contain p-1.5 sm:p-2"
          sizes="48px"
        />
      </div>

      <span
        className="
          font-semibold
          text-base sm:text-lg lg:text-xl
          text-slate-900
          truncate
        "
      >
        {name}
      </span>
    </div>

    {/* Rating (lado derecho, tamaño compacto) */}
    <div className="flex items-center gap-1 flex-shrink-0 text-sm sm:text-base">
      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
      <span className="font-semibold text-slate-900">
        {averageRating}
      </span>
      <span className="text-xs text-slate-400 sm:text-[11px]">
        ({totalReviews})
      </span>
    </div>
  </div>
</CardHeader>


      {/* --- BODY: Chips --- */}
      <CardContent className="space-y-3 pt-0">

        {/* Chips de Establecimientos + Usuarios */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Chip Establecimientos (malva) */}
          <div
            className="
              inline-flex items-center gap-1.5
              px-3 py-1.5 rounded-full
              bg-purple-100 text-purple-800 
              border border-purple-200
              text-sm font-semibold
            "
          >
            <Store className="h-4 w-4 text-purple-700" />
            <span>{totalEstablishments}</span>
            <span className="font-normal">
              {totalEstablishments === 1
                ? "establecimiento"
                : "establecimientos"}
            </span>
          </div>

          {/* Chip Usuarios (salmón) */}
          <div
            className="
              inline-flex items-center gap-1.5
              px-3 py-1.5 rounded-full
              bg-rose-100 text-rose-800 
              border border-rose-200
              text-sm font-semibold
            "
          >
            <Users className="h-4 w-4 text-rose-700" />
            <span>{totalUsers}</span>
            <span className="font-normal">
              {totalUsers === 1 ? "usuario" : "usuarios"}
            </span>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
