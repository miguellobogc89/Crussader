// app/components/admin/integrations/whatsapp/templates/useWhatsAppTemplates.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WaTemplate } from "./types";
import { pickInitialSelectedId } from "./utils";

export function useWhatsAppTemplates(companyId: string | null) {
  const [items, setItems] = useState<WaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const languages = useMemo(() => {
    const set = new Set(items.map((t) => t.language).filter((x) => x.length > 0));
    return Array.from(set).sort();
  }, [items]);

  const refresh = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/templates?companyId=${companyId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        setItems([]);
        setSelectedId(null);
        return;
      }

      const data = await res.json().catch(() => null);

      if (!data || data.ok !== true || !Array.isArray(data.items)) {
        setItems([]);
        setSelectedId(null);
        return;
      }

      const mapped: WaTemplate[] = data.items.map((t: any) => ({
        id: String(t.id),
        name: String(t.template_name ?? ""),
        title: String(t.title ?? ""),
        status: String(t.status ?? "pending"),
        category: String(t.category ?? "marketing"),
        language: String(t.language ?? "es"),
        use: String(t.use_type ?? "start_conversation"),
        body: typeof t.body_preview === "string" ? t.body_preview : "",
        updatedAt: String(t.updated_at ?? new Date().toISOString()),
        isFavorite: Boolean(t.is_favorite),
        favoriteAt: t.favorite_at ? String(t.favorite_at) : null,
      }));

      // favoritos primero, luego updated
      mapped.sort((a, b) => {
        const af = a.isFavorite ? 1 : 0;
        const bf = b.isFavorite ? 1 : 0;
        if (bf !== af) return bf - af;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      setItems(mapped);
      setSelectedId((prev) => pickInitialSelectedId(mapped, prev));
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    refresh();
  }, [companyId, refresh]);

  const selected = useMemo(() => {
    return items.find((t) => t.id === selectedId) ?? null;
  }, [items, selectedId]);

  return {
    items,
    loading,
    selected,
    selectedId,
    setSelectedId,
    refresh,
    languages,
  };
}