// app/dashboard/lead/page.tsx
import PageShell from "@/app/components/layouts/PageShell";
import LeadListPage from "@/app/components/crm/lead/LeadListPage";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LeadsPage() {
  return (
    <PageShell
      title="Leads"
      description=""
      titleIconName="Users"
    >
      <LeadListPage />
    </PageShell>
  );
}
