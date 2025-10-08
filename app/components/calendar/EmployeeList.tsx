// app/components/calendar/EmployeeList.tsx

"use client";

import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Users } from "lucide-react";

export type Employee = { id: string; name: string; color?: string | null; active: boolean };

export default function EmployeeList({
  items,
  selectedIds,
  statusText,
  onToggle,
}: {
  items: Employee[];
  selectedIds: string[];
  statusText?: string;
  onToggle: (id: string) => void;
}) {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Empleados
        </CardTitle>
        <div className="text-xs text-muted-foreground">{statusText || ""}</div>
      </CardHeader>
      <CardContent className="max-h-[340px] overflow-auto space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin empleados.</p>
        ) : (
          items.map((e) => {
            const selected = selectedIds.includes(e.id);
            return (
              <button
                key={e.id}
                onClick={() => onToggle(e.id)}
                className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-left transition ${
                  selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"
                }`}
                title={e.id}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: e.color || "#999" }}
                  />
                  <span className="text-sm">{e.name}</span>
                </div>
                {selected && <Badge variant="secondary">Sel.</Badge>}
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
