// app/components/calendar/resources/ResourceView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronsLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";

import EmployeeList, {
  type Employee,
} from "@/app/components/calendar/resources/employees/EmployeeList";

import CreateEmployeeModal, {
  type CreateEmployeeDraft,
  type CreateEmployeeInitialData,
  type CreateEmployeeMode,
} from "@/app/components/calendar/resources/employees/CreateEmployeeModal";

import type { StaffRoleLite } from "@/app/components/calendar/resources/employees/types";

import ShiftList, {
  type ShiftTemplateLite,
  type ShiftTypeValue,
} from "@/app/components/calendar/resources/shift/ShiftList";

import CreateShiftTemplateModal, {
  type CreateShiftTemplateDraft,
} from "@/app/components/calendar/resources/shift/CreateShiftTemplateModal";

type ResourceSnapshot = {
  employees: Employee[];
  roles: StaffRoleLite[];
  shiftTemplates: ShiftTemplateLite[];
};

type Props = {
  listMaxHeight?: number;
  locationId: string | null;

  selectedEmployeeIds: string[];
  onChangeSelectedEmployeeIds: (ids: string[]) => void;

  shiftType: ShiftTypeValue;
  onChangeShiftType: (v: ShiftTypeValue) => void;

  onDataSnapshot?: (snapshot: ResourceSnapshot) => void;
};

function minsFromHHMM(v: string) {
  const parts = v.split(":");
  if (parts.length !== 2) return 0;

  const hh = Number(parts[0]);
  const mm = Number(parts[1]);

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
  if (hh < 0 || hh > 23) return 0;
  if (mm < 0 || mm > 59) return 0;

  return hh * 60 + mm;
}

