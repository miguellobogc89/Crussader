// app/api/billing/plans/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const plans = [
    {
      name: "Starter",
      price: "39",
      period: "mes",
      description: "Perfecto para comenzar",
      locations: 1,
      users: 1,
      trial: "7 días gratis",
      extras: { location: "29 €/mes", user: "3,99 €/mes" },
      cta: "Probar gratis 7 días",
      popular: false,
      variant: "outline",
    },
    {
      name: "Growth",
      price: "79",
      period: "mes",
      description: "Ideal para empresas en crecimiento",
      locations: 3,
      users: 5,
      badge: "Más popular",
      cta: "Empezar ahora",
      popular: true,
      variant: "default",
    },
    {
      name: "Business",
      price: "149",
      period: "mes",
      description: "Máximo rendimiento y soporte",
      locations: 6,
      users: 15,
      highlight: "Soporte prioritario y onboarding guiado",
      cta: "Contactar con ventas",
      popular: false,
      variant: "outline",
    },
  ];

  return NextResponse.json({ ok: true, plans });
}
