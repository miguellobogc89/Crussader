// app/components/calendar/resources/ResourceList.tsx
"use client";

import { Badge } from "@/app/components/ui/badge";
import { Box } from "lucide-react";
import CollapsibleSection from "@/app/components/calendar/resources/CollapsibleSection";

export type Resource = {
  id: string;
  name: string;
  notes?: string | null;
  capacity?: number | null;
  active: boolean;
};

export default function ResourceList({
  collapsed,
  items,
  selectedIds,
  statusText,
  onToggle,
  maxHeight = 340,
  onAdd,
}: {
  collapsed: boolean;
  items: Resource[];
  selectedIds: string[];
  statusText?: string;
  onToggle: (id: string) => void;
  maxHeight?: number;
  onAdd?: () => void; // mock
}) {
  return (
    <div>
      <CollapsibleSection
        collapsedPanel={collapsed}
        icon={<Box className="h-4 w-4 text-primary" />}
        title="Recursos"
        count={items.length}
        onAdd={onAdd}
      >
        {statusText ? (
          <div className="mb-2 text-[11px] text-muted-foreground">{statusText}</div>
        ) : null}

        <div className="space-y-1 pr-1" style={{ maxHeight: `${maxHeight}px`, overflow: "auto" }}>
          {items.length === 0 ? (
            <p className="px-2 py-1 text-sm text-muted-foreground">Sin recursos.</p>
          ) : (
            items.map((r) => {
              const selected = selectedIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => onToggle(r.id)}
                  title={r.name}
                  className={[
                    "group flex w-full items-center justify-between rounded-md px-2 py-1 text-left transition",
                    selected ? "bg-primary/10" : "hover:bg-muted/60",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-sm">{r.name}</span>
                    {typeof r.capacity === "number" && r.capacity > 0 ? (
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        · cap {r.capacity}
                      </span>
                    ) : null}
                  </div>
                  {selected ? <Badge variant="secondary">Sel.</Badge> : null}
                </button>
              );
            })
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
