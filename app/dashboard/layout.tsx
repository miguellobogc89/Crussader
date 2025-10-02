// app/dashboard/layout.tsx
import * as React from "react";
import { SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/AppSidebar";
import PageContainer from "@/app/components/PageContainer";
import { getBootstrapData } from "@/lib/bootstrap";
import BootstrapProvider from "@/app/providers/BootstrapProvider";
import { Toaster } from "@/app/components/ui/toaster";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialData = await getBootstrapData();

  return (
    <SidebarProvider>
      <BootstrapProvider initialData={initialData} autoFetchIfEmpty={false}>
        {/* ====== Soft-lock orientación: estilos globales ====== */}
        <style>{`
          /* Por defecto: overlay oculto */
          .orientation-guard { display: none; }
          /* Si está en apaisado y con poca altura, bloqueamos la app y mostramos overlay */
          @media (orientation: landscape) and (max-height: 480px) {
            .app-root { display: none !important; }
            .orientation-guard { display: flex !important; }
          }
        `}</style>

        {/* ====== Overlay que pide girar el dispositivo en paisaje bajo ====== */}
        <div className="orientation-guard fixed inset-0 z-[1000] bg-slate-900 text-white items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">🔁</div>
            <h2 className="text-xl font-semibold mb-2">Gira el dispositivo</h2>
            <p className="text-sm text-slate-300">
              Para una mejor experiencia, usa la aplicación en formato vertical.
            </p>
          </div>
        </div>

        {/* ====== App normal (se oculta en landscape bajo) ====== */}
        <div className="app-root flex h-svh w-full bg-gradient-to-br from-background via-background to-muted/20">
          {/* Sidebar (izquierda) */}
          <AppSidebar />

          {/* Contenido (derecha): ocupa el espacio restante y tiene su propio scroll */}
          <div className="flex h-svh min-w-0 flex-1 overflow-y-auto">
            <main className="flex-1 bg-background">
              <PageContainer>{children}</PageContainer>
            </main>
          </div>
         </div>
      </BootstrapProvider>
    </SidebarProvider>
  );
}
