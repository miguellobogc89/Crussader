import PageShell from "@/app/components/layouts/PageShell";
import KnowledgeShell from "@/app/components/knowledge/KnowledgeShell";

export const dynamic = "force-dynamic";

export default function KnowledgePage({
  searchParams,
}: {
  searchParams?: { sectionId?: string };
}) {
  return (
    <PageShell
      title="Knowledge"
      description="Contenido público/privado para alimentar el asistente."
      titleIconName="BookOpen"
      variant="full"
    >
      <KnowledgeShell selectedId={searchParams?.sectionId} />
    </PageShell>
  );
}