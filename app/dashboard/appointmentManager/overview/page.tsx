// app/dashboard/appointmentManager/overview/page.tsx

import AppointmentManagerGeneralStatus from "@/app-legacy/components-legacy/appointmentManager/AppointmentManagerGeneralStatus";
import AppointmentManagerKpiCards from "@/app-legacy/components-legacy/appointmentManager/AppointmentManagerKpiCards";
import AppointmentManagerUpcomingAppointments from "@/app-legacy/components-legacy/appointmentManager/AppointmentManagerUpcomingAppointments";
import AppointmentManagerRecentActivity from "@/app-legacy/components-legacy/appointmentManager/AppointmentManagerRecentActivity";

export default function AppointmentManagerOverviewPage() {
  return (
    <main className="flex flex-col gap-6">

      <AppointmentManagerGeneralStatus />

      <AppointmentManagerKpiCards />

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <AppointmentManagerUpcomingAppointments />
        <AppointmentManagerRecentActivity />
      </section>

    </main>
  );
}