// app/dashboard/mybusiness/employees/EmployeesPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import MyBusinessWorkspace, {
  type EmployeeItem,
} from "@/app/components/mybusiness/core/MyBusinessWorkspace";


function MyBusinessWorkspaceSkeleton() {
  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_380px] gap-4">
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex gap-2">
            <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className="h-9 w-36 animate-pulse rounded-xl bg-slate-200" />
        </div>

        <div className="space-y-0">
          <div className="grid grid-cols-6 gap-4 border-b bg-slate-50 px-4 py-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-3 animate-pulse rounded bg-slate-200"
              />
            ))}
          </div>

          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-6 gap-4 border-b border-slate-100 px-4 py-4"
            >
              {Array.from({ length: 6 }).map((__, cellIndex) => (
                <div
                  key={cellIndex}
                  className="h-4 animate-pulse rounded bg-slate-100"
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col overflow-hidden border-l border-slate-200 bg-white">
        <div className="flex h-[58px] shrink-0 flex-col justify-center border-b border-slate-200 px-4">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="space-y-4 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index}>
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default function EmployeesPageClient() {
  const bootstrap = useBootstrapData();

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
    const companyId = bootstrap?.sessionContext?.companyId;

    if (!companyId) {
      return;
    }

    loadEmployees(companyId);
  }, [bootstrap?.sessionContext?.companyId]);

return (
  <div className="flex h-full min-h-0 w-full items-center justify-center p-4 md:p-5 xl:p-6">
    <div className="h-full min-h-0 w-full max-w-[1680px]">
      {loading && <MyBusinessWorkspaceSkeleton />}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && <MyBusinessWorkspace employees={items} />}
    </div>
  </div>
);
}