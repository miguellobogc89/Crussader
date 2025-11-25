// app/components/reviews/settings-test/ReviewsSettingsPanel.tsx
"use client";

import { useLayoutEffect, useRef, useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Eye,
  SlidersHorizontal,
  Languages,
  Sparkles,
  Globe,
  ShieldCheck,
  UserCheck,
  Cpu,
} from "lucide-react";

import Header from "./Header";
import PanelSections from "./PanelSections";
import SettingsChips from "./SettingsChips";

import type { ResponseSettings } from "@/app/schemas/response-settings";
import { defaultResponseSettings } from "@/app/schemas/default-response-settings";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

const SIDEBAR_HEADER_H = 56;

type MenuItem = {
  value: string;
  label: string;
  icon: LucideIcon;
};

// -------- helpers: resolver companyId y sector desde boot --------
function resolveCompanyIdFromBoot(boot: any): string | null {
  const candidates: Array<any> = [
    boot?.activeCompanyResolved,
    boot?.activeCompany,
    ...(Array.isArray(boot?.companiesResolved) ? boot.companiesResolved : []),
    ...(Array.isArray(boot?.companies) ? boot.companies : []),
  ];
  for (const c of candidates) {
    if (c && typeof c === "object") {
      if (typeof c.id === "string") return c.id;
      if (typeof c.companyId === "string") return c.companyId;
    }
  }
  return null;
}

function resolveSectorFromBoot(boot: any): string | null {
  const lx = boot?.activeLocationResolved ?? boot?.activeLocation ?? null;

  const tryGet = (obj: any, path: string[]): string | null => {
    let cur = obj;
    for (const k of path) {
      if (!cur || typeof cur !== "object") return null;
      cur = cur[k];
    }
    return typeof cur === "string" && cur.trim() ? cur.trim() : null;
  };

  if (lx) {
    const fromType = tryGet(lx, ["type", "name"]);
    if (fromType) return fromType;
    const fromActivity = tryGet(lx, ["activity", "name"]);
    if (fromActivity) return fromActivity;
    const fromCategory = tryGet(lx, ["category", "name"]);
    if (fromCategory) return fromCategory;
  }

  const companies =
    (Array.isArray(boot?.companiesResolved) ? boot.companiesResolved : null) ??
    (Array.isArray(boot?.companies) ? boot.companies : null);

  if (Array.isArray(companies) && companies.length) {
    const first = companies[0];
    const locs =
      (Array.isArray(first?.locationsResolved) ? first.locationsResolved : null) ??
      (Array.isArray(first?.locations) ? first.locations : null);
    if (Array.isArray(locs) && locs.length) {
      const loc = locs[0];
      const fromType = tryGet(loc, ["type", "name"]);
      if (fromType) return fromType;
      const fromActivity = tryGet(loc, ["activity", "name"]);
      if (fromActivity) return fromActivity;
    }
  }

  const fallbacks = [boot?.companyTypeName, boot?.locationTypeName, boot?.sectorName].filter(
    (x) => typeof x === "string" && x.trim()
  );
  if (fallbacks.length) return String(fallbacks[0]).trim();

  return null;
}

export default function ReviewsSettingsPanel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [availH, setAvailH] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<string>("preview");

  const boot = useBootstrapData();

  // ⚙️ companyId interno para el PUT (no visible)
  const [companyId, setCompanyId] = useState<string | null>(null);

  // 🏷️ sector visible en UI ("Tipo de negocio")
  const [sectorLabel, setSectorLabel] = useState<string>("");

  // 🔼 SETTINGS; sector se rellena desde boot
  const [settings, setSettings] = useState<ResponseSettings>({
    ...defaultResponseSettings,
    sector: "",
    standardSignature: "— Añade aquí tu firma desde configuración",
    treatment: "tu",
    tone: 3,
    emojiIntensity: 1,
    language: "es",
    autoDetectLanguage: true,
    ctaByRating: {
      "1-2": { channel: "web", contact: "", text: "" },
      "3": { channel: "web", contact: "", text: "" },
      "4-5": { channel: "web", contact: "", text: "" },
    },
    showCTAWhen: "below3",
    model: "gpt-4o",
    creativity: 0.6,
    maxCharacters: 300,
  });
  const [hasChanges, setHasChanges] = useState(false);

const onUpdate = (updates: Partial<ResponseSettings>) => {
  setSettings((prev) => ({ ...prev, ...updates }));
  setHasChanges(true);
};

  // Altura disponible
  useLayoutEffect(() => {
    const recalc = () => {
      const top = rootRef.current?.getBoundingClientRect().top ?? 0;
      setAvailH(Math.max(0, window.innerHeight - top - 8));
    };
    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("orientationchange", recalc);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("orientationchange", recalc);
    };
  }, []);

