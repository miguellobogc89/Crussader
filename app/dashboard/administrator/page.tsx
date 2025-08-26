// app/dashboard/administrator/page.tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  companies: { id: string; name: string }[];
};

type CompanyRow = {
  id: string;
  name: string;
  website: string | null;
  taxId: string | null; // lo rellenamos desde cif o vatNumber
  createdAt: Date;
};

export default async function AdministratorPage() {
  const users = await prisma.user.findMany({
    orderBy: { id: "desc" },
    select: { id: true, name: true, email: true },
  });

  // 👇 La relación es "Company" (no "company")
  const memberships = await prisma.userCompany.findMany({
    include: { Company: { select: { id: true, name: true } } },
  });

  const byUser: Record<string, { id: string; name: string }[]> = {};
  for (const m of memberships) {
    if (!byUser[m.userId]) byUser[m.userId] = [];
    if (m.Company) byUser[m.userId].push({ id: m.Company.id, name: m.Company.name });
  }

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    companies: byUser[u.id] ?? [],
  }));

  // 👇 En tu modelo no existe taxId; usamos cif/vatNumber y lo mapeamos a taxId
  const companiesRaw = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, website: true, cif: true, vatNumber: true, createdAt: true },
  });

  const companies: CompanyRow[] = companiesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    website: c.website,
    taxId: c.cif ?? c.vatNumber ?? null,
    createdAt: c.createdAt,
  }));

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Administrator</h1>

      <section>
        <h2 className="text-xl font-medium mb-3">Usuarios</h2>
        <div className="overflow-x-auto rounded-2xl shadow border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Empresas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.name || "—"}</td>
                  <td className="px-4 py-3">{r.email || "—"}</td>
                  <td className="px-4 py-3">
                    {r.companies.length ? r.companies.map((c) => c.name).join(", ") : "—"}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={3}>
                    Sin usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-medium mb-3">Empresas</h2>
        <div className="overflow-x-auto rounded-2xl shadow border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">CIF/NIF</th>
                <th className="px-4 py-3">Creada</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.website || "—"}</td>
                  <td className="px-4 py-3">{c.taxId || "—"}</td>
                  <td className="px-4 py-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!companies.length && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>
                    Sin empresas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
