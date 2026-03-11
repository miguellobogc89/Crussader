// app/dashboard/crussaderAssistant/chat/page.tsx
"use client";

import CrussaderAssistantShell from "@/app/components/crussaderAssistant/CrussaderAssistantShell";
import { useBootstrapStatus } from "@/app/providers/bootstrap-store";

export const dynamic = "force-dynamic";

export default function CrussaderAssistantChatPage() {
  const bootStatus = useBootstrapStatus();
  const isLoading = bootStatus !== "ready";

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Cargando asistente…</div>;
  }

  return <CrussaderAssistantShell />;
}