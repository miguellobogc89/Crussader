// app/components/mybusiness/home/MyBusinessHomeShell.tsx
"use client";

import { useBootstrapData } from "@/app/providers/bootstrap-store";
import MyBusinessHomeMockup from "./MyBusinessHomeMockup";

export default function MyBusinessHomeShell() {
  const bootstrap = useBootstrapData();

  const companyName =
    bootstrap?.activeCompanyResolved?.name ??
    bootstrap?.companiesResolved?.[0]?.name ??
    "Tu negocio";

const locationName =
  bootstrap?.locations?.find(
    (location) => location.id === bootstrap?.sessionContext?.locationId,
  )?.title ??
  bootstrap?.locations?.[0]?.title ??
  "Tu ubicación principal";

  return (
    <MyBusinessHomeMockup
      companyName={companyName}
      locationName={locationName}
    />
  );
}