"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { FaCheck, FaPlus, FaCalendarAlt, FaCreditCard, FaSyncAlt, FaExclamationTriangle } from "react-icons/fa";
import ProductTile, { type ApiProduct } from "@/app/components/products/ProductTile";
import RealProductsSection from "@/app/components/products/RealProductsSection";

/* ---------- Mock (vacío por defecto). Si quieres mockups, mételos aquí ---------- */
type ProductMock = {
  id: string;
  name: string;
  description?: string;
  isContracted: boolean;
  price?: number;
  features?: string[];
  trialDaysLeft?: number;
};

const mockProducts: ProductMock[] = []; // <-- añade tus mockups si los necesitas

export default function ProductsPage() {
  const [selectedTab, setSelectedTab] = useState<"contracted" | "available" | "real">("real");

  // mock
  const contractedProducts = mockProducts.filter((p: ProductMock) => p.isContracted);
  const availableProducts = mockProducts.filter((p: ProductMock) => !p.isContracted);

  // reales
  const [realLoading, setRealLoading] = useState(false);
  const [realError, setRealError] = useState<string | null>(null);
  const [realItems, setRealItems] = useState<ApiProduct[]>([]);
  const [realFetched, setRealFetched] = useState(false);

  useEffect(() => {
    if (selectedTab !== "real" || realFetched) return;
    (async () => {
      try {
        setRealLoading(true);
        setRealError(null);
        const res = await fetch("/api/products?scope=all", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items: ApiProduct[] = (data.items || []).map((p: any) => ({
          ...p,
          meta: p.meta ?? {},
          includes: p.includes ?? p.meta?.includes ?? null,
          offer: p.offer ?? p.meta?.offer ?? null,
          addons: Array.isArray(p.addons) ? p.addons : [],
        }));
        // ordena módulos base primero
        items.sort((a: ApiProduct, b: ApiProduct) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === "STANDALONE" ? -1 : 1;
        });
        setRealItems(items);
        setRealFetched(true);
      } catch (e: any) {
        setRealError(e?.message || "Error al cargar productos");
      } finally {
        setRealLoading(false);
      }
    })();
  }, [selectedTab, realFetched]);

  const realCount = useMemo(() => realItems.length, [realItems]);

  return (
    <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
      <PageShell
        title="Productos"
        description="Gestiona tus módulos contratados y descubre nuevas capacidades para tu negocio."
        toolbar={
          <div className="flex justify-between items-center gap-4">
            <TabsList className="grid w-auto grid-cols-3">
              <TabsTrigger value="contracted" className="flex items-center gap-2">
                <FaCheck className="h-4 w-4" />
                Mis Productos ({contractedProducts.length})
              </TabsTrigger>
              <TabsTrigger value="available" className="flex items-center gap-2">
                <FaPlus className="h-4 w-4" />
                Disponibles ({availableProducts.length})
              </TabsTrigger>
              {/* NUEVO */}
              <TabsTrigger value="real" className="flex items-center gap-2">
                <FaSyncAlt className="h-4 w-4" />
                Reales
              </TabsTrigger>
            </TabsList>


            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FaCalendarAlt className="h-4 w-4 mr-2" />
                Historial
              </Button>
              <Button variant="outline" size="sm">
                <FaCreditCard className="h-4 w-4 mr-2" />
                Facturación
              </Button>
            </div>
          </div>
        }
        variant="default"
      >
        <div className="space-y-6">
          {/* TAB 1: Mock contratados */}
          <TabsContent value="contracted" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {contractedProducts.map((p: ProductMock) => (
                <ProductTile
                  key={p.id}
                  contracted
                  product={{
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    type: "STANDALONE",
                    visibility: "PUBLIC",
                    active: true,
                    visible: true,
                    trialDays: p.trialDaysLeft ?? 0,
                    monthlyPrice: p.price != null ? { amountCents: Math.round(p.price * 100), currency: "EUR", priceId: "mock" } : null,
                    meta: { features: p.features ?? [] },
                    offer: null,
                    includes: null,
                    addons: [],
                  }}
                />
              ))}
            </div>
          </TabsContent>

          {/* TAB 2: Mock disponibles */}
          <TabsContent value="available" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {availableProducts.map((p: ProductMock) => (
                <ProductTile
                  key={p.id}
                  product={{
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    type: "STANDALONE",
                    visibility: "PUBLIC",
                    active: true,
                    visible: true,
                    trialDays: 0,
                    monthlyPrice: p.price != null ? { amountCents: Math.round(p.price * 100), currency: "EUR", priceId: "mock" } : null,
                    meta: { features: p.features ?? [] },
                    offer: null,
                    includes: null,
                    addons: [],
                  }}
                />
              ))}
            </div>
          </TabsContent>

          {/* NUEVO: pestaña reales */}
          <TabsContent value="real" className="space-y-6">
            <RealProductsSection />
          </TabsContent>

        </div>
      </PageShell>
    </Tabs>
  );
}
