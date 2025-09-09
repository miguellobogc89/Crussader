// app/dashboard/profile/page.tsx
"use client";

import { useBootstrapData, useBootstrapStatus } from "@/app/providers/bootstrap-store";

export default function ProfilePage() {
  const data = useBootstrapData();
  const status = useBootstrapStatus();

  if (status !== "ready" || !data) {
    return <div className="p-6 text-sm text-neutral-500">Cargando…</div>;
  }

  const user = data.user;
  const company = data.activeCompany;
  const locations = data.locations;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Usuario</h2>
        <div className="text-sm text-neutral-700">
          <div><b>Nombre:</b> {user.name ?? "—"}</div>
          <div><b>Email:</b> {user.email}</div>
          <div><b>Rol:</b> {user.role}</div>
          <div><b>Zona horaria:</b> {user.timezone ?? "—"}</div>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Empresa activa</h2>
        {company ? (
          <div className="text-sm text-neutral-700">
            <div><b>Nombre:</b> {company.name}</div>
            <div><b>Plan:</b> {company.plan ?? "free"}</div>
            <div><b>Web:</b> {company.website ?? "—"}</div>
            <div><b>Ubicaciones:</b> {locations.length}</div>
          </div>
        ) : (
          <div className="text-sm text-neutral-500">Sin empresa seleccionada.</div>
        )}
      </section>
    </div>
  );
}
