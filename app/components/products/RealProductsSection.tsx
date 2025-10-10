"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import {
  FaSyncAlt, FaExclamationTriangle, FaClock, FaPhone, FaRobot, FaUsers, FaMapMarkerAlt,
  FaInfoCircle, FaChevronDown, FaCheck,
} from "react-icons/fa";

type ApiAddon = {
  id: string;
  name: string;
  slug?: string;
  type: "SEAT" | "LOCATION" | "ADDON" | "USAGE" | "STANDALONE";
  monthlyPrice: { amountCents: number; currency: string; priceId: string } | null;
  meta?: any;
  perUnits?: number;
  minQty?: number;
};

type ApiProduct = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  type: "STANDALONE" | "ADDON" | "SEAT" | "USAGE" | "LOCATION";
  visibility: "PUBLIC" | "HIDDEN" | "INTERNAL";
  active: boolean;
  visible: boolean;
  trialDays: number;
  monthlyPrice: { amountCents: number; currency: string; priceId: string } | null;
  meta?: any;
  offer?: { label: string } | null;
  includes?: string[] | null;
  addons: ApiAddon[];
};

function centsToEUR(c?: number | null) {
  if (c == null) return null;
  return (c / 100).toFixed(2).replace(".", ",");
}
function pickIcon(slug?: string, type?: ApiProduct["type"]) {
  const s = (slug || "").toLowerCase();
  if (s.includes("pulse")) return FaClock; // Control de fichaje
  if (s.includes("resena") || s.includes("review")) return FaRobot;
  if (s.includes("agente") || s.includes("agent")) return FaPhone;
  if (type === "SEAT") return FaUsers;
  if (type === "LOCATION") return FaMapMarkerAlt;
  return FaInfoCircle;
}

function OfferRibbon({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <div className="absolute -top-2 -right-2 z-10">
      <div className="bg-gradient-to-r from-amber-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs shadow-lg">
        {label}
      </div>
    </div>
  );
}

