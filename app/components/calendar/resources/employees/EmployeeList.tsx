// app/components/calendar/resources/employees/EmployeeList.tsx
"use client";

import { Badge } from "@/app/components/ui/badge";
import { Users, Pencil } from "lucide-react";
import CollapsibleSection from "@/app/components/calendar/resources/CollapsibleSection";

export type Employee = {
  id: string;
  name: string;
  active: boolean;
  color?: string | null;
  primaryRoleName?: string | null;
  primaryRoleColor?: string | null;
};

export default function EmployeeList({
  collapsed,
  items,
  selectedIds,
  statusText,
  onToggle,
  onEdit,
  maxHeight = 340,
  onAdd,
}: {
  collapsed: boolean;
  items: Employee[];
  selectedIds: string[];
  statusText?: string;
  onToggle: (id: string) => void;
  onEdit: (emp: Employee) => void;
  maxHeight?: number;
  onAdd?: () => void;
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
          <div className="mb-2 text-[11px] text-muted-foreground">
            {statusText}
          </div>
        ) : null}

        <div
          className="space-y-1 pr-1"
          style={{ maxHeight, overflow: "auto" }}
        >
          {items.length === 0 ? (
            <p className="px-2 py-1 text-sm text-muted-foreground">
              Sin empleados.
            </p>
          ) : (
            items.map((e) => {
              const selected = selectedIds.includes(e.id);

              return (
                <div
                  key={e.id}
                  className={[
                    "group flex items-center justify-between rounded-md px-2 py-1 transition",
                    selected ? "bg-primary/10" : "hover:bg-muted/60",
                  ].join(" ")}
                >
                  {/* Click principal */}
                  <button
                    onClick={() => onToggle(e.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      aria-hidden
                      className="inline-block h-3 w-3 rounded-full ring-1 ring-border"
                      style={{
                        background: e.color || "#999",
                      }}
                    />

                    <span className="truncate text-sm">
                      {e.name}
                      {e.primaryRoleName ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          · {e.primaryRoleName}
                        </span>
                      ) : null}
                    </span>
                  </button>

                  {/* Acciones */}
                  <div className="flex items-center gap-1">
                    {selected ? (
                      <Badge variant="secondary">Sel.</Badge>
                    ) : null}

                    <button
                      onClick={() => onEdit(e)}
                      title="Editar empleado"
                      className="invisible rounded p-1 text-muted-foreground hover:text-foreground group-hover:visible"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
