// app/dashboard/company/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Plus, Building2, Pencil } from "lucide-react";

import PageShell from "@/app/components/layouts/PageShell";
import PreloadCompanyBuffer from "@/app/components/buffer/PreloadCompanyBuffer";
import GoogleBusinessConnectBanner from "@/app/components/mybusiness/GoogleBusinessConnectBanner";

import {
  CompanyModal,
  type CompanyForm, // { name, email, phone, address, employeesBand }
} from "@/app/components/company/CompanyModal";

import CompanyKpiRow from "@/app/components/company/cards/CompanyKpiRow";
import { useCompanySummary } from "@/hooks/useCompanySummary";
import { CompanyEstablishments } from "@/app/components/company/CompanyEstablishments";

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

export default function CompanyPage() {
  const router = useRouter();

  // estado principal
  const [loading, setLoading] = React.useState(true);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [companyName, setCompanyName] = React.useState("Empresa");
  const [details, setDetails] = React.useState<CompanyDetails | null>(null);

  const hasCompany = !!companyId;

  // métricas (buffer / react query)
  useCompanySummary(companyId); // precalienta datos para CompanyKpiRow, etc.

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

  // Nudge modal (solo si no hay empresa)
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
        const c = list[0]; // si soportas multi-empresa, aquí iría la selección
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

  // Abrir modal nudge cuando no hay empresa
  React.useEffect(() => {
    if (!loading && !hasCompany && !openedOnceRef.current) {
      openedOnceRef.current = true;
      const t = setTimeout(() => setShowNudge(true), 150);
      return () => clearTimeout(t);
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
      // tras crear, navegamos a la vista detallada de la empresa
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

  /* --------- formatos para cards --------- */

  const infoEmail = details?.email ?? "—";
  const infoPhone = details?.phone ?? "—";
  const infoAddress = details?.address ?? "—";
  const infoEmployees = details?.employeesBand
    ? `${details.employeesBand} empleados`
    : "—";

  /* ----------------------- render ----------------------- */

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
        {/* Banner GBP arriba del body */}
        <div className="mb-4">
          <GoogleBusinessConnectBanner companyId={companyId} />
        </div>

        {/* Estado sin empresa */}
        {!hasCompany ? (
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
        ) : (
          <>
            {/* KPIs de empresa */}
            <div className="mb-6">
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

            {/* Listado de ubicaciones (autónomo) */}
            <CompanyEstablishments companyId={companyId} />
          </>
        )}

        {/* Modal empresa (crear / editar) */}
        <CompanyModal
          open={companyModalOpen || showNudge}
          onOpenChange={(open) => {
            setCompanyModalOpen(open);
            if (!open) setShowNudge(false);
          }}
          mode={hasCompany ? "edit" : "create"}
          values={form}
          onChange={modalChange}
          onSubmit={hasCompany ? onSubmitEdit : onSubmitCreate}
          submitting={submittingCompany}
        />
      </PageShell>
    </>
  );
}
