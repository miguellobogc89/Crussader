"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import NavPagination from "@/app/components/crussader/navigation/NavPagination";

export default function ReportsPage() {
  // Estado de ejemplo para la paginación/filtros (podrás conectarlo a tus queries)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const totalPages = 12;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Sub-TabMenu (pegado justo debajo del TabMenu principal del layout) */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="w-full lg:w-fit">
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
          <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Barra de filtros/controles (por ahora con NavPagination como nos diste) */}
      <NavPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        className="mt-2"
      />

      {/* Aquí debajo dejaremos espacio para los futuros módulos/tablones de informes */}
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Sin gráficos por ahora. Aquí montaremos los widgets/tablas reales cuando conectemos datos.
      </div>
    </div>
  );
}
