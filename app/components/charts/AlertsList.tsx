"use client";

export type AlertItem = {
  severity: "critical" | "warning" | "info";
  title: string;        // ej: "Crítico"
  message: string;      // ej: "3 reseñas 1⭐ sin responder"
};

export type AlertsListProps = {
  items: AlertItem[];
};

function dotClass(severity: AlertItem["severity"]) {
  if (severity === "critical") return "bg-destructive";
  if (severity === "warning") return "bg-warning";
  return "bg-secondary";
}

export function AlertsList({ items }: AlertsListProps) {
  return (
    <div className="space-y-3">
      {items.map((a, i) => (
        <div key={`${a.title}-${i}`} className="flex items-start gap-3 rounded-lg border p-3">
          <div className={`mt-2 h-2 w-2 rounded-full ${dotClass(a.severity)}`} />
          <div>
            <p className="text-sm font-medium">{a.title}</p>
            <p className="text-xs text-muted-foreground">{a.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