export default function ResourceView({
  listMaxHeight = 340,
  locationId,
  selectedEmployeeIds,
  onChangeSelectedEmployeeIds,
  shiftType,
  onChangeShiftType,
  onDataSnapshot,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empMsg, setEmpMsg] = useState("");

  // roles (para autocomplete)
  const [roles, setRoles] = useState<StaffRoleLite[]>([]);
  const [rolesMsg, setRolesMsg] = useState("");

  // shifts
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplateLite[]>([]);

  // modals
  const [openCreateShift, setOpenCreateShift] = useState(false);

  const [openEmployeeModal, setOpenEmployeeModal] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] =
    useState<CreateEmployeeMode>("create");
  const [employeeInitialData, setEmployeeInitialData] = useState<
    CreateEmployeeInitialData | undefined
  >(undefined);

  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [employeeErr, setEmployeeErr] = useState<string | null>(null);

  // ✅ Emit snapshot “fresco” (evita que Shell se quede con templates = [])
  function emitSnapshot(next?: Partial<ResourceSnapshot>) {
    if (!onDataSnapshot) return;

    onDataSnapshot({
      employees: next?.employees ?? employees,
      roles: next?.roles ?? roles,
      shiftTemplates: next?.shiftTemplates ?? shiftTemplates,
    });
  }

  async function fetchEmployees(locId: string) {
    setEmpMsg("⏳ Cargando empleados…");
    try {
      const qs = new URLSearchParams({ locationId: locId });
      const res = await fetch(`/api/calendar/employees?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data || data?.error) {
        setEmployees([]);
        setEmpMsg(`❌ ${data?.error || "Error"}`);
        emitSnapshot({ employees: [] });
        return;
      }

      const list = Array.isArray(data.items) ? data.items : [];
      setEmployees(list);
      setEmpMsg("");
      emitSnapshot({ employees: list });
    } catch (e: any) {
      setEmployees([]);
      setEmpMsg(`❌ ${e?.message || "Error"}`);
      emitSnapshot({ employees: [] });
    }
  }

  async function fetchRoles(locId: string) {
    setRolesMsg("⏳ Cargando roles…");
    try {
      const qs = new URLSearchParams({ locationId: locId });
      const res = await fetch(`/api/calendar/employees/roles?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data || data?.ok === false) {
        setRoles([]);
        setRolesMsg(`❌ ${data?.error || "Error"}`);
        emitSnapshot({ roles: [] });
        return;
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      const mapped: StaffRoleLite[] = items.map((r: any) => ({
        id: String(r.id),
        name: String(r.name),
        slug: String(r.slug),
        color: r?.color ? String(r.color) : null,
      }));

      setRoles(mapped);
      setRolesMsg("");
      emitSnapshot({ roles: mapped });
    } catch (e: any) {
      setRoles([]);
      setRolesMsg(`❌ ${e?.message || "Error"}`);
      emitSnapshot({ roles: [] });
    }
  }

  async function fetchShiftTemplates(locId: string) {
    try {
      const qs = new URLSearchParams({ locationId: locId });
      const res = await fetch(
        `/api/calendar/shifts/shift-templates?${qs.toString()}`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => null);

      if (!res.ok || !json || json?.ok === false) {
        setShiftTemplates([]);
        emitSnapshot({ shiftTemplates: [] });
        return;
      }

      const items = Array.isArray(json?.items) ? json.items : [];
      setShiftTemplates(items);
      emitSnapshot({ shiftTemplates: items });
    } catch {
      setShiftTemplates([]);
      emitSnapshot({ shiftTemplates: [] });
    }
  }

  useEffect(() => {
    if (!locationId) {
      setEmployees([]);
      setRoles([]);
      setShiftTemplates([]);
      onChangeSelectedEmployeeIds([]);
      setEmpMsg("Selecciona una ubicación");
      setRolesMsg("");

      // ✅ sincroniza shell al limpiar
      emitSnapshot({ employees: [], roles: [], shiftTemplates: [] });
      return;
    }

    fetchEmployees(locationId);
    fetchRoles(locationId);
    fetchShiftTemplates(locationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const anySelectedEmployees = useMemo(
    () => selectedEmployeeIds.length > 0,
    [selectedEmployeeIds]
  );

  async function handleCreateTemplate(draft: CreateShiftTemplateDraft) {
    if (!locationId) return;

    let startMin = minsFromHHMM(draft.startHHMM);
    let endMin = minsFromHHMM(draft.endHHMM);

    if (draft.timeMode === "duration") {
      const dur = draft.durationHours * 60 + draft.durationMinutes;
      endMin = startMin + dur;
    }

    if (endMin <= startMin) return;
    if (endMin > 1439) endMin = 1439;

    const res = await fetch("/api/calendar/shifts/shift-templates/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        locationId,
        name: draft.name,
        startMin,
        endMin,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.ok === false) {
      console.error("create template error:", json?.error || res.status);
      return;
    }

    await fetchShiftTemplates(locationId);
  }

  async function handleUpsertEmployee(draft: CreateEmployeeDraft) {
    if (!locationId) return;

    setIsSavingEmployee(true);
    setEmployeeErr(null);

    try {
      const res = await fetch("/api/calendar/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          id: draft.id ?? undefined, // ✅ si viene, update
          name: draft.name,
          active: true,
          locationIds: [locationId],
          roleText: draft.roleText,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || data?.ok === false || data?.error) {
        setEmployeeErr(data?.error || "Error guardando empleado");
        return;
      }

      setOpenEmployeeModal(false);
      setEmployeeInitialData(undefined);
      setEmployeeModalMode("create");

      await fetchEmployees(locationId);
      await fetchRoles(locationId);
    } catch (e: any) {
      setEmployeeErr(e?.message || "Error guardando empleado");
    } finally {
      setIsSavingEmployee(false);
    }
  }

  async function handleDeleteEmployee() {
    if (!locationId) return;

    const id = employeeInitialData?.id;
    if (!id) return;

    setIsSavingEmployee(true);
    setEmployeeErr(null);

    try {
      const res = await fetch(`/api/calendar/employees/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || data?.ok === false) {
        setEmployeeErr(data?.error || "Error eliminando empleado");
        return;
      }

      setOpenEmployeeModal(false);
      setEmployeeInitialData(undefined);
      setEmployeeModalMode("create");

      onChangeSelectedEmployeeIds(selectedEmployeeIds.filter((x) => x !== id));

      await fetchEmployees(locationId);
      await fetchRoles(locationId);
    } catch (e: any) {
      setEmployeeErr(e?.message || "Error eliminando empleado");
    } finally {
      setIsSavingEmployee(false);
    }
  }

  return (
    <>
      <aside
        className={[
          "relative flex h-full flex-col bg-white border border-border rounded-2xl transition-[width] ease-in-out",
          collapsed ? "w-[56px]" : "w-[300px]",
        ].join(" ")}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border px-3 py-2 rounded-t-2xl bg-white">
          <div className="flex items-center gap-2">
            {!collapsed ? (
              <span className="text-sm font-semibold">Asignaciones</span>
            ) : null}
            {!collapsed && anySelectedEmployees ? (
              <span className="text-[11px] text-muted-foreground">
                Filtros activos
              </span>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((v) => !v)}
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

        <div className="flex-1 overflow-auto px-5 py-3 space-y-3">
          <EmployeeList
            collapsed={collapsed}
            items={employees}
            selectedIds={selectedEmployeeIds}
            statusText={empMsg}
            onToggle={(id) => {
              const has = selectedEmployeeIds.includes(id);
              onChangeSelectedEmployeeIds(
                has
                  ? selectedEmployeeIds.filter((x) => x !== id)
                  : [...selectedEmployeeIds, id]
              );
            }}
            maxHeight={listMaxHeight}
            onAdd={() => {
              setEmployeeModalMode("create");
              setEmployeeInitialData(undefined);
              setEmployeeErr(null);
              setOpenEmployeeModal(true);
            }}
            onEdit={(emp) => {
              setEmployeeModalMode("edit");
              setEmployeeInitialData({
                id: emp.id,
                name: emp.name,
                roleText: emp.primaryRoleName ?? "",
              });
              setEmployeeErr(null);
              setOpenEmployeeModal(true);
            }}
          />

          {!collapsed ? <div className="h-px bg-border" /> : null}

          <ShiftList
            collapsed={collapsed}
            value={shiftType}
            onChange={onChangeShiftType}
            templates={shiftTemplates}
            disabled={!locationId}
            maxHeight={listMaxHeight}
            onCreateCustomShift={() => setOpenCreateShift(true)}
          />

          {!collapsed && rolesMsg ? (
            <div className="text-[11px] text-muted-foreground">{rolesMsg}</div>
          ) : null}
        </div>
      </aside>

      <CreateShiftTemplateModal
        open={openCreateShift}
        onOpenChange={setOpenCreateShift}
        onSubmit={handleCreateTemplate}
      />

      <CreateEmployeeModal
        open={openEmployeeModal}
        mode={employeeModalMode}
        initialData={employeeInitialData}
        roles={roles}
        isSaving={isSavingEmployee}
        errorText={employeeErr}
        onDelete={handleDeleteEmployee}
        onOpenChange={(v) => {
          setOpenEmployeeModal(v);
          if (!v) {
            setEmployeeErr(null);
            setEmployeeInitialData(undefined);
            setEmployeeModalMode("create");
          }
        }}
        onSubmit={handleUpsertEmployee}
      />
    </>
  );
}
