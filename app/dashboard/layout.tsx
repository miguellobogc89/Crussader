// app/dashboard/layout.tsx
import * as React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AppProviders from "@/app/providers/AppProviders";
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
  const session = await getServerSession(authOptions);
  console.log("[dashboard layout][server session]", session);
  const initialData = await getBootstrapData();

  const needsEnsureActiveCompany =
    !initialData.activeCompany && (initialData.companies?.length ?? 0) > 0;

  return (
    <AppProviders session={session}>
      <BootstrapProvider initialData={initialData} autoFetchIfEmpty={false}>
        <DashboardRouteGuard />

        <style>{`
          .orientation-guard { display: none; }
          @media (orientation: landscape) and (max-height: 480px) {
            .app-root { display: none !important; }
            .orientation-guard { display: flex !important; }
          }
        `}</style>

        <div className="orientation-guard fixed inset-0 z-[1000] bg-slate-900 text-white items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">🔁</div>
            <h2 className="text-xl font-semibold mb-2">Gira el dispositivo</h2>
            <p className="text-sm text-slate-300">
              Para una mejor experiencia, usa la aplicación en formato vertical.
            </p>
          </div>
        </div>

        <div className="app-root flex h-svh w-full">
          <AppSidebar />

          <div
            className={[
              "relative flex min-w-0 flex-1 overflow-y-auto overflow-x-hidden",
              "h-[calc(100svh-3rem)] pt-12",
              "md:h-svh md:pt-0",
            ].join(" ")}
          >
            <RouteTransitionOverlay scope="container" />

            <main className="flex-1 bg-background min-w-0">
              <PageContainer>{children}</PageContainer>
            </main>
          </div>
        </div>

        <Toaster />

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
    </AppProviders>
  );
}