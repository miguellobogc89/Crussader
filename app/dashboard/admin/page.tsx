// app/admin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

import UsersTable from "@/app/components/admin/UsersTable";
import CompaniesTable from "@/app/components/admin/CompaniesTable";
import LocationsTable from "@/app/components/admin/LocationsTable";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: {
    // Users
    uq?: string;
    upage?: string;
    // Companies
    cq?: string;
    cpage?: string;
    // Locations
    lq?: string;
    lpage?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "user";
  if (role !== "system_admin") redirect("/");

  const uq = (searchParams?.uq ?? "").trim();
  const upage = Math.max(1, Number(searchParams?.upage ?? 1) || 1);

  const cq = (searchParams?.cq ?? "").trim();
  const cpage = Math.max(1, Number(searchParams?.cpage ?? 1) || 1);

  const lq = (searchParams?.lq ?? "").trim();
  const lpage = Math.max(1, Number(searchParams?.lpage ?? 1) || 1);

  return (
    <main className="p-6 space-y-10">
      {/* 1) Ubicaciones primero */}
      <LocationsTable lq={lq} lpage={lpage} uq={uq} upage={upage} cq={cq} cpage={cpage} />

      {/* 2) Usuarios */}
      <UsersTable uq={uq} upage={upage} cq={cq} cpage={cpage} />

      {/* 3) Empresas */}
      <CompaniesTable cq={cq} cpage={cpage} uq={uq} upage={upage} />
    </main>
  );
}
