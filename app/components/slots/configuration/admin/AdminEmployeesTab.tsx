// app/components/slots/configuration/Admin/AdminEmployeesTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminEmployeesList } from "./AdminEmployeesList";
import { AdminEmployeeDetails } from "./AdminEmployeeDetails";
import type { EmployeeItem } from "./admin.types";
import {
  buildInitialEmployeeForm,
  normalizeText,
} from "./admin.types";

const LIST = "/api/slots/employees/list";
const CREATE = "/api/slots/employees/create";
const UPDATE = "/api/slots/employees/update";

export function AdminEmployeesTab({
  locationId,
}: {
  locationId: string;
}) {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<EmployeeItem | null>(null);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  const [inviteSuccess, setInviteSuccess] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  const [showCreateColorPicker, setShowCreateColorPicker] = useState(false);
  const [showEditColorPicker, setShowEditColorPicker] = useState(false);

  const [newForm, setNewForm] = useState(buildInitialEmployeeForm());

  useEffect(() => {
    if (!locationId) {
      setEmployees([]);
      setSelectedId("");
      setDraft(null);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        setSaveError("");

        const res = await fetch(`${LIST}?locationId=${locationId}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          setEmployees([]);
          setSelectedId("");
          setDraft(null);
          setLoading(false);
          return;
        }

        const nextEmployees: EmployeeItem[] = Array.isArray(data.employees)
          ? data.employees.map((item: any) => {
              return {
                id: String(item.id),
                name: String(item.name ?? ""),
                title: String(item.title ?? ""),
                firstName: String(item.firstName ?? ""),
                lastName: String(item.lastName ?? ""),
                role: String(item.role ?? "Sin especialidad"),
                color: String(item.color ?? ""),
                isPrimary: Boolean(item.isPrimary),
                active: Boolean(item.active ?? true),
                email: String(item.email ?? ""),
                phone: String(item.phone ?? ""),
                invitedAt: item.invitedAt ?? null,
                joinedAt: item.joinedAt ?? null,
              };
            })
          : [];

        setEmployees(nextEmployees);

        if (nextEmployees.length > 0) {
          setSelectedId((current) => {
            const exists = nextEmployees.some((employee) => employee.id === current);

            if (exists) {
              return current;
            }

            return nextEmployees[0].id;
          });
        } else {
          setSelectedId("");
          setDraft(null);
        }

        setLoading(false);
      } catch (error) {
        console.error("[AdminEmployeesTab] load", error);
        setEmployees([]);
        setSelectedId("");
        setDraft(null);
        setLoading(false);
      }
    }

    load();
  }, [locationId]);

  useEffect(() => {
    const emp = employees.find((employee) => employee.id === selectedId) ?? null;
    setDraft(emp);
    setShowEditColorPicker(false);
  }, [selectedId, employees]);

  useEffect(() => {
    if (!createSuccess) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCreateSuccess("");
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [createSuccess]);

  useEffect(() => {
    if (!saveSuccess) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSaveSuccess("");
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [saveSuccess]);

  useEffect(() => {
    if (!inviteSuccess) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setInviteSuccess("");
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [inviteSuccess]);

  useEffect(() => {
    if (!deleteSuccess) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setDeleteSuccess("");
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [deleteSuccess]);

  async function handleCreate() {
    const title = normalizeText(newForm.title);
    const firstName = normalizeText(newForm.firstName);
    const lastName = normalizeText(newForm.lastName);
    const explicitName = normalizeText(newForm.name);
    const role = normalizeText(newForm.role);
    const color = normalizeText(newForm.color);
    const email = normalizeText(newForm.email);
    const phone = normalizeText(newForm.phone);

    let computedName = explicitName;

    if (!computedName) {
      computedName = [firstName, lastName].filter(Boolean).join(" ").trim();
    }

    setCreateError("");
    setCreateSuccess("");

    if (!computedName) {
      setCreateError("El nombre es obligatorio.");
      return;
    }

    try {
      setIsSubmittingCreate(true);

      const res = await fetch(CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId,
          name: computedName,
          title,
          firstName,
          lastName,
          jobTitle: role,
          color,
          email,
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok || !data?.employee?.id) {
        setCreateError(data?.error ?? "No se pudo crear el empleado.");
        setIsSubmittingCreate(false);
        return;
      }

      const createdEmployee: EmployeeItem = {
        id: String(data.employee.id),
        name: String(data.employee.name ?? computedName),
        title: String(data.employee.title ?? title),
        firstName: String(data.employee.firstName ?? firstName),
        lastName: String(data.employee.lastName ?? lastName),
        role: String(data.employee.role ?? (role || "Sin especialidad")),
        color: String(data.employee.color ?? color),
        isPrimary: false,
        active: Boolean(data.employee.active ?? true),
        email: String(data.employee.email ?? email),
        phone: String(data.employee.phone ?? phone),
        invitedAt: data.employee.invitedAt ?? null,
        joinedAt: data.employee.joinedAt ?? null,
      };

      setEmployees((prev) => {
        return [createdEmployee, ...prev];
      });
      setSelectedId(createdEmployee.id);
      setIsCreating(false);
      setShowCreateColorPicker(false);
      setNewForm(buildInitialEmployeeForm());
      setCreateSuccess("Empleado creado correctamente.");
      setIsSubmittingCreate(false);
    } catch (error) {
      console.error("[AdminEmployeesTab] handleCreate", error);
      setCreateError("No se pudo crear el empleado.");
      setIsSubmittingCreate(false);
    }
  }

  function updateDraft<K extends keyof EmployeeItem>(
    key: K,
    value: EmployeeItem[K],
  ) {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }

      return { ...prev, [key]: value };
    });
  }

  async function saveEmployee() {
    if (!draft) {
      return;
    }

    const title = normalizeText(draft.title ?? "");
    const firstName = normalizeText(draft.firstName ?? "");
    const lastName = normalizeText(draft.lastName ?? "");
    const explicitName = normalizeText(draft.name);
    const role = normalizeText(draft.role);
    const color = normalizeText(draft.color);
    const email = normalizeText(draft.email ?? "");
    const phone = normalizeText(draft.phone ?? "");

    let computedName = explicitName;

    if (!computedName) {
      computedName = [firstName, lastName].filter(Boolean).join(" ").trim();
    }

    setSaveError("");
    setSaveSuccess("");

    if (!computedName) {
      setSaveError("El nombre es obligatorio.");
      return;
    }

    try {
      setIsSaving(true);

      const res = await fetch(UPDATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: draft.id,
          name: computedName,
          title,
          firstName,
          lastName,
          jobTitle: role,
          color,
          email,
          phone,
          active: Boolean(draft.active ?? true),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok || !data?.employee?.id) {
        setSaveError(data?.error ?? "No se pudo actualizar el empleado.");
        setIsSaving(false);
        return;
      }

      const updatedEmployee: EmployeeItem = {
        id: String(data.employee.id),
        name: String(data.employee.name ?? computedName),
        title: String(data.employee.title ?? title),
        firstName: String(data.employee.firstName ?? firstName),
        lastName: String(data.employee.lastName ?? lastName),
        role: String(data.employee.role ?? (role || "Sin especialidad")),
        color: String(data.employee.color ?? color),
        isPrimary: draft.isPrimary,
        active: Boolean(data.employee.active ?? true),
        email: String(data.employee.email ?? email),
        phone: String(data.employee.phone ?? phone),
        invitedAt: data.employee.invitedAt ?? null,
        joinedAt: data.employee.joinedAt ?? null,
      };

      setEmployees((prev) => {
        return prev.map((employee) => {
          if (employee.id === updatedEmployee.id) {
            return updatedEmployee;
          }

          return employee;
        });
      });

      setDraft(updatedEmployee);
      setSaveSuccess("Empleado actualizado.");
      setIsSaving(false);
    } catch (error) {
      console.error("[AdminEmployeesTab] saveEmployee", error);
      setSaveError("No se pudo actualizar el empleado.");
      setIsSaving(false);
    }
  }

  function deleteLocal() {
    if (!draft) {
      return;
    }

    const nextEmployees = employees.filter((employee) => employee.id !== draft.id);

    setEmployees(nextEmployees);
    setSelectedId(nextEmployees[0]?.id ?? "");
    setDraft(nextEmployees[0] ?? null);
    setDeleteSuccess("Empleado eliminado en local.");
  }

  const filtered = useMemo(() => {
    if (!search) {
      return employees;
    }

    const normalized = search.toLowerCase();

    return employees.filter((employee) => {
      return [
        employee.name,
        employee.firstName ?? "",
        employee.lastName ?? "",
        employee.role,
        employee.email ?? "",
        employee.phone ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [search, employees]);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4">
        <AdminEmployeesList
          employees={filtered}
          selectedEmployeeId={selectedId}
          employeeSearch={search}
          onEmployeeSearchChange={setSearch}
          onSelectEmployee={setSelectedId}
          loadingEmployees={loading}
          employeesError={saveError}
          isCreatingEmployee={isCreating}
          onToggleCreateEmployee={() => {
            setIsCreating((prev) => !prev);
            setCreateError("");
            setCreateSuccess("");
            setShowCreateColorPicker(false);
          }}
          newEmployeeForm={newForm}
          onNewEmployeeFormChange={(key, value) =>
            setNewForm((prev) => ({ ...prev, [key]: value }))
          }
          showCreateColorPicker={showCreateColorPicker}
          onToggleCreateColorPicker={() =>
            setShowCreateColorPicker((prev) => !prev)
          }
          createEmployeeError={createError}
          createEmployeeSuccess={createSuccess}
          isSubmittingCreate={isSubmittingCreate}
          onCreateEmployee={handleCreate}
          onCancelCreateEmployee={() => {
            setIsCreating(false);
            setCreateError("");
            setCreateSuccess("");
            setShowCreateColorPicker(false);
            setNewForm(buildInitialEmployeeForm());
          }}
        />
      </div>

      <div className="col-span-8">
        <AdminEmployeeDetails
          employeeDraft={draft}
          onEmployeeDraftChange={updateDraft}
          showColorPicker={showEditColorPicker}
          onToggleColorPicker={() =>
            setShowEditColorPicker((prev) => !prev)
          }
          isSavingEmployee={isSaving}
          onSaveEmployee={saveEmployee}
          onInviteEmployee={() => {
            if (!draft) {
              return;
            }

            setInviteSuccess(`Invitación mock preparada para ${draft.name}.`);
          }}
          onDeleteEmployee={deleteLocal}
          saveEmployeeSuccess={saveSuccess}
          inviteSuccess={inviteSuccess}
          deleteSuccess={deleteSuccess}
        />
      </div>
    </div>
  );
}