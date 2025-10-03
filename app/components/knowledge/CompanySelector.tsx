import { prisma } from "@/lib/prisma";
import { getUserCompanyIds } from "./sections-actions";
import { redirect } from "next/navigation";
import CompanySelectorClient from "./CompanySelector.client";

export default async function CompanySelector({
  selectedCompanyId,
  basePath = "/dashboard/knowledge",
}: {
  selectedCompanyId?: string;
  basePath?: string;
}) {
  const allowedCompanyIds = await getUserCompanyIds();
  if (!allowedCompanyIds.length) {
    return (
      <div className="p-4 text-sm text-muted-foreground border rounded-md">
        No tienes empresas asignadas. Pide acceso a un administrador.
      </div>
    );
  }

  const companies = await prisma.company.findMany({
    where: { id: { in: allowedCompanyIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const validSelected =
    selectedCompanyId && allowedCompanyIds.includes(selectedCompanyId)
      ? selectedCompanyId
      : companies[0].id;

  if (validSelected !== selectedCompanyId) {
    redirect(`${basePath}?companyId=${validSelected}`);
  }

  return (
    <CompanySelectorClient
      companies={companies}
      selectedCompanyId={validSelected}
      basePath={basePath}
    />
  );
}
