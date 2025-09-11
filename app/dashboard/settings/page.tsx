"use client";

import { Settings, MessageCircle, CreditCard, Bell, User, Beaker } from "lucide-react";
import SectionLayout, { type SectionTab } from "@/app/components/layouts/SectionLayout";

const TABS: SectionTab[] = [
  { href: "/dashboard/settings/responses", label: "Respuestas", icon: MessageCircle },
  { href: "/dashboard/settings/billing", label: "Facturación y planes", icon: CreditCard },
  { href: "/dashboard/settings/notifications", label: "Notificaciones", icon: Bell },
  { href: "/dashboard/settings/user", label: "Usuario", icon: User },
  { href: "/dashboard/settings/labs", label: "Labs", icon: Beaker, beta: true },
];

export default function SettingsPage() {
  return (
    <SectionLayout
      icon={Settings}
      title="Ajustes"
      subtitle="Configura tu dashboard y preferencias"
      tabs={TABS}
    >
      {/* Contenido inicial (puedes sustituir por TabsContent si quieres render dentro) */}
      <div className="text-sm text-muted-foreground">
        Selecciona una pestaña para configurar las distintas opciones.
      </div>
    </SectionLayout>
  );
}
