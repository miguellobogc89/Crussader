"use client";
import { useEffect, useState } from "react";
import { CompanyList } from "./components/CompanyList";
import type { CompanyRow } from "./components/CompanyRowItem";
import { LocationModal, type LocationForm } from "./components/LocationModal";
import CompanyModal, { type CompanyFormValues } from "./components/CompanyModal";

export default function CompanyPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [err, setErr] = useState("");

  // Company modal
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyModalMode, setCompanyModalMode] = useState<"create" | "edit">("create");
  const [companyInitial, setCompanyInitial] = useState<Partial<CompanyFormValues>>({});
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  // Location modal
  const [openLoc, setOpenLoc] = useState(false);
  const [locCompanyId, setLocCompanyId] = useState<string | null>(null);

  async function load() {
    setErr("");
    setLoadingList(true);
    try {
      const res = await fetch("/api/companies", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.ok) setCompanies(data.companies ?? []);
      else setErr(data?.error ?? "fetch_error");
    } catch { setErr("network_error"); }
    finally { setLoadingList(false); }
  }
  useEffect(() => { load(); }, []);

  // Abrir modales desde el listado
  function handleAddLocation(companyId: string) {
    setLocCompanyId(companyId);
    setOpenLoc(true);
  }
  function handleEditCompany(row: CompanyRow) {
    setEditingCompanyId(row.id);
    setCompanyInitial({
      name: row.name,
      // precargar más campos si los tienes en la API
    });
    setCompanyModalMode("edit");
    setCompanyModalOpen(true);
  }
  function handleAddUser(companyId: string) {
    alert(`Añadir usuario a empresa ${companyId}`);
  }
  async function handleDeleteCompany(companyId: string) {
    if (!confirm("¿Seguro que quieres borrar esta empresa? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/companies/${companyId}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok && data.ok) {
      setCompanies(prev => prev.filter(c => c.id !== companyId));
    } else {
      alert(data?.error ?? "delete_error");
    }
  }

  // Submit de LocationModal
  async function handleCreateLocation(values: LocationForm) {
    if (!locCompanyId) return;
    const res = await fetch(`/api/companies/${locCompanyId}/locations`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data?.error || "create_location_error");
  }

  // Submit de CompanyModal (create/edit)
  async function handleSaveCompany(values: CompanyFormValues) {
    if (companyModalMode === "create") {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          name: values.name,
          activity: values.activity,
          employeesBand: values.employeesBand,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.company) {
        setCompanies(prev => [
          {
            id: data.company.id,
            name: data.company.name,
            activity: data.company.activity ?? values.activity,
            employees: data.company.employeesBand ?? values.employeesBand,
          },
          ...prev,
        ]);
      } else {
        throw new Error(data?.error ?? "create_company_error");
      }
    } else {
      if (!editingCompanyId) return;
      const res = await fetch(`/api/companies/${editingCompanyId}`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          name: values.name,
          activity: values.activity,
          employeesBand: values.employeesBand,
          cif: values.cif,
          logoDataUrl: values.logoDataUrl,
          website: values.website,
          phone: values.phone,
          description: values.description,
          address: values.address,
          city: values.city,
          postalCode: values.postalCode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCompanies(prev =>
          prev.map(c =>
            c.id === editingCompanyId
              ? { ...c, name: values.name, activity: values.activity, employees: values.employeesBand }
              : c
          )
        );
      } else {
        throw new Error(data?.error ?? "update_company_error");
      }
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mi empresa</h1>
        <button
          onClick={() => { setCompanyModalMode("create"); setCompanyInitial({}); setCompanyModalOpen(true); }}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          Crear empresa
        </button>
      </div>

      {err && <div className="text-sm text-red-600">Error: {err}</div>}

      <CompanyList
        companies={companies}
        loading={loadingList}
        onAddLocation={handleAddLocation}
        onEditCompany={handleEditCompany}
        onAddUser={handleAddUser}
        onDeleteCompany={handleDeleteCompany}
      />

      <LocationModal
        open={openLoc}
        onClose={() => setOpenLoc(false)}
        onSubmit={handleCreateLocation}
      />

      <CompanyModal
        open={companyModalOpen}
        mode={companyModalMode}
        initial={companyInitial}
        onClose={() => setCompanyModalOpen(false)}
        onSubmit={handleSaveCompany}
      />
    </div>
  );
}
