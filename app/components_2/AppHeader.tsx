/* AppHeader */
import { SidebarTrigger } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Settings, Plus } from "lucide-react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showCreateButton?: boolean;
  createButtonText?: string;
  onCreateClick?: () => void;
}

export function AppHeader({ 
  title, 
  subtitle, 
  showCreateButton = false, 
  createButtonText = "Crear", 
  onCreateClick 
}: AppHeaderProps) {
  return (
    <header className="h-16 border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showCreateButton && (
            <Button 
              onClick={onCreateClick}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              <Plus size={16} className="mr-1" />
              {createButtonText}
            </Button>
          )}
          
          <Button variant="ghost" size="icon">
            <Settings size={18} />
          </Button>
          
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs">
                ML
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:block">Miguel Lobo</span>
          </div>
        </div>
      </div>
    </header>
  );
}