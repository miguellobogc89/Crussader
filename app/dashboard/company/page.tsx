// app/dashboard/company/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Plus, Building2 } from "lucide-react";

import ListToolbar from "@/app/components/ListToolbar";
import SectionLayout from "@/app/components/layouts/SectionLayout";
import PreloadCompanyBuffer from "@/app/components/buffer/PreloadCompanyBuffer";

import {
  CompanyModal,
  type CompanyForm, // { name, email, phone, address, employeesBand }
} from "@/app/components/company/CompanyModal";

import CompanyKpiRow from "@/app/components/company/cards/CompanyKpiRow";
import { AddLocationsModal, type NewLocation } from "@/app/components/company/AddLocationsModal";
import { EstablishmentCard } from "@/app/components/company/EstablishmentCard";
import type { LocationRow } from "@/hooks/useCompanyLocations";
import { useCompanySummary } from "@/hooks/useCompanySummary";


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
  employeesBand?: string | null; // banda (p.e. 1-10, 11-50)
};

async function fetchCompanyDetails(companyId: string): Promise<CompanyDetails | null> {
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

export default function CompanyPage() {
  const router = useRouter();

  // estado principal
  const [loading, setLoading] = React.useState(true);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [companyName, setCompanyName] = React.useState("Empresa");
  const [details, setDetails] = React.useState<CompanyDetails | null>(null);

  // derive: hasCompany
  const hasCompany = !!companyId;

  // métricas (buffer / react query)
  const { data: metrics /*, isLoading: metricsLoading*/ } = useCompanySummary(companyId);

  // modal empresa (crear/editar)
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

  // modal añadir locations
  const [addOpen, setAddOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);

  // Nudge modal (bloqueante) si no hay empresa
  const [showNudge, setShowNudge] = React.useState(false);
  const openedOnceRef = React.useRef(false);

  // Carga inicial (lista + detalles)
  React.useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      const list = await fetchMyCompanies();
      if (abort) return;

      if (list.length > 0) {
        const c = list[0]; // si soportas multi-empresa, cambia selección
        setCompanyId(c.id);
        setCompanyName(c.name ?? "Empresa");

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

  // Abrir modal nudge cuando no hay empresa (solo una vez)
  React.useEffect(() => {
    if (!loading && !hasCompany && !openedOnceRef.current) {
      openedOnceRef.current = true;
      // pequeña pausa para evitar "pop" visual al hidratar
      const t = setTimeout(() => setShowNudge(true), 150);
      return () => clearTimeout(t);
    }
  }, [loading, hasCompany]);

  // cargar locations
  const loadLocations = React.useCallback(async () => {
    if (!companyId) return;
    setLocsLoading(true);
    setLocsError(null);
    try {
      const r = await fetch(`/api/companies/${companyId}/locations`, { cache: "no-store" });
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
    if (hasCompany && companyId) loadLocations();
  }, [hasCompany, companyId, loadLocations]);

  /* --------- acciones modal empresa --------- */

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
      if (!res.ok || !j?.company?.id) throw new Error(j?.error || `HTTP ${res.status}`);

      setCompanyModalOpen(false);
      // Navegamos a la vista de la empresa recién creada
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

  function handleConnect(locationId: string) {
    const returnTo = encodeURIComponent("/dashboard/company");
    window.location.href = `/api/connect/google-business/start?locationId=${encodeURIComponent(
      locationId
    )}&returnTo=${returnTo}`;
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

  async function onSubmitSingle(loc: NewLocation) {
    if (!companyId) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loc),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setAddOpen(false);
      await loadLocations();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setAdding(false);
    }
  }

  async function onSubmitBulk(locsInput: NewLocation[]) {
    if (!companyId) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: locsInput }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setAddOpen(false);
      await loadLocations();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setAdding(false);
    }
  }

  /* --------- formatos para cards --------- */

  const infoEmail = details?.email ?? "—";
  const infoPhone = details?.phone ?? "—";
  const infoAddress = details?.address ?? "—";
  const infoEmployees = details?.employeesBand ? `${details.employeesBand} empleados` : "—";

  /* ----------------------- render ----------------------- */

  return (
    <>
      {/* (Opcional) precarga de buffers para KPIs, etc. */}
      <PreloadCompanyBuffer companyId={companyId} />

      <SectionLayout
        icon={Building2}
        title={companyName}
        subtitle="Gestiona tu empresa y sus establecimientos"
        headerContent={
          <>
            {/* Acciones a la derecha del header */}
            <div className="flex items-center justify-end">
              {hasCompany && companyId ? (
                <Button variant="secondary" onClick={openEdit}>
                  Gestionar empresa
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <Plus size={16} className="mr-2" />
                  Crear empresa
                </Button>
              )}
            </div>

            {/* KPIs cuando existe empresa */}
            {hasCompany && (
              <div className="mt-4">
                <CompanyKpiRow
                  key={companyId ?? "none"}
                  companyId={companyId}
                  name={companyName}
                  email={infoEmail}
                  phone={infoPhone}
                  address={infoAddress}
                  employeesText={infoEmployees}
                />
              </div>
            )}
          </>
        }
      >
        {/* Vacío (sin empresa): mostramos un “hero card” limpio + CTA; el modal nudge se abre encima */}
        {!hasCompany ? (
          <div className="py-14">
            <div className="mx-auto max-w-2xl rounded-3xl border bg-card shadow-sm p-8 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-sky-500 text-white shadow-lg">
                <Building2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold">Aún no tienes ninguna empresa</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea tu empresa o solicita unirte a una existente para comenzar.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <Button onClick={openCreate}>
                  <Plus size={16} className="mr-2" />
                  Crear empresa
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard/company/join")}>
                  Solicitar unirme
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Establecimientos */}
            <section className="space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  {companyId && (
                    <Button onClick={() => setAddOpen(true)}>
                      <Plus size={16} className="mr-2" />
                      Añadir ubicación
                    </Button>
                  )}
                </div>

                <ListToolbar />
              </div>

              {locsError && <div className="text-sm text-red-600">{locsError}</div>}

              {locsLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 rounded border bg-gray-50 animate-pulse" />
                  ))}
                </div>
              ) : locs.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  No hay ubicaciones todavía.
                </div>
              ) : (
                <div className="grid gap-4">
                  {locs.map((loc) => (
                    <EstablishmentCard
                      key={loc.id}
                      location={loc}
                      onSync={() => handleSync(loc.id)}
                      onConnect={() => handleConnect(loc.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Modales */}
        <CompanyModal
          open={companyModalOpen}
          onOpenChange={setCompanyModalOpen}
          mode={hasCompany ? "edit" : "create"}
          values={form}
          onChange={modalChange}
          onSubmit={hasCompany ? onSubmitEdit : onSubmitCreate}
          submitting={submittingCompany}
        />

        <AddLocationsModal
          open={addOpen}
          onOpenChange={setAddOpen}
          onSubmitSingle={onSubmitSingle}
          onSubmitBulk={onSubmitBulk}
          submitting={adding}
        />
      </SectionLayout>

    </>
  );
}
