// app/dashboard/home/HomeLocationsCard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { MapPin, Star, Loader2, Building2, Store } from "lucide-react";

type Location = {
  id: string;
  title: string;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  country: string | null;
  featuredImageUrl: string | null;
  status: string | null;
  reviewsAvg: number | null;
  reviewsCount: number;
  pendingResponses: number;
};

export default function HomeLocationsCard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompany() {
      try {
        const res = await fetch("/api/companies/active-company", { cache: "no-store" });
        const json = await res.json();
        if (json?.ok && json.activeCompany?.id) {
          setCompanyId(json.activeCompany.id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("[HomeLocationsCard] active company load error:", e);
        setError(true);
        setLoading(false);
      }
    }
    loadCompany();
  }, []);

  useEffect(() => {
    if (!companyId) return;
    async function loadLocations() {
      try {
        setLoading(true);
        const res = await fetch(`/api/locations?companyId=${companyId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (json.ok) {
          setLocations(json.locations || []);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error("[HomeLocationsCard] locations load error:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadLocations();
  }, [companyId]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Ubicaciones activas</CardTitle>
          </div>

          {loading && (
            <Badge className="flex items-center gap-1 bg-muted text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
            </Badge>
          )}

          {!loading && !error && (
            <Badge variant="outline">{locations.length}</Badge>
          )}
        </div>

        <CardDescription>
          Tus establecimientos conectados con rating y reseñas en tiempo real.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading && (
          <p className="text-sm text-muted-foreground">
            Cargando ubicaciones…
          </p>
        )}

        {!loading && error && (
          <p className="text-sm text-destructive">
            Error al cargar ubicaciones.
          </p>
        )}

        {!loading && !error && locations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay ubicaciones activas en esta empresa.
          </p>
        )}

        {!loading &&
          !error &&
          locations.map((loc) => {
            const hasRating = loc.reviewsAvg !== null;
            const rating =
              loc.reviewsAvg !== null
                ? loc.reviewsAvg.toFixed(1)
                : "-";

            const addressLine =
              loc.address || loc.city || loc.country
                ? [
                    loc.address,
                    loc.postalCode,
                    loc.city,
                    loc.country,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : "Dirección no configurada";

            return (
              <div
                key={loc.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {loc.featuredImageUrl ? (
                    <img
                      src={loc.featuredImageUrl}
                      alt={loc.title}
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium leading-none">
                      {loc.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {addressLine}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="flex items-center justify-end gap-1">
                    <Star
                      className={`h-3 w-3 ${
                        hasRating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm font-semibold">
                      {rating}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {loc.reviewsCount} reseñas
                    {loc.pendingResponses > 0 &&
                      ` · ${loc.pendingResponses} sin responder`}
                  </p>
                </div>
              </div>
            );
          })}
        <div className="flex justify-end">
          <Link href="/dashboard/mybusiness">
            <Button className="bg-gradient-to-r from-violet-400 to-violet-500 hover:from-violet-700 hover:to-violet-800 shadow-md">
              <Store className="h-4 w-4 mr-2" /> Gestionar ubicaciones
            </Button>
          </Link>
        </div>

      </CardContent>
    </Card>
  );
}
