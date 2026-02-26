// app/dashboard/knowledge/page.tsx
import PageShell from "@/app/components/layouts/PageShell";
import SectionsSidebar from "@/app/components/knowledge/SectionsSidebar";
import SectionEditor from "@/app/components/knowledge/SectionEditor";
import { getBootstrapData } from "@/lib/bootstrap";
import { getUserCompanyIds } from "@/app/components/knowledge/sections-actions";

export const dynamic = "force-dynamic";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams?: { sectionId?: string; companyId?: string };
}) {
  const initialData = await getBootstrapData();
  const activeCompanyId =
    initialData &&
    initialData.activeCompany &&
    typeof initialData.activeCompany.id === "string"
      ? initialData.activeCompany.id
      : null;

  const userCompanies = await getUserCompanyIds();

  const qpCompanyId = searchParams?.companyId ?? null;

  let selectedCompanyId = userCompanies[0] ?? "";
  if (qpCompanyId && userCompanies.includes(qpCompanyId)) {
    selectedCompanyId = qpCompanyId;
  } else if (activeCompanyId && userCompanies.includes(activeCompanyId)) {
    selectedCompanyId = activeCompanyId;
  }

  const selectedId = searchParams?.sectionId;

  return (
    <PageShell
      title="Knowledge"
      description="Contenido público/privado para alimentar el asistente."
      titleIconName="BookOpen"
      variant="full"
    >
      {/* IMPORTANTÍSIMO: min-h-0 + overflow-hidden para que el scroll NO se vaya al body */}
      <div className="h-[calc(100svh-180px)] min-h-0">
        <div className="h-full min-h-0 overflow-hidden rounded-2xl border bg-background flex">
          <SectionsSidebar
            basePath="/dashboard/knowledge"
            selectedId={selectedId}
            companyId={selectedCompanyId}
          />
          <div className="flex-1 min-w-0 min-h-0">
            <SectionEditor
              basePath="/dashboard/knowledge"
              selectedId={selectedId}
              companyId={selectedCompanyId}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}