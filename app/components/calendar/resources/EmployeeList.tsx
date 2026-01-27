// app/components/calendar/resources/EmployeeList.tsx
"use client";

import { Badge } from "@/app/components/ui/badge";
import { Users } from "lucide-react";
import CollapsibleSection from "@/app/components/calendar/resources/CollapsibleSection";

export type Employee = {
  id: string;
  name: string;
  color?: string | null;
  active: boolean;
};

export default function EmployeeList({
  collapsed,
  items,
  selectedIds,
  statusText,
  onToggle,
  maxHeight = 340,
  onAdd,
}: {
  collapsed: boolean;
  items: Employee[];
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
        icon={<Users className="h-4 w-4 text-primary" />}
        title="Empleados"
        count={items.length}
        onAdd={onAdd}
      >
        {statusText ? (
          <div className="mb-2 text-[11px] text-muted-foreground">{statusText}</div>
        ) : null}

        <div className="space-y-1 pr-1" style={{ maxHeight: `${maxHeight}px`, overflow: "auto" }}>
          {items.length === 0 ? (
            <p className="px-2 py-1 text-sm text-muted-foreground">Sin empleados.</p>
          ) : (
            items.map((e) => {
              const selected = selectedIds.includes(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => onToggle(e.id)}
                  title={e.name}
                  className={[
                    "group flex w-full items-center justify-between rounded-md px-2 py-1 text-left transition",
                    selected ? "bg-primary/10" : "hover:bg-muted/60",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden
                      className="inline-block h-3 w-3 rounded-full ring-1 ring-border"
                      style={{ background: e.color || "#999" }}
                    />
                    <span className="truncate text-sm">{e.name}</span>
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
