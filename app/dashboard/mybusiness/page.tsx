"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Plus, Building2, Pencil } from "lucide-react";
import GoogleBusinessConnectBanner from "@/app/components/mybusiness/GoogleBusinessConnectBanner";
import PageShell from "@/app/components/layouts/PageShell";
import PreloadCompanyBuffer from "@/app/components/buffer/PreloadCompanyBuffer";

import {
  CompanyModal,
  type CompanyForm,
} from "@/app/components/company/CompanyModal";

import { LocationCard } from "@/app/components/mybusiness/locations/LocationCard";
import type { LocationRow } from "@/hooks/useCompanyLocations";
import LinkGbpLocationModal from "@/app/components/mybusiness/locations/LinkGbpLocationModal";

/* ----------------------- helpers (fetchers) ----------------------- */

type CompanyRow = { id: string; name: string; role: string; createdAt: string };

async function fetchMyCompanies(): Promise<CompanyRow[]> {
  const r = await fetch("/api/companies", { cache: "no-store" });
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j?.companies) ? j.companies : [];
}

type CompanyDetails = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  employeesBand?: string | null;
};

async function fetchCompanyDetails(
  companyId: string,
): Promise<CompanyDetails | null> {
  try {
    const r = await fetch(`/api/companies/${companyId}`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.company ?? null;
  } catch {
    return null;
  }
}

/* ----------------------- page ----------------------- */

export default function MyBusinessPage() {
  const router = useRouter();

  // ----- estado empresa -----
  const [loading, setLoading] = React.useState(true);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [companyName, setCompanyName] = React.useState("Mi empresa");
  const [details, setDetails] = React.useState<CompanyDetails | null>(null);
  const hasCompany = !!companyId;

  // modal empresa
  const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
  const [submittingCompany, setSubmittingCompany] = React.useState(false);
  const [form, setForm] = React.useState<CompanyForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    employeesBand: "",
  });
  function modalChange(patch: Partial<CompanyForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  // locations
  const [locs, setLocs] = React.useState<LocationRow[]>([]);
  const [locsLoading, setLocsLoading] = React.useState(false);
  const [locsError, setLocsError] = React.useState<string | null>(null);

  // auto-open modal create una sola vez si no hay empresa
  const openedOnceRef = React.useRef(false);

  // vincular Google Location -> solo guardamos la location actual
  const [linkLocationId, setLinkLocationId] = React.useState<string | null>(null);

  // Carga inicial: primera empresa + detalles
  React.useEffect(() => {
    let abort = false;

    (async () => {
      setLoading(true);
      const list = await fetchMyCompanies();
      if (abort) return;

      if (list.length > 0) {
        const c = list[0];
        setCompanyId(c.id);
        setCompanyName(c.name ?? "Mi empresa");

        const d = await fetchCompanyDetails(c.id);
        if (abort) return;
        setDetails(d ?? null);
      } else {
        setCompanyId(null);
        setCompanyName("Tu empresa");
      }

      setLoading(false);
    })();

    return () => {
      abort = true;
    };
  }, []);

  // Cargar locations cuando ya sabemos la company
  const loadLocations = React.useCallback(async () => {
    if (!companyId) return;
    setLocsLoading(true);
    setLocsError(null);
    try {
      const r = await fetch(`/api/companies/${companyId}/locations`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setLocs(Array.isArray(j?.locations) ? j.locations : []);
    } catch (e: any) {
      setLocsError(e?.message || String(e));
    } finally {
      setLocsLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    if (hasCompany && companyId) {
      loadLocations();
    }
  }, [hasCompany, companyId, loadLocations]);

  // Auto-abrir modal de crear empresa una vez cuando no hay company
  React.useEffect(() => {
    if (!loading && !hasCompany && !openedOnceRef.current) {
      openedOnceRef.current = true;
      setCompanyModalOpen(true);
    }
  }, [loading, hasCompany]);

  /* --------- acciones empresa --------- */

  function openCreate() {
    setForm({ name: "", email: "", phone: "", address: "", employeesBand: "" });
    setCompanyModalOpen(true);
  }

  function openEdit() {
    setForm({
      name: details?.name ?? companyName ?? "",
      email: details?.email ?? "",
      phone: details?.phone ?? "",
      address: details?.address ?? "",
      employeesBand: details?.employeesBand ?? "",
    });
    setCompanyModalOpen(true);
  }

  async function onSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmittingCompany(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim() }),
      });
      const j = await res.json();
      if (!res.ok || !j?.company?.id)
        throw new Error(j?.error || `HTTP ${res.status}`);

      setCompanyModalOpen(false);
      router.push(`/dashboard/company/${j.company.id}`);
    } catch (err: any) {
      alert(err?.message || String(err));
    } finally {
      setSubmittingCompany(false);
    }
  }

  async function onSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setSubmittingCompany(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        employeesBand: form.employeesBand || null,
      };
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      setCompanyModalOpen(false);
      setDetails(j.company);
      if (j.company?.name) setCompanyName(j.company.name);
    } catch (err: any) {
      alert(err?.message || String(err));
    } finally {
      setSubmittingCompany(false);
    }
  }

  /* --------- acciones locations --------- */

  function handleConnect(location: LocationRow) {
    const id = (location as any).id ?? null;
    if (!id) return;
    setLinkLocationId(id);
  }

  async function handleDisconnect(location: LocationRow) {
    const id = (location as any).id;
    if (!id) return;

    try {
      const res = await fetch(
        `/api/mybusiness/locations/${id}/unlink-google`,
        { method: "POST" },
      );

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        alert(json?.error || `Error al desvincular (${res.status})`);
      } else {
        await loadLocations();
      }
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  async function handleSync(locationId: string) {
    try {
      const res = await fetch(`/api/locations/${locationId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "manual" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || `Sync falló (${res.status})`);
        return;
      }
      await loadLocations();
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  /* ----------------------- render ----------------------- */

  const showEmptyState = !loading && !hasCompany;

  return (
    <>
      <PreloadCompanyBuffer companyId={companyId} />

      <PageShell
        title={companyName}
        titleIconName="Building2"
        description="Gestiona los datos de tu empresa y las ubicaciones conectadas."
        toolbar={
          hasCompany ? (
            <Button
              variant="outline"
              size="sm"
              onClick={openEdit}
              className="inline-flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              <span>Editar empresa</span>
            </Button>
          ) : undefined
        }
        isLoading={loading}
      >
        {/* banner en el BODY, arriba del todo */}
        <div className="mb-4">
          <GoogleBusinessConnectBanner companyId={companyId} />
        </div>

        {/* ── SIN EMPRESA ────────────────────────────── */}
        {showEmptyState && (
          <div className="py-14">
            <div className="mx-auto max-w-2xl rounded-3xl border bg-card shadow-sm p-8 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-sky-500 text-white shadow-lg">
                <Building2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold">
                Aún no tienes ninguna empresa
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea tu empresa o solicita unirte a una existente para empezar a
                trabajar con Crussader.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <Button onClick={openCreate}>
                  <Plus size={16} className="mr-2" />
                  Crear empresa
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/company/join")}
                >
                  Solicitar unirme
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── CON EMPRESA ─────────────────────────────── */}
        {hasCompany && (
          <section className="mt-6 space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Ubicaciones vinculadas a tu empresa
            </div>

            {locsError && (
              <div className="text-sm text-red-600">{locsError}</div>
            )}

            {locsLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl border bg-muted/40 animate-pulse"
                  />
                ))}
              </div>
            ) : locs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No hay ubicaciones todavía. Crea tu primera ubicación desde el
                flujo guiado.
              </div>
            ) : (
              <div className="grid gap-4">
                {locs.map((loc) => (
                  <LocationCard
                    key={(loc as any).id}
                    location={loc}
                    onSync={() => handleSync((loc as any).id)}
                    onConnect={() => handleConnect(loc)}
                    onDisconnect={() => handleDisconnect(loc)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── MODALES ─────────────────────────────────── */}
        <CompanyModal
          open={companyModalOpen}
          onOpenChange={setCompanyModalOpen}
          mode={hasCompany ? "edit" : "create"}
          values={form}
          onChange={modalChange}
          onSubmit={hasCompany ? onSubmitEdit : onSubmitCreate}
          submitting={submittingCompany}
        />

        <LinkGbpLocationModal
          open={!!linkLocationId}
          locationId={linkLocationId ?? ""}
          onClose={() => setLinkLocationId(null)}
          onCompanyResolved={(cid) => {
            // Solo para debug por ahora, sin lógica extra en la page
            console.log("CompanyId resuelto en modal:", cid);
          }}
          onLinked={async () => {
            // refrescamos las locations de la empresa al terminar de vincular
            await loadLocations();
          }}
        />

      </PageShell>
    </>
  );
}
