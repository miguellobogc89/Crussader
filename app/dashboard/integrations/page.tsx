"use client";
import { useEffect, useState } from "react";

interface Connection {
  id: string;
  provider: string;
  accountEmail: string | null;
  expires_at: number | null;
}

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    fetch("/api/integrations")
      .then(res => res.json())
      .then(data => {
        if (data.ok) setConnections(data.connections);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Integrations</h1>

      <table className="w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">Provider</th>
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">Expires</th>
          </tr>
        </thead>
        <tbody>
          {connections.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.provider}</td>
              <td className="p-2">{c.accountEmail ?? "—"}</td>
              <td className="p-2">
                {c.expires_at
                  ? new Date(c.expires_at * 1000).toLocaleString()
                  : "No expiry"}
              </td>
            </tr>
          ))}
          {connections.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-500">
                No integrations connected
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
