// app/components/slots/configuration/ConfigurationCard.tsx
"use client";

import { useState } from "react";
import {
  CalendarDays,
  Settings2,
  Table2,
  Users2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ConfigurationCalendarModal } from "./ConfigurationCalendarModal";
import { AdminModal } from "./admin/AdminModal";
import { EmployeesServicesModal } from "./EmployeesServicesModal";

type ConfigurationCardProps = {
  locationId: string | null;
};

export function ConfigurationCard({
  locationId,
}: ConfigurationCardProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [employeesServicesOpen, setEmployeesServicesOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <Settings2 className="h-4 w-4 text-violet-600" />
            </div>

            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Configuración
            </h3>
          </div>

          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              onClick={() => setCalendarOpen(true)}
              variant="outline"
              className="h-10 w-full justify-start rounded-xl border-slate-200 bg-white text-foreground hover:bg-slate-50"
            >
              <CalendarDays className="mr-2 h-4 w-4 text-slate-500" />
              Modal calendario
            </Button>

            <Button
              type="button"
              onClick={() => setEmployeesServicesOpen(true)}
              variant="outline"
              className="h-10 w-full justify-start rounded-xl border-slate-200 bg-white text-foreground hover:bg-slate-50"
              disabled={!locationId}
            >
              <Users2 className="mr-2 h-4 w-4 text-slate-500" />
              Asignar servicios
            </Button>

            <Button
              type="button"
              onClick={() => setAdminOpen(true)}
              variant="outline"
              className="h-10 w-full justify-start rounded-xl border-slate-200 bg-white text-foreground hover:bg-slate-50"
              disabled={!locationId}
            >
              <Table2 className="mr-2 h-4 w-4 text-slate-500" />
              Administración
            </Button>
          </div>
        </div>
      </div>

      <ConfigurationCalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />

      <EmployeesServicesModal
        open={employeesServicesOpen}
        onClose={() => setEmployeesServicesOpen(false)}
        locationId={locationId ?? ""}
      />

      <AdminModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        locationId={locationId ?? ""}
      />
    </>
  );
}