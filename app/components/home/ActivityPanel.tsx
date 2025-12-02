// app/dashboard/home/components/ActivityPanel.tsx
"use client";

import { Sparkles } from "lucide-react";

const activity = [
  "3 reseñas nuevas sincronizadas.",
  "1 respuesta automática enviada.",
  "Integración Google verificada hace 2h.",
];

export default function ActivityPanel() {
  return (
    <div className="rounded-xl bg-card p-6 border shadow-sm">
      <h3 className="font-bold text-lg sm:text-xl mb-4">Actividad reciente</h3>

      <ul className="space-y-3">
        {activity.map((item, idx) => (
          <li key={idx} className="flex gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm sm:text-base text-muted-foreground">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
