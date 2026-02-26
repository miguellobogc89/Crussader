import MainPannelTight from "@/app/components/crussader/UX/MainPannelTight";
import SectionsSidebar from "@/app/components/knowledge/SectionsSidebar";
import SectionEditor from "@/app/components/knowledge/SectionEditor";
import { getBootstrapData } from "@/lib/bootstrap";
import { getUserCompanyIds } from "@/app/components/knowledge/sections-actions";

export const dynamic = "force-dynamic";

export default async function KnowledgeShell({
  selectedId,
}: {
  selectedId?: string;
}) {
  const initialData = await getBootstrapData();

  const activeCompanyIdRaw = initialData?.activeCompany?.id;
  const activeCompanyId =
    typeof activeCompanyIdRaw === "string" && activeCompanyIdRaw.length > 0
      ? activeCompanyIdRaw
      : null;

  const allowedCompanies = await getUserCompanyIds();

  let companyId = activeCompanyId;
  if (!companyId || !allowedCompanies.includes(companyId)) {
    companyId = allowedCompanies[0] ?? null;
  }

  // Delimitador de altura: el panel NO debe crecer por contenido
  return (
    <div className="h-[calc(100svh-180px)] min-h-0">
      <MainPannelTight className="h-full" contentClassName="h-full">
        {/* CRÍTICO: h-full + min-h-0 + overflow-hidden */}
        <div className="h-full min-h-0 overflow-hidden flex">
          {/* Sidebar fija */}
          <div className="w-[280px] shrink-0 h-full min-h-0 overflow-hidden">
            <SectionsSidebar
              basePath="/dashboard/knowledge"
              selectedId={selectedId}
              companyId={companyId ?? ""}
            />
          </div>

          {/* Panel derecho ocupa el resto */}
          <div className="flex-1 min-w-0 h-full min-h-0 overflow-hidden">
            <SectionEditor
              basePath="/dashboard/knowledge"
              selectedId={selectedId}
              companyId={companyId ?? ""}
            />
          </div>
        </div>
      </MainPannelTight>
    </div>
  );
}