// app/dashboard/home/components/FreeTrialPanel.tsx
"use client";

export default function FreeTrialPanel() {
  return (
    <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-accent/10 p-6 shadow-sm">
      <h3 className="font-bold text-lg sm:text-xl">Free Trial activo</h3>

      <p className="text-sm sm:text-base text-muted-foreground mt-2">
        Estás usando la versión gratuita de Crussader sin límites de usuarios ni ubicaciones.
      </p>
    </div>
  );
}
