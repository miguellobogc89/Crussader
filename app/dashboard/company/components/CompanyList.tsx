"use client";
import { CompanyRowItem, CompanyRow } from "./CompanyRowItem";

export function CompanyList({
  companies,
  loading,
  onAddLocation,
  onEditCompany,
  onAddUser,
  onDeleteCompany,
}: {
  companies: CompanyRow[];
  loading: boolean;
  onAddLocation: (companyId: string) => void;
  onEditCompany: (row: CompanyRow) => void;
  onAddUser: (companyId: string) => void;
  onDeleteCompany: (companyId: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold">Mi empresa</h3>
        {loading && <span className="text-xs text-gray-500">Cargando…</span>}
      </div>
      <div className="divide-y">
        {companies.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Sin empresas</div>
        ) : (
          companies.map((c) => (
            <CompanyRowItem
              key={c.id}
              row={c}
              onAddLocation={onAddLocation}
              onEditCompany={onEditCompany}
              onAddUser={onAddUser}
              onDeleteCompany={onDeleteCompany}
            />
          ))
        )}
      </div>
    </div>
  );
}
