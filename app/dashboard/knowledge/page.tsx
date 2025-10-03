import SectionsSidebar from "@/app/components/knowledge/SectionsSidebar";
import SectionEditor from "@/app/components/knowledge/SectionEditor";
import CompanySelector from "@/app/components/knowledge/CompanySelector";
import { getUserCompanyIds } from "@/app/components/knowledge/sections-actions";

export const dynamic = "force-dynamic";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams?: { sectionId?: string; companyId?: string };
}) {
  const userCompanies = await getUserCompanyIds();
  if (userCompanies.length === 0) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        No tienes empresas asignadas.
      </div>
    );
  }

  const selectedCompanyId =
    searchParams?.companyId && userCompanies.includes(searchParams.companyId)
      ? searchParams.companyId
      : userCompanies[0];

  const selectedId = searchParams?.sectionId;

  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      <SectionsSidebar
        basePath="/dashboard/knowledge"
        selectedId={selectedId}
        companyId={selectedCompanyId}
      />
      <main className="flex-1 p-6 bg-muted/20">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <CompanySelector
            selectedCompanyId={selectedCompanyId}
            basePath="/dashboard/knowledge"
          />
          <SectionEditor
            basePath="/dashboard/knowledge"
            selectedId={selectedId}
            companyId={selectedCompanyId}
          />
        </div>
      </main>
    </div>
  );
}
