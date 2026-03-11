// app/components/crm/lead/LeadListPage.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";

import NewLeadModal from "@/app/components/crm/lead/NewLeadModal";
import LeadsTable from "@/app/components/crm/lead/LeadsTable";

export default function LeadListPage() {
  const [isNewOpen, setIsNewOpen] = useState(false);

  useEffect(() => {
    const onNew = () => setIsNewOpen(true);
    window.addEventListener("leads:new", onNew as any);
    return () => window.removeEventListener("leads:new", onNew as any);
  }, []);

  const handleCreated = () => {
    setIsNewOpen(false);
    window.dispatchEvent(new Event("leads:reload"));
  };

  return (
    <>
      <Card>
        <CardContent className="pt-4">
          <LeadsTable />
        </CardContent>
      </Card>

      <NewLeadModal
        open={isNewOpen}
        onOpenChange={setIsNewOpen}
        onCreated={handleCreated}
      />
    </>
  );
}
