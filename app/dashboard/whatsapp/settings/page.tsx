// app/dashboard/whatsapp/settings/page.tsx
"use client";

import MetaConnectCard from "./MetaConnectCard";
import WebhooksCard from "./WebhooksCard";

export default function WhatsAppSettingsPage() {
  return (
    <div className="space-y-4">
      <MetaConnectCard />
      <WebhooksCard />
    </div>
  );
}