function RealCard({ p }: { p: ApiProduct }) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(false);

  const Icon = pickIcon(p.slug, p.type);
  const price = centsToEUR(p.monthlyPrice?.amountCents);
  const seat = p.addons.find(a => a.type === "SEAT");
  const loc = p.addons.find(a => a.type === "LOCATION");

  const includeList: string[] = useMemo(() => {
    if (Array.isArray(p.includes) && p.includes.length) return p.includes!;
    if (Array.isArray(p.meta?.includes) && p.meta.includes.length) return p.meta.includes;
    if (Array.isArray(p.meta?.features) && p.meta.features.length) return p.meta.features;
    if ((p.slug || "").includes("pulse")) {
      return ["Fichaje móvil y web", "Geolocalización", "Exportación nóminas", "Reportes automáticos"];
    }
    if ((p.slug || "").includes("resenas")) {
      return ["Respuestas IA", "Análisis de sentimiento", "Plantillas", "Multilenguaje"];
    }
    return ["Soporte estándar", "Actualizaciones", "Integraciones básicas"];
  }, [p]);

  return (
    <>
      <Card
        className="relative overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-background to-muted/40 rounded-2xl shadow-sm hover:shadow-lg transition-all flex flex-col justify-between h-full"
      >
        <OfferRibbon label={p.offer?.label || p.meta?.offer?.label} />

        {/* HEADER */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{p.name}</CardTitle>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    {p.type === "STANDALONE" ? "Módulo" : "Add-on"}
                  </Badge>
                  {p.trialDays > 0 && (
                    <Badge className="rounded-full bg-emerald-100 text-emerald-800">
                      {p.trialDays} días de prueba
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {price && (
              <div className="text-right">
                <div className="text-2xl font-semibold leading-none">{price} €</div>
                <div className="text-xs text-muted-foreground">/ mes</div>
              </div>
            )}
          </div>

          <CardDescription className="text-sm leading-relaxed mt-3">
            {p.slug?.includes("pulse")
              ? "Control de fichaje: entradas/salidas, geo, reportes y exportación."
              : p.description || "Módulo de Crussader para potenciar tu negocio."}
          </CardDescription>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="flex flex-col justify-between flex-grow pt-0">
          <div className="flex flex-col gap-3 flex-grow">
            {/* Lista de ticks */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Incluye</div>
              <div className="grid grid-cols-1 gap-1">
                {includeList.slice(0, 6).map((txt, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <FaCheck className="h-3 w-3 text-emerald-500" />
                    <span>{txt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            {p.addons.length > 0 && (
              <div className="rounded-xl bg-muted/50 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">Add-ons</div>
                <div className="flex flex-wrap gap-2">
                  {seat && (
                    <Badge className="bg-indigo-100 text-indigo-800 rounded-full">
                      <FaUsers className="h-3 w-3 mr-1" />
                      Usuario: {centsToEUR(seat.monthlyPrice?.amountCents)} €/mes
                    </Badge>
                  )}
                  {loc && (
                    <Badge className="bg-sky-100 text-sky-800 rounded-full">
                      <FaMapMarkerAlt className="h-3 w-3 mr-1" />
                      Ubicación: {centsToEUR(loc.monthlyPrice?.amountCents)} €/mes
                    </Badge>
                  )}
                  {p.addons
                    .filter(a => a.type !== "SEAT" && a.type !== "LOCATION")
                    .map(a => (
                      <Badge key={a.id} className="bg-zinc-100 text-zinc-800 rounded-full">
                        {a.name}: {centsToEUR(a.monthlyPrice?.amountCents)} €/mes
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* BOTONES abajo */}
          <div className="mt-auto pt-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <Button className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Contratar
              </Button>
              <Button variant="outline" onClick={() => setDialog(true)}>
                <FaInfoCircle className="mr-2 h-4 w-4" /> Detalles
              </Button>
            </div>


          </div>
        </CardContent>

        {/* DIALOG */}
        <Dialog open={dialog} onOpenChange={setDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" /> {p.name}
              </DialogTitle>
              <DialogDescription>
                {p.description ||
                  (p.slug?.includes("pulse")
                    ? "Crussader Pulse: fichaje móvil, geo, reportes y exportación nóminas."
                    : "Ficha del producto.")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {p.trialDays > 0 && (
                    <Badge className="rounded-full bg-emerald-100 text-emerald-800">
                      {p.trialDays} días de prueba
                    </Badge>
                  )}
                  {(p.offer?.label || p.meta?.offer?.label) && (
                    <Badge className="rounded-full bg-amber-100 text-amber-800">
                      {p.offer?.label || p.meta?.offer?.label}
                    </Badge>
                  )}
                </div>
                {price && (
                  <div className="text-right">
                    <div className="text-3xl font-semibold">{price} €</div>
                    <div className="text-xs text-muted-foreground">/ mes</div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Incluye</div>
                <div className="flex flex-wrap gap-2">
                  {includeList.map((txt, i) => (
                    <Badge key={i} variant="outline" className="rounded-full">
                      {txt}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </>
  );
}


export default function RealProductsSection() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<ApiProduct[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch("/api/products?scope=all", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const raw: ApiProduct[] = (data.items || []).map((p: any) => ({
          ...p,
          meta: p.meta ?? {},
          includes: p.includes ?? p.meta?.includes ?? null,
          offer: p.offer ?? p.meta?.offer ?? null,
          addons: Array.isArray(p.addons) ? p.addons : [],
        }));
        // base primero
        raw.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "STANDALONE" ? -1 : 1));
        setItems(raw);
      } catch (e: any) {
        setErr(e?.message || "Error al cargar productos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const count = items.length;

  if (loading) {
    return <div className="text-sm text-muted-foreground flex items-center gap-2">
      <FaSyncAlt className="animate-spin" /> Cargando productos reales…
    </div>;
  }
  if (err) {
    return <div className="text-sm text-red-600 flex items-center gap-2">
      <FaExclamationTriangle /> {err}
    </div>;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">Productos disponibles: {count}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((p) => (
          <RealCard key={p.id} p={p} />
        ))}
        {items.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No hay productos para mostrar</CardTitle>
              <CardDescription>Comprueba permisos o datos en /api/products.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
