// app/components/slots/configuration/employees/EmployeesServicesModal.tsx
"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Sparkles, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { EmployeesShell } from "./employees/EmployeesShell";
import { ServicesShell, type ServiceItem } from "./services/ServicesShell";
import {
  buildAssignedEmployeeServiceItem,
  getAssignedServicesForEmployee,
  getIsUpdatingForEmployee,
  getRemovedServiceIdsForEmployee,
  getUpdateErrorForEmployee,
  persistEmployeeService,
  type AssignedEmployeeServiceItem,
} from "./employees/EmployeesServicesModal.helpers";

type EmployeesServicesModalProps = {
  open: boolean;
  onClose: () => void;
  locationId: string;
};

export function EmployeesServicesModal({
  open,
  onClose,
  locationId,
}: EmployeesServicesModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

  const [pendingAssignedByEmployee, setPendingAssignedByEmployee] = useState<
    Record<string, AssignedEmployeeServiceItem[]>
  >({});

  const [pendingRemovedByEmployee, setPendingRemovedByEmployee] = useState<
    Record<string, string[]>
  >({});

  const [isUpdatingByEmployee, setIsUpdatingByEmployee] = useState<
    Record<string, boolean>
  >({});

  const [updateErrorByEmployee, setUpdateErrorByEmployee] = useState<
    Record<string, string>
  >({});

  async function handleAssignService(service: ServiceItem) {
    if (!selectedEmployeeId) {
      return;
    }

    const employeeId = selectedEmployeeId;
    const previousServices = pendingAssignedByEmployee[employeeId] ?? [];
    const alreadyExists = previousServices.some((item) => {
      return item.id === service.id;
    });

    if (alreadyExists) {
      return;
    }

    const nextService = buildAssignedEmployeeServiceItem(service);

    setUpdateErrorByEmployee((current) => {
      return {
        ...current,
        [employeeId]: "",
      };
    });

    setIsUpdatingByEmployee((current) => {
      return {
        ...current,
        [employeeId]: true,
      };
    });

    setPendingAssignedByEmployee((current) => {
      const currentServices = current[employeeId] ?? [];

      return {
        ...current,
        [employeeId]: [...currentServices, nextService],
      };
    });

    setPendingRemovedByEmployee((current) => {
      const currentRemovedIds = current[employeeId] ?? [];

      return {
        ...current,
        [employeeId]: currentRemovedIds.filter((id) => {
          return id !== service.id;
        }),
      };
    });

    try {
      await persistEmployeeService(employeeId, service.id, "assign");
    } catch (error) {
      console.error("[EmployeesServicesModal] assign", error);

      setPendingAssignedByEmployee((current) => {
        const currentServices = current[employeeId] ?? [];

        return {
          ...current,
          [employeeId]: currentServices.filter((item) => {
            return item.id !== service.id;
          }),
        };
      });

      setUpdateErrorByEmployee((current) => {
        return {
          ...current,
          [employeeId]: "No se pudo asignar el servicio.",
        };
      });
    } finally {
      setIsUpdatingByEmployee((current) => {
        return {
          ...current,
          [employeeId]: false,
        };
      });
    }
  }

  async function handleUnassignService(serviceId: string) {
    if (!selectedEmployeeId) {
      return;
    }

    const employeeId = selectedEmployeeId;
    const previousServices = pendingAssignedByEmployee[employeeId] ?? [];
    const removedService = previousServices.find((item) => {
      return item.id === serviceId;
    });

    setUpdateErrorByEmployee((current) => {
      return {
        ...current,
        [employeeId]: "",
      };
    });

    setIsUpdatingByEmployee((current) => {
      return {
        ...current,
        [employeeId]: true,
      };
    });

    setPendingAssignedByEmployee((current) => {
      const currentServices = current[employeeId] ?? [];

      return {
        ...current,
        [employeeId]: currentServices.filter((item) => {
          return item.id !== serviceId;
        }),
      };
    });

    setPendingRemovedByEmployee((current) => {
      const currentRemovedIds = current[employeeId] ?? [];
      const alreadyExists = currentRemovedIds.includes(serviceId);

      if (alreadyExists) {
        return current;
      }

      return {
        ...current,
        [employeeId]: [...currentRemovedIds, serviceId],
      };
    });

    try {
      await persistEmployeeService(employeeId, serviceId, "unassign");
    } catch (error) {
      console.error("[EmployeesServicesModal] unassign", error);

      if (!removedService) {
        setUpdateErrorByEmployee((current) => {
          return {
            ...current,
            [employeeId]: "No se pudo desasignar el servicio.",
          };
        });

        return;
      }

      setPendingAssignedByEmployee((current) => {
        const currentServices = current[employeeId] ?? [];
        const alreadyExists = currentServices.some((item) => {
          return item.id === removedService.id;
        });

        if (alreadyExists) {
          return current;
        }

        return {
          ...current,
          [employeeId]: [...currentServices, removedService],
        };
      });

      setUpdateErrorByEmployee((current) => {
        return {
          ...current,
          [employeeId]: "No se pudo desasignar el servicio.",
        };
      });
    } finally {
      setIsUpdatingByEmployee((current) => {
        return {
          ...current,
          [employeeId]: false,
        };
      });
    }
  }

  const pendingAssignedServices = useMemo(() => {
    return getAssignedServicesForEmployee(
      pendingAssignedByEmployee,
      selectedEmployeeId,
    );
  }, [pendingAssignedByEmployee, selectedEmployeeId]);

  const pendingRemovedServiceIds = useMemo(() => {
    return getRemovedServiceIdsForEmployee(
      pendingRemovedByEmployee,
      selectedEmployeeId,
    );
  }, [pendingRemovedByEmployee, selectedEmployeeId]);

  const isUpdatingSelectedEmployee = useMemo(() => {
    return getIsUpdatingForEmployee(isUpdatingByEmployee, selectedEmployeeId);
  }, [isUpdatingByEmployee, selectedEmployeeId]);

  const updateErrorText = useMemo(() => {
    return getUpdateErrorForEmployee(updateErrorByEmployee, selectedEmployeeId);
  }, [selectedEmployeeId, updateErrorByEmployee]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[6px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative h-[820px] w-[1360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-violet-50 via-sky-50 to-emerald-50" />

            <div className="relative flex h-full flex-col">
              <div className="relative border-b border-slate-100 px-6 pb-5 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <Briefcase className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                        Configuración
                      </div>

                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                        Empleados y servicios
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Gestiona los empleados y el catálogo de servicios de la
                        ubicación activa.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 px-6 py-6">
                <div className="grid h-full gap-6 xl:grid-cols-3">
                  <EmployeesShell
                    locationId={locationId}
                    selectedEmployeeId={selectedEmployeeId}
                    onSelectEmployee={setSelectedEmployeeId}
                    onSelectedEmployeeNameChange={setSelectedEmployeeName}
                    pendingAssignedServices={pendingAssignedServices}
                    mode="list"
                  />

                  <EmployeesShell
                    locationId={locationId}
                    selectedEmployeeId={selectedEmployeeId}
                    onSelectEmployee={setSelectedEmployeeId}
                    onSelectedEmployeeNameChange={setSelectedEmployeeName}
                    pendingAssignedServices={pendingAssignedServices}
                    pendingRemovedServiceIds={pendingRemovedServiceIds}
                    onUnassignService={handleUnassignService}
                    isUpdating={isUpdatingSelectedEmployee}
                    updateErrorText={updateErrorText}
                    mode="assigned"
                  />

                  <ServicesShell
                    locationId={locationId}
                    selectedEmployeeId={selectedEmployeeId}
                    selectedEmployeeName={selectedEmployeeName}
                    assignedServices={pendingAssignedServices}
                    onAssignService={handleAssignService}
                    isUpdating={isUpdatingSelectedEmployee}
                    updateErrorText={updateErrorText}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}