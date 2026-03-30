// app/components/slots/configuration/ConfigurationEmployeesServicesModal.tsx

"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Check,
  Search,
  Sparkles,
  User2,
  Users2,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

type ConfigurationEmployeesServicesModalProps = {
  open: boolean;
  onClose: () => void;
};

type EmployeeItem = {
  id: string;
  name: string;
  role: string;
  colorClass: string;
};

type ServiceItem = {
  id: string;
  name: string;
  duration: string;
};

const EMPLOYEES: EmployeeItem[] = [
  {
    id: "emp_1",
    name: "Lucía Romero",
    role: "Odontología general",
    colorClass: "bg-violet-100 text-violet-700",
  },
  {
    id: "emp_2",
    name: "Diego Martín",
    role: "Higiene dental",
    colorClass: "bg-sky-100 text-sky-700",
  },
  {
    id: "emp_3",
    name: "Marta León",
    role: "Ortodoncia",
    colorClass: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "emp_4",
    name: "Carlos Vega",
    role: "Implantes",
    colorClass: "bg-amber-100 text-amber-700",
  },
];

const ALL_SERVICES: ServiceItem[] = [
  { id: "srv_1", name: "Primera visita", duration: "30 min" },
  { id: "srv_2", name: "Limpieza dental", duration: "45 min" },
  { id: "srv_3", name: "Empaste", duration: "60 min" },
  { id: "srv_4", name: "Extracción", duration: "50 min" },
  { id: "srv_5", name: "Ortodoncia revisión", duration: "20 min" },
  { id: "srv_6", name: "Implante valoración", duration: "40 min" },
  { id: "srv_7", name: "Blanqueamiento", duration: "45 min" },
  { id: "srv_8", name: "Urgencia", duration: "25 min" },
];

const INITIAL_EMPLOYEE_SERVICES: Record<string, string[]> = {
  emp_1: ["srv_1", "srv_3", "srv_8"],
  emp_2: ["srv_2", "srv_7"],
  emp_3: ["srv_5"],
  emp_4: ["srv_4", "srv_6"],
};

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

export function ConfigurationEmployeesServicesModal({
  open,
  onClose,
}: ConfigurationEmployeesServicesModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    EMPLOYEES[0].id
  );
  const [employeeServices, setEmployeeServices] = useState<
    Record<string, string[]>
  >(INITIAL_EMPLOYEE_SERVICES);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");

  const selectedEmployee = useMemo(() => {
    return EMPLOYEES.find((employee) => employee.id === selectedEmployeeId);
  }, [selectedEmployeeId]);

  const selectedServiceIds = employeeServices[selectedEmployeeId] ?? [];

  const filteredEmployees = useMemo(() => {
    const normalized = employeeQuery.trim().toLowerCase();

    if (!normalized) {
      return EMPLOYEES;
    }

    return EMPLOYEES.filter((employee) => {
      return (
        employee.name.toLowerCase().includes(normalized) ||
        employee.role.toLowerCase().includes(normalized)
      );
    });
  }, [employeeQuery]);

  const assignedServices = useMemo(() => {
    const normalized = serviceQuery.trim().toLowerCase();

    return ALL_SERVICES.filter((service) => {
      if (!selectedServiceIds.includes(service.id)) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return service.name.toLowerCase().includes(normalized);
    });
  }, [selectedServiceIds, serviceQuery]);

  const availableServices = useMemo(() => {
    const normalized = serviceQuery.trim().toLowerCase();

    return ALL_SERVICES.filter((service) => {
      if (selectedServiceIds.includes(service.id)) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return service.name.toLowerCase().includes(normalized);
    });
  }, [selectedServiceIds, serviceQuery]);

  function assignService(serviceId: string) {
    setEmployeeServices((current) => {
      const currentIds = current[selectedEmployeeId] ?? [];

      if (currentIds.includes(serviceId)) {
        return current;
      }

      return {
        ...current,
        [selectedEmployeeId]: [...currentIds, serviceId],
      };
    });
  }

  function unassignService(serviceId: string) {
    setEmployeeServices((current) => {
      const currentIds = current[selectedEmployeeId] ?? [];

      return {
        ...current,
        [selectedEmployeeId]: currentIds.filter((id) => id !== serviceId),
      };
    });
  }

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
            className="relative w-full max-w-7xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-violet-50 via-sky-50 to-emerald-50" />

            <div className="relative border-b border-slate-100 px-6 pb-5 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <Briefcase className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                      Asignación visual
                    </div>

                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                      Empleados y servicios
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Selecciona un empleado, revisa sus servicios actuales y añade
                      o quita servicios de forma directa.
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

            <div className="grid gap-5 px-6 py-6 lg:grid-cols-[0.95fr_1.1fr_1.1fr]">
              <section className="flex min-h-[560px] flex-col rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                    <Users2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Empleados
                    </p>
                    <p className="text-xs text-slate-500">
                      Selecciona uno para editar
                    </p>
                  </div>
                </div>

                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={employeeQuery}
                    onChange={(event) => setEmployeeQuery(event.target.value)}
                    placeholder="Buscar empleado..."
                    className="h-10 rounded-2xl border-slate-200 bg-white pl-9"
                  />
                </div>

                <div className="flex-1 space-y-2 overflow-auto pr-1">
                  {filteredEmployees.map((employee) => {
                    const isSelected = employee.id === selectedEmployeeId;
                    const assignedCount =
                      employeeServices[employee.id]?.length ?? 0;

                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => setSelectedEmployeeId(employee.id)}
                        className={[
                          "w-full rounded-2xl border p-3 text-left transition",
                          isSelected
                            ? "border-sky-300 bg-white shadow-[0_8px_24px_rgba(14,165,233,0.10)]"
                            : "border-transparent bg-white/70 hover:border-slate-200 hover:bg-white",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={[
                              "flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-semibold",
                              employee.colorClass,
                            ].join(" ")}
                          >
                            {getInitials(employee.name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {employee.name}
                              </p>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                {assignedCount}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {employee.role}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="flex min-h-[560px] flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      Servicios asignados
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {selectedEmployee?.name} · clic para quitar
                    </p>
                  </div>

                  <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    {assignedServices.length} activos
                  </div>
                </div>

                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={serviceQuery}
                    onChange={(event) => setServiceQuery(event.target.value)}
                    placeholder="Filtrar servicios..."
                    className="h-10 rounded-2xl border-slate-200 bg-slate-50 pl-9"
                  />
                </div>

                <div className="flex-1 space-y-2 overflow-auto pr-1">
                  {assignedServices.map((service) => {
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => unassignService(service.id)}
                        className="w-full rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-left transition hover:bg-emerald-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              {service.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {service.duration}
                            </p>
                          </div>

                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-600 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                            <X className="h-4 w-4" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="flex min-h-[560px] flex-col rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Servicios disponibles
                    </p>
                    <p className="text-xs text-slate-500">
                      Clic para añadir al centro
                    </p>
                  </div>

                  <div className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                    {availableServices.length} disponibles
                  </div>
                </div>

                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={serviceQuery}
                    onChange={(event) => setServiceQuery(event.target.value)}
                    placeholder="Buscar disponibles..."
                    className="h-10 rounded-2xl border-slate-200 bg-white pl-9"
                  />
                </div>

                <div className="flex-1 space-y-2 overflow-auto pr-1">
                  {availableServices.map((service) => {
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => assignService(service.id)}
                        className="w-full rounded-2xl border border-transparent bg-white p-3 text-left transition hover:border-slate-200 hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              {service.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {service.duration}
                            </p>
                          </div>

                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}