// app/dashboard/whatsapp/chat/page.tsx
"use client";

import { LoaderCircle } from "lucide-react";
import WhatsAppAdminShell from "@/app/components/whatsapp/WhatsAppAdminShell";
import { useBootstrapStatus } from "@/app/providers/bootstrap-store";

export const dynamic = "force-dynamic";

export default function WhatsAppChatPage() {
  const bootStatus = useBootstrapStatus();
  const isLoading = bootStatus !== "ready";

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[calc(100vh-96px)] w-full items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-[#2296ff]" />
      </div>
    );
  }

  return <WhatsAppAdminShell />;
}