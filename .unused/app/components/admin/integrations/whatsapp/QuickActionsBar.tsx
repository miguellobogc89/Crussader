// app/components/admin/integrations/whatsapp/QuickActionsBar.tsx
"use client";

export type QuickAction = {
  id: "ask_review" | "ask_experience" | "confirm";
  label: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { id: "ask_review", label: "Pedir reseña" },
  { id: "ask_experience", label: "¿Qué tal fue?" },
  { id: "confirm", label: "Confirmación" },
];

export default function QuickActionsBar({
  activeId = null,
  onSelect,
  className = "",
}: {
  activeId?: QuickAction["id"] | null;
  onSelect: (action: QuickAction) => void;
  className?: string;
}) {
  return (
    <div
      className={[
        "border-b bg-background px-3",
        "h-12 flex items-center",
        className,
      ].join(" ")}
    >
      <div className="flex w-full items-center gap-2 overflow-x-auto">
        {QUICK_ACTIONS.map((a) => {
          const active = activeId === a.id;

          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a)}
              className={[
                "shrink-0",
                "h-8",
                "rounded-full border px-3 text-xs font-medium",
                "transition-colors",
                "hover:bg-muted/50",
                active ? "bg-muted" : "bg-background",
              ].join(" ")}
            >
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}