const MENU_ITEMS: MenuItem[] = [
  { label: "Preview", value: "preview", icon: Eye },
  { label: "General", value: "general", icon: SlidersHorizontal },
  { label: "Publicación", value: "publishing", icon: UserCheck },
  { label: "Reglas por estrellas", value: "stars", icon: Sparkles },
  { label: "Canales / CTA", value: "channels", icon: Globe },
  { label: "Políticas", value: "policies", icon: ShieldCheck },
  { label: "Idioma", value: "language", icon: Languages },
  { label: "Modelo (IA)", value: "model", icon: Cpu },
];

  const scrollTo = (id: string) => {
    const scroller = scrollRef.current;
    const target = document.getElementById(id);
    if (!scroller || !target) return;

    const scRect = scroller.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const delta = tRect.top - scRect.top;

    scroller.scrollTo({
      top: scroller.scrollTop + delta - 12,
      behavior: "smooth",
    });
  };

  // Sincroniza menú con sección visible (la más cercana al borde superior)
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const sections = Array.from(
      scroller.querySelectorAll<HTMLElement>('section[data-section="true"]')
    );
    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        let bestId: string | null = null;
        let bestDistance = Number.POSITIVE_INFINITY;
        const rootRect = scroller.getBoundingClientRect();

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const el = entry.target as HTMLElement;
          const rect = el.getBoundingClientRect();

          // Distancia desde el top de la sección al top del scroller
          const distanceTop = rect.top - rootRect.top;

          // Si el título ya ha pasado por arriba, lo ignoramos como candidato
          if (distanceTop < 0) continue;

          if (distanceTop < bestDistance) {
            bestDistance = distanceTop;
            bestId = el.id;
          }
        }

        if (bestId && bestId !== active) {
          setActive(bestId);
        }
      },
      {
        root: scroller,
        threshold: [0, 0.1],
        rootMargin: "0px 0px -60% 0px",
      }
    );

    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Inicializa companyId y sector desde boot
  useEffect(() => {
    if (!boot) return;

    setCompanyId(resolveCompanyIdFromBoot(boot) ?? null);

    const sector = resolveSectorFromBoot(boot) ?? "";
    if (sector && sector !== settings.sector) {
      setSettings((prev) => ({ ...prev, sector }));
    }
    setSectorLabel(sector);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boot]);

  async function handleSave() {
    try {
      setSaving(true);

      const cid = companyId?.trim();
      if (!cid) {
        console.error("companyId no resuelto desde boot");
        alert("No se detecta companyId. Revisa el bootstrap.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/responses/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ companyId: cid, config: settings }),
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json?.ok) {
        console.error("Save settings failed", { status: res.status, json });
        alert(
          json?.error === "validation_failed"
            ? "Validación fallida. Revisa el shape de settings (mira la consola para ver issues)."
            : json?.error || `Error guardando ajustes (${res.status}).`
        );
        setSaving(false);
        return;
      }

      if (json.settings) setSettings(json.settings);
      setHasChanges(false);
      setSaving(false);

    } catch (e) {
      console.error("Save settings exception", e);
      alert("No se pudo guardar (network/JS error). Revisa la consola.");
      setSaving(false);
    }
  }

  return (
    <div
      ref={rootRef}
      style={{ height: availH ? `${availH}px` : undefined }}
      className="relative overflow-hidden bg-white rounded-xl"
    >
      {/* Grid principal */}
      <div className="h-full min-h-0 w-full grid grid-cols-[220px_1px_1fr]">
        {/* Sidebar */}
        <aside className="h-full min-h-0 overflow-hidden">
          <div className="h-full min-h-0 flex flex-col">
            <div
              className="px-4 border-b flex items-center"
              style={{ height: SIDEBAR_HEADER_H }}
            >
              <div>
                <div className="text-sm font-semibold leading-none">Configuración</div>
                <div className="text-xs text-muted-foreground mt-1 leading-none">
                  Reseñas · Respuestas
                </div>
              </div>
            </div>

            <nav className="flex-1 min-h-0 overflow-y-auto py-2">
              {MENU_ITEMS.map(({ value, label, icon: Icon }) => {
                const isActive = active === value;
                return (
                  <button
                    key={value}
                    onClick={() => scrollTo(value)}
                    className={[
                      "w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors",
                      isActive
                        ? "text-primary bg-primary/5"
                        : "text-foreground/80 hover:bg-muted/60",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Divider */}
        <div className="h-full w-px bg-slate-200" />

        {/* Columna derecha */}
        <div className="h-full min-h-0 flex flex-col">
          {/* Header fijo (solo botón guardar) */}
          <Header
          settings={settings}
          onSave={handleSave}
          saving={saving}
          hasChanges={hasChanges}
        />


          {/* Scroller principal */}
          <main
            ref={scrollRef}
            className="rs-panel__scroller flex-1 min-h-0 overflow-y-auto"
            style={{
              scrollBehavior: "smooth",
              scrollPaddingTop: 16,
              paddingBottom: 12,
              overscrollBehavior: "contain",
            }}
          >
            {/* 🔹 Chips de resumen al inicio de la primera sección */}
            <div className="px-6 pt-4 pb-3 border-b border-slate-100 bg-background">
              <SettingsChips settings={settings} />
            </div>

            <PanelSections settings={settings} onUpdate={onUpdate} />
          </main>
        </div>
      </div>
    </div>
  );
}
