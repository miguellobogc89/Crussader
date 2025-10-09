// app/components/calendar/ResourceStatus.tsx
"use client";

import { useMemo, useState } from "react";
import { Users, Box, ChevronsLeft, CalendarClock } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import UpcomingEventsList from "@/app/components/calendar/UpcomingEventsList";

export type Employee = { id: string; name: string; color?: string | null; active: boolean };
export type Resource = { id: string; name: string; notes?: string | null; capacity?: number | null; active: boolean };

// Para UpcomingEventsList
type Appointment = {
  id: string;
  startAt: string;
  endAt: string;
  serviceId: string;
  status?: "PENDING" | "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | null;
  employeeId?: string | null;
  resourceId?: string | null;
  customerName?: string | null;
  notes?: string | null;
};

type AppointmentLite = { id: string };

type Props = {
  employees: Employee[];
  selectedEmployeeIds: string[];
  onToggleEmployee: (id: string) => void;
  employeeStatusText?: string;

  resources: Resource[];
  selectedResourceIds: string[];
  onToggleResource: (id: string) => void;
  resourceStatusText?: string;

  /** citas del día (filtradas fuera) para listar “pendientes de hoy” */
  todaysPending?: Appointment[];
  onSelectAppointmentFromPending?: (a: AppointmentLite) => void;

  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
  listMaxHeight?: number; // alto máximo de cada lista
};

export default function ResourceStatus({
  employees,
  selectedEmployeeIds,
  onToggleEmployee,
  employeeStatusText,

  resources,
  selectedResourceIds,
  onToggleResource,
  resourceStatusText,

  todaysPending = [],
  onSelectAppointmentFromPending,

  collapsed: collapsedProp,
  onCollapsedChange,
  listMaxHeight = 300,
}: Props) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = collapsedProp ?? internalCollapsed;

  function toggleCollapse() {
    if (onCollapsedChange) onCollapsedChange(!collapsed);
    else setInternalCollapsed((v) => !v);
  }

  const anySelectedEmployees = useMemo(() => selectedEmployeeIds.length > 0, [selectedEmployeeIds]);
  const anySelectedResources = useMemo(() => selectedResourceIds.length > 0, [selectedResourceIds]);

  return (
    <aside
      className={[
        "relative flex h-full flex-col bg-white border border-border rounded-2xl transition-[width] ease-in-out",
        collapsed ? "w-[56px]" : "w-[300px]",
      ].join(" ")}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border px-3 py-2 rounded-t-2xl bg-white">
        <div className="flex items-center gap-2">
          {!collapsed && <span className="text-sm font-semibold">Asignaciones</span>}
          {!collapsed && (anySelectedEmployees || anySelectedResources) && (
            <span className="text-[11px] text-muted-foreground">Filtros activos</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          title={collapsed ? "Expandir panel" : "Colapsar panel"}
          className="shrink-0"
        >
          <ChevronsLeft className={["h-4 w-4 transition-transform", collapsed ? "rotate-180" : ""].join(" ")} />
        </Button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto px-5 py-3">
        {/* Empleados */}
        <SectionHeader icon={<Users className="h-4 w-4 text-primary" />} title="Empleados" collapsed={collapsed}>
          {!collapsed && employeeStatusText && (
            <span className="text-[11px] text-muted-foreground">{employeeStatusText}</span>
          )}
        </SectionHeader>

        <ListWrap maxHeight={collapsed ? undefined : listMaxHeight}>
          {employees.length === 0 ? (
            <EmptyLine collapsed={collapsed} text="Sin empleados." />
          ) : (
            employees.map((e) => {
              const selected = selectedEmployeeIds.includes(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => onToggleEmployee(e.id)}
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
                    {!collapsed && <span className="truncate text-sm">{e.name}</span>}
                  </div>
                  {!collapsed && selected && <Badge variant="secondary">Sel.</Badge>}
                </button>
              );
            })
          )}
        </ListWrap>

        {/* Separador */}
        {!collapsed && <div className="my-3 h-px bg-border" />}

        {/* Recursos */}
        <SectionHeader icon={<Box className="h-4 w-4 text-primary" />} title="Recursos" collapsed={collapsed}>
          {!collapsed && resourceStatusText && (
            <span className="text-[11px] text-muted-foreground">{resourceStatusText}</span>
          )}
        </SectionHeader>

        <ListWrap maxHeight={collapsed ? undefined : listMaxHeight}>
          {resources.length === 0 ? (
            <EmptyLine collapsed={collapsed} text="Sin recursos." />
          ) : (
            resources.map((r) => {
              const selected = selectedResourceIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => onToggleResource(r.id)}
                  title={r.name}
                  className={[
                    "group flex w-full items-center justify-between rounded-md px-2 py-1 text-left transition",
                    selected ? "bg-primary/10" : "hover:bg-muted/60",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {!collapsed && (
                      <>
                        <span className="truncate text-sm">{r.name}</span>
                        {typeof r.capacity === "number" && r.capacity > 0 && (
                          <span className="text-[11px] text-muted-foreground shrink-0">· cap {r.capacity}</span>
                        )}
                      </>
                    )}
                  </div>
                  {!collapsed && selected && <Badge variant="secondary">Sel.</Badge>}
                </button>
              );
            })
          )}
        </ListWrap>

        {/* ===== Citas pendientes de hoy ===== */}
        {!collapsed && (
          <>
            <div className="my-3 h-px bg-border" />
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">Citas pendientes de hoy</h3>
              </div>
              {todaysPending?.length ? (
                <span className="text-[11px] text-muted-foreground">{todaysPending.length}</span>
              ) : null}
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <div className="max-h-[260px] overflow-y-auto">
                <UpcomingEventsList
                    title="" // sin cabecera interna; usamos la nuestra
                    appointments={todaysPending}
                    onSelectAppointment={onSelectAppointmentFromPending ?? (() => {})}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

/* ---------- Subcomponentes ---------- */

function SectionHeader({
  icon,
  title,
  collapsed,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  collapsed: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        {!collapsed && <h3 className="text-sm font-semibold">{title}</h3>}
      </div>
      {!collapsed && children}
    </div>
  );
}

function EmptyLine({ collapsed, text }: { collapsed: boolean; text: string }) {
  if (collapsed) return null;
  return <p className="px-2 py-1 text-sm text-muted-foreground">{text}</p>;
}

function ListWrap({ maxHeight, children }: { maxHeight?: number; children: React.ReactNode }) {
  return (
    <div
      className="space-y-1 pr-1"
      style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined, overflow: maxHeight ? "auto" : undefined }}
    >
      {children}
    </div>
  );
}
