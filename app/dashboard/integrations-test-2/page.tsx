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
  // Sección 1: Plataformas disponibles (clicables)
  // Orden solicitado: Google Reviews, Facebook, Calendar, Instagram
  // Añadimos después: Gmail, WhatsApp
  const available: Provider[] = [
    {
      key: "google",
      name: "Google Business Profile",
      description: "Conecta tu ficha de empresa.",
      brandIcon: <PlatformImg src="/platform-icons/google-business.png" alt="Google Business" />,
      connectUrl: "/api/integrations/google/business-profile/connect",
    },
    {
      key: "facebook",
      name: "Facebook",
      description: "Conecta tu página de Facebook para centralizar reseñas y mensajes.",
      brandIcon: <PlatformImg src="/platform-icons/facebook.png" alt="Facebook" />,
      connectUrl: "/api/integrations/meta/facebook/login",
    },
    {
      key: "calendar",
      name: "Calendar",
      description: "Sincroniza citas y disponibilidad con Google Calendar.",
      brandIcon: <PlatformImg src="/platform-icons/google-calendar.png" alt="Calendar" />,
      connectUrl: "/api/integrations/google/calendar/connect", // placeholder
    },
    {
      key: "instagram",
      name: "Instagram",
      description: "Gestiona mensajes y comentarios desde tu cuenta de empresa.",
      brandIcon: <PlatformImg src="/platform-icons/instagram.png" alt="Instagram" />,
      connectUrl: "/api/integrations/meta/instagram/login",
    },
    {
      key: "gmail",
      name: "Gmail",
      description: "Conecta tu bandeja de entrada para leer y gestionar emails.",
      brandIcon: <PlatformImg src="/platform-icons/gmail.png" alt="Gmail" />,
      connectUrl: "/api/integrations/google/gmail/connect", // placeholder
    },
    {
      key: "whatsapp",
      name: "WhatsApp",
      description: "Centraliza conversaciones y automatiza respuestas con tu número de WhatsApp.",
      brandIcon: <PlatformImg src="/platform-icons/whatsapp.png" alt="WhatsApp" />,
      connectUrl: "/api/integrations/whatsapp/connect", // placeholder
    },
  ];

  // Sección 2: Próximamente (no clicables)
  const upcoming: Provider[] = [
    {
      key: "tripadvisor",
      name: "TripAdvisor",
      description: "Sincroniza reseñas y responde desde Crussader.",
      brandIcon: <PlatformImg src="/platform-icons/tripadvisor.png" alt="TripAdvisor" />,
      comingSoon: true,
    },
    {
      key: "trustpilot",
      name: "Trustpilot",
      description: "Importa valoraciones y analiza tendencias.",
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
      key: "booking",
      name: "Booking",
      description: "Conecta tu alojamiento y gestiona reseñas y reservas.",
      brandIcon: <PlatformImg src="/platform-icons/booking.png" alt="Booking" />,
      comingSoon: true,
    },
  ];

  return (
    <PageShell
      title="Integraciones"
      description="Conecta tus plataformas y gestiona el estado de cada integración."
      titleIconName="Plug"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Integraciones</CardTitle>
          <CardDescription>
            Conecta tus cuentas y sincroniza datos automáticamente. Las que aparecen como “Próximamente” todavía no están disponibles.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Bloque: Plataformas disponibles */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-foreground">Plataformas disponibles</h3>
            <p className="text-sm text-muted-foreground">
              Selecciona la plataforma que quieres conectar.
            </p>
          </div>
          <IntegrationsGridClient providers={available} connectUrls={{}} />

          {/* Separador visual */}
          <div className="my-6 h-px bg-border" />

          {/* Bloque: Próximamente */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-foreground">Próximamente</h3>
            <p className="text-sm text-muted-foreground">
              Estas integraciones estarán disponibles muy pronto.
            </p>
          </div>
          <IntegrationsGridClient providers={upcoming} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
