// app/admin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

import UsersTable from "@/app/components/admin/UsersTable";
import CompaniesTable from "@/app/components/admin/CompaniesTable";
import LocationsTable from "@/app/components/admin/LocationsTable";
import { TabsMenu, type TabItem } from "@/app/components/TabsMenu";

export const dynamic = "force-dynamic";

const ADMIN_TABS: TabItem[] = [
  { href: "?tab=locations", label: "Ubicaciones", icon: "map-pin" },
  { href: "?tab=users",     label: "Usuarios",    icon: "users" },
  { href: "?tab=companies", label: "Empresas",    icon: "building-2" },
];

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
    // Active tab
    tab?: "locations" | "users" | "companies";
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

  const tab = (searchParams?.tab ?? "locations") as "locations" | "users" | "companies";

  return (
    <TabsMenu
      title="Administración"
      description="Gestión de ubicaciones, usuarios y empresas"
      mainIcon="database"
      tabs={ADMIN_TABS}
    >
      {tab === "locations" && (
        <section id="locations">
          <LocationsTable
            lq={lq}
            lpage={lpage}
            uq={uq}
            upage={upage}
            cq={cq}
            cpage={cpage}
          />
        </section>
      )}

      {tab === "users" && (
        <section id="users">
          <UsersTable
            uq={uq}
            upage={upage}
            cq={cq}
            cpage={cpage}
          />
        </section>
      )}

      {tab === "companies" && (
        <section id="companies">
          <CompaniesTable
            cq={cq}
            cpage={cpage}
            uq={uq}
            upage={upage}
          />
        </section>
      )}
    </TabsMenu>
  );
}
