// app/dashboard/whatsapp/templates/page.tsx
"use client";

import { useBootstrapStore } from "@/app/providers/bootstrap-store";
import TemplatesShell from "@/app/components/admin/integrations/whatsapp/templates/TemplatesShell";
import { useWhatsAppTemplates } from "@/app/components/admin/integrations/whatsapp/templates/useWhatsAppTemplates";

export default function WhatsAppTemplatesPage() {
  const companyId = useBootstrapStore((s) => s.data?.activeCompanyResolved?.id ?? null);

  const { items, loading, selected, selectedId, setSelectedId, refresh, languages } =
    useWhatsAppTemplates(companyId);

  async function toggleFavorite(templateId: string, next: boolean) {
    if (!companyId) return;

    try {
      const res = await fetch("/api/whatsapp/templates/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          templateId,
          isFavorite: next, // ✅ nombre correcto para el endpoint
        }),
      });

      // Si falla, no rompemos UI pero lo dejamos visible en consola
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error("[WA templates] favorite failed", res.status, data);
      }
    } catch (e) {
      console.error("[WA templates] favorite network error", e);
    }

    await refresh();
  }

  return (
    <TemplatesShell
      items={items}
      loading={loading}
      selected={selected}
      selectedId={selectedId}
      onSelect={(id) => setSelectedId(id)}
      onRefresh={refresh}
      languages={languages}
      onToggleFavorite={toggleFavorite}
    />
  );
}