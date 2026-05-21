// app/components/billing/CurrentSubscriptionDebug.tsx
"use client";

import { useEffect, useState } from "react";

export default function CurrentSubscriptionDebug() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/billing/current");
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-4 text-slate-400">Cargando…</div>;
  if (error) return <div className="p-4 text-red-400">Error: {error}</div>;

  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
      <h2 className="text-lg font-semibold mb-2 text-slate-100">
        Datos de suscripción actual (debug)
      </h2>
      <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
