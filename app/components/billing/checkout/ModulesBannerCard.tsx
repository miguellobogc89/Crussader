"use client";

import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Zap, Plus } from "lucide-react";

export function ModulesBannerCard() {
  return (
    <Card
      className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-primary/20 animate-fade-in"
      style={{ animationDelay: "200ms" }}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-3 shadow-lg">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Mejora tu experiencia añadiendo módulos</h3>
            <p className="text-muted-foreground mb-4">
              Personaliza tu plan con funcionalidades adicionales que se adapten perfectamente a tus necesidades.
            </p>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Explorar módulos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
