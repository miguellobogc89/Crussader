// app/components/admin/integrations/whatsapp/ContactsPanel/ContactsGroupsMock.tsx
"use client";

import GroupHeader from "@/app/components/admin/integrations/whatsapp/ContactsPanel/GroupHeader";
import { Clock, Star, MessageCircle } from "lucide-react";

export default function ContactsGroupsMock() {
  return (
    <div className="shrink-0 border-t bg-background">

      <GroupHeader
        title="RECORDATORIO PENDIENTE"
        count={0}
        icon={<MessageCircle className="h-4 w-4" />}
        open={false}
        onToggle={() => {}}
      />
    </div>
  );
}