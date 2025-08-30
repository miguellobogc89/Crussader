"use client";

import { SidebarProvider, SidebarInset } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/AppSidebar";
import { AppHeader } from "@/app/dashboard/AppHeader";

export default function Page() {
  return (
    <SidebarProvider>
      <div className="min-h-svh flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader title="Prueba UI" subtitle="Todo debería verse limpio" />
          <SidebarInset className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Contenido de prueba. Si ves el sidebar y el header correctos, estamos bien.
            </p>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
