"use client";

import PageShell from "@/app/components/layouts/PageShell";
import StandardDemoTable from "@/app/components/crussader/UX/table/StandardDemoTable";

export default function DesignSystemPage() {
  return (
    <PageShell
      title="Componentes de diseño Crussader"
      description=""
    >
      <div className="w-full flex justify-center">
        <div className="w-full max-w-6xl space-y-8">
          {/* Sección: Tabla estándar */}
          <section>
            <StandardDemoTable />
          </section>

          {/* Aquí irán más componentes de diseño (cards, inputs, toasts, etc.) */}
          {/* <section>...</section> */}
        </div>
      </div>
    </PageShell>
  );
}
