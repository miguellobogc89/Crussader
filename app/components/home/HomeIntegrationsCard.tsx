// app/components/home/HomeIntegrationsCard.tsx

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { RefreshCw, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";

type Integration = {
  id: number;
  name: string;
  status: "active" | "warning";
  lastSync: string;
};

export default function HomeIntegrationsCard({ integrations }: { integrations: Integration[] }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <CardTitle>Integraciones</CardTitle>
          </div>
          <Badge variant="outline">{integrations.length}</Badge>
        </div>
        <CardDescription>Estado de tus conexiones</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {integrations.map((int) => (
            <div
              key={int.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {int.status === "active" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <p className="font-medium">{int.name}</p>
                  <p className="text-sm text-muted-foreground">{int.lastSync}</p>
                </div>
              </div>
              <Badge
                variant={int.status === "active" ? "default" : "secondary"}
                className={
                  int.status === "active"
                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                    : ""
                }
              >
                {int.status === "active" ? "Activo" : "Atención"}
              </Badge>
            </div>
          ))}
        </div>

        <Button variant="ghost" className="w-full mt-4" asChild>
          <Link href="/dashboard/integrations">
            Gestionar integraciones
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
