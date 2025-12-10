// app/dashboard/layout.tsx
import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/AppSidebar";
import PageContainer from "@/app/components/PageContainer";
import { getBootstrapData } from "@/lib/bootstrap";
import BootstrapProvider from "@/app/providers/BootstrapProvider";
import { Toaster } from "@/app/components/ui/toaster";
import RouteTransitionOverlay from "@/app/components/layouts/RouteTransitionOverlay";
import DashboardRouteGuard from "@/app/dashboard/DashboardRouteGuard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialData = await getBootstrapData();

  const needsEnsureActiveCompany =
    !initialData.activeCompany && (initialData.companies?.length ?? 0) > 0;

  return (
    <SidebarProvider>
      <BootstrapProvider initialData={initialData} autoFetchIfEmpty={false}>
        {/* ====== Guard de redirección (cliente) ====== */}
        <DashboardRouteGuard />

        {/* ====== Soft-lock orientación: estilos globales ====== */}
        <style>{`
          .orientation-guard { display: none; }
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

          {/* Contenido (derecha): ahora es el "scope" del overlay */}
          <div className="relative flex h-svh min-w-0 flex-1 overflow-y-auto overflow-x-hidden pt-3 md:pt-0">
            {/* 👇 Overlay limitado al área de página, NO tapa la sidebar */}
            <RouteTransitionOverlay scope="container" />

            <main className="flex-1 bg-background min-w-0">
              <PageContainer>{children}</PageContainer>
            </main>
          </div>
        </div>

        <Toaster />

        {/* ====== Asegurar compañía activa (sin componentes nuevos) ====== */}
        {needsEnsureActiveCompany ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `
              (function() {
                try {
                  fetch('/api/me/active-company', { method: 'POST' });
                } catch (_) {}
              })();
            `,
            }}
          />
        ) : null}
      </BootstrapProvider>
    </SidebarProvider>
  );
}
