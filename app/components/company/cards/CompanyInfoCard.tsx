// app/components/company/cards/CompanyInfoCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Building2 } from "lucide-react";

export function CompanyInfoCard({ name, email, phone, address, employeesText }: any) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-blue-10">
      
      {/* Icono decorativo */}
      <Building2
        className="
          pointer-events-none absolute
          -right-4 -bottom-4
          h-16 w-16
          text-blue-400/15
        "
      />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-blue-500" />
          Información de la empresa
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-1 text-sm">
        <p><strong>Nombre:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
      </CardContent>
    </Card>
  );
}
