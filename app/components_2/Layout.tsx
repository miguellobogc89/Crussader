import { SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/AppSidebar";
import { AppHeader } from "@/app/dashboard/AppHeader";
import "./globals.css";
import "react-day-picker/dist/style.css"; // ← aquí
import Providers from "@/app/providers";


interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showCreateButton?: boolean;
  createButtonText?: string;
  onCreateClick?: () => void;
}

export function Layout({ 
  children, 
  title, 
  subtitle, 
  showCreateButton, 
  createButtonText, 
  onCreateClick 
}: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader 
            title={title}
            subtitle={subtitle}
            showCreateButton={showCreateButton}
            createButtonText={createButtonText}
            onCreateClick={onCreateClick}
          />
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}