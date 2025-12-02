// app/dashboard/home/components/ReputationStatsPanel.tsx
"use client";

import { Star, MessageSquare, Clock } from "lucide-react";

const items = [
  {
    label: "Rating promedio",
    value: "4.7",
    icon: Star,
    color: "text-yellow-500",
  },
  {
    label: "Nuevas reseñas",
    value: "23",
    icon: MessageSquare,
    color: "text-blue-500",
  },
  {
    label: "Tiempo respuesta",
    value: "2.3h",
    icon: Clock,
    color: "text-purple-500",
  },
];

export default function ReputationStatsPanel() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <Icon className={`${item.color} h-6 w-6`} />
              <span className="text-sm sm:text-base text-muted-foreground">
                {item.label}
              </span>
            </div>

            <p className="mt-2 font-bold text-xl sm:text-2xl lg:text-3xl">
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
