// app/dashboard/layout.tsx
"use client";

import AuthGuard from "@/app/components/AuthGuard";
import Header from "@/app/components/AppHeader";
import { AppSidebar } from "@/app/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/app/components/ui/sidebar";
import PageContainer from "@/app/components/PageContainer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        {/* El sidebar fija su ancho y SidebarInset ocupa el resto */}
        <AppSidebar />
        <SidebarInset className="flex min-h-svh flex-1 flex-col">
          <Header />
          <main className="flex-1 px-6 md:px-8 pb-10 bg-background">
            <PageContainer>{children}</PageContainer>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
