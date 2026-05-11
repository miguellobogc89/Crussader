// app/dashboard/mybusiness/employees/EmployeesPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

type EmployeeItem = {
  id: string;
  name: string;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
phone: string | null;
color: string | null;
invitedAt: string | null;
joinedAt: string | null;
jobTitle: string | null;
  active: boolean;
  primaryLocation: string | null;
  primaryRoleName: string | null;
  primaryRoleColor: string | null;

  locations: Array<{
    id: string;
    title: string;
    city: string | null;
    isPrimary: boolean;
  }>;

  services: Array<{
    id: string;
    name: string;
    durationMin: number | null;
    price: any;
    active: boolean;
  }>;
};

export default function EmployeesPageClient() {
  const bootstrap = useBootstrapData();

  console.log("[EMPLOYEES_PAGE_BOOTSTRAP]", {
    activeCompanyResolved: bootstrap?.activeCompanyResolved,
    activeLocationResolved: bootstrap?.activeLocationResolved,
    sessionContext: bootstrap?.sessionContext,
  });

  const [items, setItems] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadEmployees(companyId: string) {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/mybusiness/employees?companyId=${companyId}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Error cargando empleados");
      }

      setItems(data.items ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const companyId =
      bootstrap?.sessionContext?.companyId;

    if (!companyId) {
      return;
    }

    loadEmployees(companyId);
  }, [bootstrap?.sessionContext?.companyId]);

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Empleados
        </h1>

        <p className="text-sm text-slate-500">
          Configura los empleados, ubicaciones,
          roles y servicios del negocio.
        </p>
      </div>

      {loading && (
        <div className="rounded-xl border bg-white p-4 text-sm text-slate-500">
          Cargando empleados...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">
                  Empleado
                </th>

                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Ubicaciones</th>
                <th className="px-4 py-3">Servicios</th>
                <th className="px-4 py-3">Acceso plataforma</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {items.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
<div className="font-medium text-slate-900">
  {[
    employee.title,
    employee.firstName,
    employee.lastName,
  ]
    .filter(Boolean)
    .join(" ") || employee.name}
</div>



    
                      </div>
                    </div>
                  </td>

<td className="px-4 py-3 text-slate-600">
  {employee.jobTitle ?? "Sin cargo"}
</td>

<td className="px-4 py-3">
  <div
    className="h-5 w-5 rounded-full border border-slate-200"
    style={{
      backgroundColor:
        employee.color ?? "#cbd5e1",
    }}
  />
</td>

<td className="px-4 py-3 text-slate-600">
  {employee.locations.length > 0
    ? employee.locations
        .map((l) => l.title)
        .join(", ")
    : "Sin ubicación"}
</td>

<td className="px-4 py-3 text-slate-600">
  {employee.services.length > 0
    ? `${employee.services.length} servicios`
    : "Sin servicios"}
</td>

<td className="px-4 py-3">
  {employee.joinedAt ? (
    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
      Registrado
    </span>
  ) : employee.invitedAt ? (
    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
      Invitación enviada
    </span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
      Sin acceso
    </span>
  )}
</td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No hay empleados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}   