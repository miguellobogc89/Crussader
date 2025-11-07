// app/dashboard/integrations-test-2/page.tsx
import Image from "next/image";
import PageShell from "@/app/components/layouts/PageShell";
import IntegrationsGridClient from "@/app/components/integrations/IntegrationsGridClient";
import { type Provider } from "@/app/components/integrations/IntegrationPlatformCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

/* Icon wrapper estandarizado (28×28) */
function PlatformImg({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="h-7 w-7 shrink-0">
      <Image
        src={src}
        alt={alt}
        width={28}
        height={28}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  // Array de plataformas soportadas
  const providers: Provider[] = [
    {
      key: "google",
      name: "Google Business Profile",
      description: "Conecta tu ficha de empresa.",
      brandIcon: <PlatformImg src="/platform-icons/google-business.png" alt="Google Business" />,
      connectUrl: "/api/integrations/google/business-profile/connect",
    },
    {
      key: "instagram",
      name: "Instagram Business",
      description: "Gestiona mensajes, comentarios y menciones desde tu cuenta de empresa.",
      brandIcon: <PlatformImg src="/platform-icons/instagram.png" alt="Instagram" />,
      comingSoon: true,
    },
    {
      key: "facebook",
      name: "Facebook Pages",
      description: "Conecta tu página de Facebook para responder reseñas y mensajes.",
      brandIcon: <PlatformImg src="/platform-icons/facebook.png" alt="Facebook" />,
      comingSoon: true,
    },
    {
      key: "tripadvisor",
      name: "TripAdvisor",
      description: "Sincroniza reseñas y responde directamente desde Crussader.",
      brandIcon: <PlatformImg src="/platform-icons/tripadvisor.png" alt="TripAdvisor" />,
      comingSoon: true,
    },
    {
      key: "trustpilot",
      name: "Trustpilot",
      description: "Conecta Trustpilot para importar valoraciones y analizar tendencias.",
      brandIcon: <PlatformImg src="/platform-icons/trustpilot.png" alt="Trustpilot" />,
      comingSoon: true,
    },
    {
      key: "yelp",
      name: "Yelp",
      description: "Centraliza tus reseñas de Yelp y automatiza respuestas con IA.",
      brandIcon: <PlatformImg src="/platform-icons/yelp.png" alt="Yelp" />,
      comingSoon: true,
    },
    {
      key: "calendar",
      name: "Google Calendar",
      description: "Sincroniza citas, recordatorios y disponibilidad de tu empresa.",
      brandIcon: <PlatformImg src="/platform-icons/google-calendar.png" alt="Google Calendar" />,
      comingSoon: true,
    },
  ];

  return (
    <PageShell
      title="Integraciones"
      description="Conecta tus plataformas para sincronizar datos y automatizar tus flujos de trabajo."
      titleIconName="Plug"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Plataformas disponibles
          </CardTitle>
          <CardDescription>
            Conecta tus cuentas o revisa el estado de las integraciones activas.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <IntegrationsGridClient providers={providers} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
