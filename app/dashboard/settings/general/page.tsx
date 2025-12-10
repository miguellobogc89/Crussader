// app/dashboard/settings/general/page.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { AlertTriangle } from "lucide-react";

// 🔹 Componente extraído (información personal)
import UserPersonalInfoCard from "@/app/components/settings/UserPersonalInfoCard";

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Información personal */}
      <UserPersonalInfoCard />

      {/* Zona peligrosa / Eliminar cuenta */}
      <Card className="rounded-2xl shadow-sm border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Zona peligrosa</span>
          </CardTitle>
          <CardDescription>
            Acciones irreversibles que afectan permanentemente a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-destructive/20">
            <div className="space-y-1">
              <Label className="font-medium text-destructive">
                Eliminar cuenta
              </Label>
              <p className="text-sm text-muted-foreground">
                (Mock) Elimina permanentemente tu cuenta y todos los datos
                asociados. Esta acción no se puede deshacer.
              </p>
            </div>
            <Button
              variant="destructive"
              className="rounded-xl w-full sm:w-auto"
              disabled
            >
              Eliminar cuenta...
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
