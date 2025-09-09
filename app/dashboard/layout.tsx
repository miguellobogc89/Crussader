// app/dashboard/layout.tsx
import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/AppSidebar";
import { AppHeader as Header } from "@/app/components/AppHeader";
import PageContainer from "@/app/components/PageContainer";
import { getBootstrapData } from "@/lib/bootstrap";
import BootstrapProvider from "@/app/providers/BootstrapProvider";

// ⬇️ NUEVO
import { Toaster } from "@/app/components/ui/toaster";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const initialData = await getBootstrapData();

  return (
    <SidebarProvider>
      <BootstrapProvider initialData={initialData} autoFetchIfEmpty={false}>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
          <AppSidebar />
          <SidebarInset className="flex min-h-svh flex-1 flex-col">
            <Header title="Panel de Control" />
            <main className="flex-1 bg-background">
              <PageContainer>{children}</PageContainer>
            </main>
            {/* ⬇️ Toaster global del dashboard */}
            <Toaster />
          </SidebarInset>
        </div>
      </BootstrapProvider>
    </SidebarProvider>
  );
}
