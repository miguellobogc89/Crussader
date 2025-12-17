import PageShell from "@/app/components/layouts/PageShell";
import IntegrationsGridClient from "@/app/components/integrations/IntegrationsGridClient";
import type { Provider } from "@/app/components/integrations/IntegrationPlatformCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { FlaskConical } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LabsPage() {
  // Próximos lanzamientos (desde commercial_product)
  const products = await prisma.commercial_product.findMany({
    where: {
      status: "COMING_SOON",
    },
    orderBy: {
      created_at: "asc",
    },
    select: {
      key: true,
      commercial_name: true,
      marketing_description: true,
      image_url: true,
    },
  });

  const upcoming: Provider[] = products.map((p) => ({
    key: p.key,
    name: p.commercial_name,
    description: p.marketing_description ?? "",
    brandIconSrc: p.image_url ?? "/img/placeholder.png",
    brandIconAlt: p.commercial_name,
    comingSoon: true,
  }));

  return (
    <PageShell
      title="Próximos lanzamientos"
      description="Funcionalidades y productos que estamos preparando en Crussader."
      titleIconName="FlaskConical"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">
              En desarrollo
            </CardTitle>
          </div>

          <CardDescription>
            Este es nuestro laboratorio 🧪: aquí puedes ver qué estamos
            construyendo y qué llegará próximamente.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <IntegrationsGridClient providers={upcoming} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
