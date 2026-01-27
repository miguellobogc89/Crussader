// app/components/calendar/ResourceView.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronsLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";

import EmployeeList, { type Employee } from "@/app/components/calendar/resources/EmployeeList";
import ResourceList, { type Resource } from "@/app/components/calendar/resources/ResourceList";
import ShiftList, {
  type ShiftTemplateLite,
  type ShiftTypeValue,
} from "@/app/components/calendar/resources/ShiftList";

type Props = {
  employees: Employee[];
  selectedEmployeeIds: string[];
  onToggleEmployee: (id: string) => void;
  employeeStatusText?: string;

  shiftType: ShiftTypeValue;
  onChangeShiftType: (v: ShiftTypeValue) => void;
  shiftTemplates: ShiftTemplateLite[];
  shiftTypeDisabled?: boolean;

  resources: Resource[];
  selectedResourceIds: string[];
  onToggleResource: (id: string) => void;
  resourceStatusText?: string;

  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
  listMaxHeight?: number;
};

export default function ResourceView({
  employees,
  selectedEmployeeIds,
  onToggleEmployee,
  employeeStatusText,

  shiftType,
  onChangeShiftType,
  shiftTemplates,
  shiftTypeDisabled = false,

  resources,
  selectedResourceIds,
  onToggleResource,
  resourceStatusText,

  collapsed: collapsedProp,
  onCollapsedChange,
  listMaxHeight = 340,
}: Props) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = collapsedProp ?? internalCollapsed;

  function toggleCollapse() {
    const next = !collapsed;
    if (onCollapsedChange) onCollapsedChange(next);
    else setInternalCollapsed(next);
  }

  const anySelectedEmployees = useMemo(
    () => selectedEmployeeIds.length > 0,
    [selectedEmployeeIds]
  );
  const anySelectedResources = useMemo(
    () => selectedResourceIds.length > 0,
    [selectedResourceIds]
  );

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
          {!collapsed && (anySelectedEmployees || anySelectedResources) ? (
            <span className="text-[11px] text-muted-foreground">Filtros activos</span>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          title={collapsed ? "Expandir panel" : "Colapsar panel"}
          className="shrink-0"
        >
          <ChevronsLeft
            className={[
              "h-4 w-4 transition-transform",
              collapsed ? "rotate-180" : "",
            ].join(" ")}
          />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 py-3 space-y-3">
        <EmployeeList
          collapsed={collapsed}
          items={employees}
          selectedIds={selectedEmployeeIds}
          statusText={employeeStatusText}
          onToggle={onToggleEmployee}
          maxHeight={listMaxHeight}
        />

        {!collapsed && <div className="h-px bg-border" />}

        <ShiftList
          collapsed={collapsed}
          value={shiftType}
          onChange={onChangeShiftType}
          templates={shiftTemplates}
          disabled={shiftTypeDisabled}
          maxHeight={listMaxHeight}
        />

        {!collapsed && <div className="h-px bg-border" />}

        <ResourceList
          collapsed={collapsed}
          items={resources}
          selectedIds={selectedResourceIds}
          statusText={resourceStatusText}
          onToggle={onToggleResource}
          maxHeight={listMaxHeight}
        />
      </div>
    </aside>
  );
}
