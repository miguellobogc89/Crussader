"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Building2, MapPin, Mail, Phone, Users } from "lucide-react";

type Props = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  employeesText?: string; // ej. "12 empleados" o "—"
};
export function CompanyInfoCard({ name, email = "—", phone = "—", address = "—", employeesText = "—" }: Props) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          Información General
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Mail size={14} /><span>{email}</span></div>
            <div className="flex items-center gap-2"><Phone size={14} /><span>{phone}</span></div>
            <div className="flex items-center gap-2"><MapPin size={14} /><span>{address}</span></div>
            <div className="flex items-center gap-2"><Users size={14} /><span>{employeesText}</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
