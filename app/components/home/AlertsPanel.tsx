// app/dashboard/home/components/AlertsPanel.tsx
"use client";

import { AlertTriangle } from "lucide-react";

export default function AlertsPanel({ unread = 0 }) {
  if (!unread) return null;

  return (
    <div className="
      rounded-xl border border-red-300/40 bg-red-50
      p-4 shadow-sm flex items-center gap-4
    ">
      <AlertTriangle className="h-6 w-6 text-red-600" />

      <div>
        <p className="font-semibold text-red-700 text-base sm:text-lg">
          Tienes {unread} reseñas sin responder.
        </p>
        <p className="text-sm text-red-600/80">
          Responde cuanto antes para mantener tu reputación en equilibrio.
        </p>
      </div>
    </div>
  );
}
