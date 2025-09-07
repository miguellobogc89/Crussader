// app/dashboard/layout.tsx
import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/AppSidebar";
import { AppHeader as Header } from "@/app/components/AppHeader";
import PageContainer from "@/app/components/PageContainer"; // ⬅️ default import

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AppSidebar />
        <SidebarInset className="flex min-h-svh flex-1 flex-col">
          <Header title="Panel de Control" />
          <main className="flex-1 px-6 md:px-8 pb-10 bg-background">
            <PageContainer>{children}</PageContainer>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
