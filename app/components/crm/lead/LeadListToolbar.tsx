// app/components/crm/lead/LeadListToolbar.tsx
"use client";

import { Button } from "@/app/components/ui/button";
import { Plus } from "lucide-react";

export default function LeadListToolbar() {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => {
          window.dispatchEvent(new CustomEvent("leads:new"));
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nuevo lead
      </Button>
    </div>
  );
}
