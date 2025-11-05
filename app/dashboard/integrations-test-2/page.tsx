import { prisma } from "@/app/server/db";
import Image from "next/image";
import PageShell from "@/app/components/layouts/PageShell";
import IntegrationPlatformCard, { type Provider } from "@/app/components/integrations/IntegrationPlatformCard";
import StandardDemoTable from "@/app/components/crussader/UX/table/StandardDemoTable";
import IntegrationsGridClient from "@/app/components/integrations/IntegrationsGridClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

/* Icon wrapper estandarizado (28×28) */
function PlatformImg({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="h-7 w-7 shrink-0">
      <Image src={src} alt={alt} width={28} height={28} className="h-full w-full object-contain" />
    </div>
  );
}

export default async function IntegrationsPage() {
  // Datos reales desde Prisma para la tabla simple
  const external = await prisma.externalConnection.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      provider: true,
      accountEmail: true,
      accountName: true,
      updatedAt: true,
    },
  });

  // Adaptación al StandardDemoTable (sin tocar su estructura)
  const rows = external.map((e) => ({
    id: e.id,
    name: e.provider,                  // Columna "Nombre" -> proveedor
    description: e.accountEmail ?? "—",// Columna "Descripción" -> email
    durationMin: 0,
    price: 0,
    color: null,
    active: true,
  }));

  const providers: Provider[] = [
    { key: "google", name: "Google", status: "disconnected", brandIcon: <PlatformImg src="/platform-icons/google.png" alt="Google" />, description: "Conecta tu Perfil de Empresa para traer reseñas y responder desde Crussader." },
    { key: "instagram", name: "Instagram", status: "pending", brandIcon: <PlatformImg src="/platform-icons/instagram.png" alt="Instagram" />, description: "Conecta tu cuenta profesional para leer DMs y menciones." },
    { key: "facebook", name: "Facebook", status: "coming-soon", brandIcon: <PlatformImg src="/platform-icons/facebook.png" alt="Facebook" />, description: "Páginas, reseñas y mensajes." },
    { key: "trustpilot", name: "Trustpilot", status: "coming-soon", brandIcon: <PlatformImg src="/platform-icons/trustpilot.png" alt="Trustpilot" />, description: "Sincroniza tus valoraciones." },
    { key: "tripadvisor", name: "Tripadvisor", status: "coming-soon", brandIcon: <PlatformImg src="/platform-icons/tripadvisor.png" alt="Tripadvisor" />, description: "Reseñas de viajes y experiencias." },
    { key: "calendar", name: "Google Calendar", status: "coming-soon", brandIcon: <PlatformImg src="/platform-icons/google-calendar.png" alt="Google Calendar" />, description: "Sincroniza tus citas y eventos." },
    { key: "yelp", name: "Yelp", status: "coming-soon", brandIcon: <PlatformImg src="/platform-icons/yelp.png" alt="Yelp" />, description: "Reseñas y reputación local." },
    { key: "gmail", name: "Gmail", status: "coming-soon", brandIcon: <PlatformImg src="/platform-icons/gmail.png" alt="Gmail" />, description: "Sincroniza correos entrantes y salientes." },
  ];

  return (
    <PageShell
      title="Conexiones"
      description="Elige qué plataformas quieres conectar a tu negocio. Google e Instagram están disponibles; el resto, muy pronto."
    >
      {/* Panel estilizado con las cards */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Plataformas disponibles</CardTitle>
          <CardDescription>Conecta tus cuentas y sincroniza datos automáticamente.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <IntegrationsGridClient providers={providers} />
        </CardContent>
      </Card>

      {/* Tabla (misma demo), rellenada con datos reales de ExternalConnection */}
      <StandardDemoTable rows={rows} className="mt-10" withActions={false} />
    </PageShell>
  );
}
