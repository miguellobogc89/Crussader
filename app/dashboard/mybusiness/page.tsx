// app/dashboard/mybusiness/page.tsx
import PageShellNoScroll from "@/app/components/layouts/PageShellNoScroll";
import EmployeesPageClient from "@/app/components/mybusiness/employees/EmployeesPageClient";

export default function MyBusinessPage() {
  return (
    <PageShellNoScroll
      title="Mi negocio"
      description="Gestiona empleados, servicios y configuración operativa del negocio"
      titleIconName="Building2"
    >
      <EmployeesPageClient />
    </PageShellNoScroll>
  );
}