// app/dashboard/home/components/IntegrationsPanel.tsx
"use client";

import { CheckCircle, XCircle, Link as LinkIcon } from "lucide-react";

const integrations = [
  { name: "Google Business", active: true },
  { name: "Facebook", active: true },
  { name: "TripAdvisor", active: false },
];

export default function IntegrationsPanel() {
  return (
    <div className="rounded-xl bg-card p-6 border shadow-sm">
      <h3 className="font-bold text-lg sm:text-xl mb-4">
        Integraciones conectadas
      </h3>

      <div className="space-y-3">
        {integrations.map((i) => (
          <div key={i.name} className="flex items-center justify-between">
            <span className="text-sm sm:text-base">{i.name}</span>

            {i.active ? (
              <CheckCircle className="text-emerald-600 h-5 w-5" />
            ) : (
              <XCircle className="text-red-500 h-5 w-5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
