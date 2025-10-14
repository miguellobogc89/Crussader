"use client";

import { useState } from "react";
import CompanySelector, { type CompanyLite } from "@/app/components/crussader/CompanySelector";
import LocationSelector, { type LocationLite } from "@/app/components/crussader/LocationSelector";

export type CompanyLocationChange = {
  companyId: string | null;
  company: CompanyLite | null | undefined;
  locationId: string | null;
  location: LocationLite | null | undefined;
};

export function CompanyLocationShell({
  onChange,
  className = "",
}: {
  onChange?: (payload: CompanyLocationChange) => void;
  className?: string;
}) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyLite | null>(null);

  return (
    <div className={`flex gap-2 items-end ${className}`}>
      <CompanySelector
        onSelect={(id, comp) => {
          setCompanyId(id);
          setCompany(comp ?? null);
        }}
      />

      <LocationSelector
        key={companyId ?? "no-company"}
        companyId={companyId}
        onSelect={(locationId, location) => {
          if (locationId && location && companyId && company) {
            onChange?.({
              companyId,
              company,
              locationId,
              location,
            });
          }
        }}
      />
    </div>
  );
}

export default CompanyLocationShell;
