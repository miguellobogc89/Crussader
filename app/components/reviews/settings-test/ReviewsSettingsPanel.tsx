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
    standardSignature: "— Equipo Heladería Brumazul", // corregiremos la duplicidad en el siguiente paso
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

  const onUpdate = (updates: Partial<ResponseSettings>) =>
    setSettings((prev) => ({ ...prev, ...updates }));

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
    { label: "Idioma", value: "language", icon: Languages },
    { label: "Reglas por estrellas", value: "stars", icon: Sparkles },
    { label: "Canales / CTA", value: "channels", icon: Globe },
    { label: "Políticas", value: "policies", icon: ShieldCheck },
    { label: "Publicación", value: "publishing", icon: UserCheck },
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

  // Sincroniza menú con sección visible
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const sections = Array.from(
      scroller.querySelectorAll<HTMLElement>('section[data-section="true"]')
    );
    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        let best: { id: string; score: number } | null = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          const root = scroller.getBoundingClientRect();
          const centerDist = Math.abs(
            (rect.top + rect.height / 2) - (root.top + root.height / 2)
          );
          const score = 1 / (1 + centerDist);
          const id = (e.target as HTMLElement).id;
          if (!best || score > best.score) best = { id, score };
        }
        if (best && best.id && best.id !== active) setActive(best.id);
      },
      { root: scroller, rootMargin: "-10% 0% -10% 0%", threshold: [0.1, 0.25, 0.5, 0.75] }
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
      className="relative overflow-hidden bg-white border rounded-xl"
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
          {/* Header fijo */}
          <Header settings={settings} onSave={handleSave} saving={saving} />

          {/* 🔎 Info bar visible: Tipo de negocio (sector) */}
          <div className="px-4 py-2 text-xs border-b bg-muted/30">
            <span className="text-foreground font-medium">Tipo de negocio:</span>{" "}
            <span className="text-muted-foreground">
              {sectorLabel && sectorLabel.length > 0 ? sectorLabel : "—"}
            </span>
          </div>

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
            <PanelSections settings={settings} onUpdate={onUpdate} />
          </main>
        </div>
      </div>
    </div>
  );
}
