"use client";

import { AppSidebar } from "@/app/components/lovable/SidebarPretty";

export default function TestSidebarPage() {
  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <main className="flex-1 p-6">
        <h1 className="text-xl font-semibold">Prueba Sidebar</h1>
        <p className="text-sm text-muted-foreground">
          Si ves el menú a la izquierda y este texto aquí, el layout funciona.
        </p>
      </main>
    </div>
  );
}
