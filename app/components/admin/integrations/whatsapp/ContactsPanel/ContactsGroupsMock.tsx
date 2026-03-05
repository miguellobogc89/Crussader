// app/components/admin/integrations/whatsapp/ContactsPanel/ContactsGroupsMock.tsx
"use client";

import GroupHeader from "@/app/components/admin/integrations/whatsapp/ContactsPanel/GroupHeader";
import { Clock, Star, MessageCircle } from "lucide-react";

export default function ContactsGroupsMock() {
  return (
    <div className="shrink-0 border-t bg-background">
      <GroupHeader
        title="CITAS PENDIENTES DE CONFIRMAR"
        count={0}
        icon={<Clock className="h-4 w-4" />}
        open={false}
        onToggle={() => {}}
      />
      <GroupHeader
        title="CLIENTE SIN RESEÑA"
        count={0}
        icon={<Star className="h-4 w-4" />}
        open={true}
        onToggle={() => {}}
      />
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