"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import {
  FaCheck, FaUsers, FaMapMarkerAlt, FaCog, FaStar,FaClock, FaChevronDown, FaInfoCircle,
} from "react-icons/fa";
import clsx from "clsx";

export type ApiAddon = {
  id: string;
  name: string;
  slug?: string;
  type: "SEAT" | "LOCATION" | "ADDON" | "USAGE" | "STANDALONE";
  monthlyPrice: { amountCents: number; currency: string; priceId: string } | null;
  meta?: any;
  perUnits?: number;
  minQty?: number;
};

export type ApiProduct = {
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

function centsToEUR(cents?: number | null) {
  if (cents == null) return null;
  return (cents / 100).toFixed(2).replace(".", ",");
}

function pickIcon(p: ApiProduct) {
  const slug = (p.slug || "").toLowerCase();
  if (slug.includes("pulse")) return FaClock;              // control de fichaje
  if (slug.includes("resena") || slug.includes("review")) return FaCheck;
  if (slug.includes("agente") || slug.includes("agent")) return FaCog;
  return FaStar;
}

function ribbon(offer?: { label: string } | null) {
  if (!offer) return null;
  return (
    <div className="absolute -top-2 -right-2 z-10">
      <div className="bg-gradient-to-r from-amber-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs shadow-lg">
        {offer.label}
      </div>
    </div>
  );
}

export default function ProductTile({
  product,
  contracted = false,
}: {
  product: ApiProduct;
  contracted?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const Icon = pickIcon(product);

  const monthly = useMemo(() => product.monthlyPrice, [product.monthlyPrice]);
  const priceStr = centsToEUR(monthly?.amountCents);
  const trial = product.trialDays;

  const hasAddons = product.addons && product.addons.length > 0;
  const seat = product.addons.find(a => a.type === "SEAT");
  const location = product.addons.find(a => a.type === "LOCATION");

  return (
    <>
      <Card className={clsx(
        "relative overflow-hidden border-0",
        "bg-gradient-to-br from-white to-muted/50 dark:from-background dark:to-muted/30",
        "shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl"
      )}>
        {ribbon(product.offer)}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{product.name}</CardTitle>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    {product.type === "STANDALONE" ? "Módulo" : "Add-on"}
                  </Badge>
                  {trial > 0 && (
                    <Badge className="rounded-full bg-emerald-100 text-emerald-800">
                      {trial} días de prueba
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {priceStr && (
              <div className="text-right">
                <div className="text-2xl font-semibold leading-none">{priceStr} €</div>
                <div className="text-xs text-muted-foreground">/ mes</div>
              </div>
            )}
          </div>
          <CardDescription className="text-sm leading-relaxed mt-3">
            {product.description || "Capacidades para potenciar tu negocio con Crussader."}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Incluye */}
          {(product.includes?.length ?? 0) > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">Incluye</div>
              <div className="grid grid-cols-1 gap-1">
                {product.includes!.slice(0, 6).map((it, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <FaCheck className="h-3 w-3 text-emerald-500" />
                    <span>{it}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons resumidos */}
          {hasAddons && (
            <div className="mb-3 rounded-lg bg-muted/50 p-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">Add-ons</div>
              <div className="flex flex-wrap gap-3">
                {seat && (
                  <Badge className="bg-indigo-100 text-indigo-800 rounded-full">
                    <FaUsers className="h-3 w-3 mr-1" />
                    Usuario: {centsToEUR(seat.monthlyPrice?.amountCents)} €/mes
                  </Badge>
                )}
                {location && (
                  <Badge className="bg-sky-100 text-sky-800 rounded-full">
                    <FaMapMarkerAlt className="h-3 w-3 mr-1" />
                    Ubicación: {centsToEUR(location.monthlyPrice?.amountCents)} €/mes
                  </Badge>
                )}
                {product.addons
                  .filter(a => a.type !== "SEAT" && a.type !== "LOCATION")
                  .slice(0, 4)
                  .map(a => (
                    <Badge key={a.id} className="bg-zinc-100 text-zinc-800 rounded-full">
                      {a.name}: {centsToEUR(a.monthlyPrice?.amountCents)} €/mes
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90">
              {contracted ? "Configurar" : "Contratar"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <FaInfoCircle className="mr-2 h-4 w-4" />
              Detalles
            </Button>
            <Collapsible open={open} onOpenChange={setOpen} className="flex-1">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <FaChevronDown className={clsx("mr-2 h-4 w-4 transition-transform", open && "rotate-180")} />
                  Más info
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Separator className="my-3" />
                <div className="text-sm space-y-2">
                  <div className="text-muted-foreground">
                    {product.description ||
                      "Información detallada del módulo. Optimiza tus operaciones con las capacidades de Crussader."}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Características</div>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {(product.meta?.features ?? ["Soporte estándar", "Actualizaciones", "Integraciones"]).map(
                          (f: string, idx: number) => <li key={idx}>{f}</li>
                        )}
                      </ul>
                    </div>
                    {hasAddons && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Add-ons disponibles</div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {product.addons.map(a => (
                            <li key={a.id}>
                              {a.name} — {centsToEUR(a.monthlyPrice?.amountCents)} €/mes
                              {a.minQty ? ` · mín. ${a.minQty}` : ""}
                              {a.perUnits ? ` · ${a.perUnits} por unidad` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Modal con ficha completa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              {product.name}
            </DialogTitle>
            <DialogDescription>
              {product.description || "Ficha del producto"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  {product.type === "STANDALONE" ? "Módulo" : "Add-on"}
                </Badge>
                {trial > 0 && (
                  <Badge className="rounded-full bg-emerald-100 text-emerald-800">
                    {trial} días de prueba
                  </Badge>
                )}
                {product.offer?.label && (
                  <Badge className="rounded-full bg-amber-100 text-amber-800">
                    {product.offer.label}
                  </Badge>
                )}
              </div>
              {priceStr && (
                <div className="text-right">
                  <div className="text-3xl font-semibold">{priceStr} €</div>
                  <div className="text-xs text-muted-foreground">/ mes</div>
                </div>
              )}
            </div>

            {(product.includes?.length ?? 0) > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Incluye</div>
                <div className="flex flex-wrap gap-2">
                  {product.includes!.map((it, i) => (
                    <Badge key={i} variant="outline" className="rounded-full">{it}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Descripción</div>
                <p className="text-sm leading-relaxed">
                  {product.description ||
                    "Mejora la productividad y el control operativo con las soluciones de Crussader."}
                </p>
              </div>
              {hasAddons && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Add-ons y precios</div>
                  <div className="space-y-2">
                    {product.addons.map(a => (
                      <div key={a.id} className="flex items-center justify-between rounded-md border p-2">
                        <div className="text-sm">
                          <div className="font-medium">{a.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.type === "SEAT" ? "Usuario" : a.type === "LOCATION" ? "Ubicación" : "Add-on"}
                            {a.minQty ? ` · mínimo ${a.minQty}` : ""}
                            {a.perUnits ? ` · ${a.perUnits} por unidad` : ""}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {centsToEUR(a.monthlyPrice?.amountCents)} €/mes
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline">Probar</Button>
              <Button>Contratar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
