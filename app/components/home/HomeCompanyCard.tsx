// app/dashboard/home/HomeCompanyCard.tsx
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
import { Building2, MapPin, Globe, Star, Loader2 } from "lucide-react";

type ActiveCompanyResponse = {
  ok: boolean;
  activeCompany: {
    id: string;
    name: string;
    logoUrl: string | null;
    plan: string | null;
    city: string | null;
    country: string | null;
    website: string | null;
    brandColor: string | null;
    locationsCount: number;
    totalReviews: number;
    avgRating: number | null;
    lastSyncAt: string | null;
  } | null;
};

export default function HomeCompanyCard() {
  const [data, setData] = useState<ActiveCompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/companies/active-company", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as ActiveCompanyResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[HomeCompanyCard] error:", e);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const company = data?.activeCompany ?? null;

  function formatLastSync(iso: string | null): string {
    if (!iso) return "Sincronización pendiente";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Sincronización pendiente";
    return `Última sync: ${d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    })}`;
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Datos de la empresa</CardTitle>
          </div>

          {loading && (
            <Badge className="flex items-center gap-1 bg-muted text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando
            </Badge>
          )}

          {!loading && loadError && (
            <Badge className="bg-destructive/10 text-destructive">
              Error
            </Badge>
          )}

          {!loading && !loadError && !company && (
            <Badge className="bg-slate-200 text-slate-700">
              Sin empresa activa
            </Badge>
          )}

          {!loading && !loadError && company && (
            <Badge variant="outline">
              {company.plan ? `Plan ${company.plan}` : "Plan sin definir"}
            </Badge>
          )}
        </div>

        {!loading && !loadError && company && (
          <CardDescription>
            {company.name}
            {company.city && ` · ${company.city}`}
            {company.country && `, ${company.country}`}
          </CardDescription>
        )}

        {!loading && !loadError && !company && (
          <CardDescription>
            Vincula una empresa para ver aquí su resumen de actividad.
          </CardDescription>
        )}

        {!loading && loadError && (
          <CardDescription>
            No se ha podido cargar la información de la empresa activa.
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!loading && !loadError && company && (
          <>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">
                  Ubicaciones
                </p>
                <p className="font-semibold">
                  {company.locationsCount ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Reseñas totales
                </p>
                <p className="font-semibold">
                  {company.totalReviews ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Valoración media
                </p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <p className="font-semibold">
                    {company.avgRating
                      ? company.avgRating.toFixed(1)
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>
                  {company.city || company.country
                    ? `${company.city || ""}${
                        company.city && company.country ? ", " : ""
                      }${company.country || ""}`
                    : "Ubicación no configurada"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                {company.website ? (
                  <a
                    href={
                      company.website.startsWith("http")
                        ? company.website
                        : `https://${company.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    Web
                  </a>
                ) : (
                  <span>Sin web</span>
                )}
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              {formatLastSync(company.lastSyncAt as any)}
            </p>
          </>
        )}

        <div className="flex justify-between items-center border-t pt-4 gap-3">
          <p className="text-xs text-muted-foreground">
            Gestiona la ficha, branding y conexiones desde el panel de empresa.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/company">
              Ver detalles
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
