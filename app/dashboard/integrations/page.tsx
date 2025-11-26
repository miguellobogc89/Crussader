// app/dashboard/integrations/page.tsx
import PageShell from "@/app/components/layouts/PageShell";
import IntegrationsGridClient from "@/app/components/integrations/IntegrationsGridClient";
import {
  type Provider,
} from "@/app/components/integrations/IntegrationPlatformCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  // Plataformas disponibles (ya operativas / prioridad alta)
  const available: Provider[] = [
    {
      key: "google",
      name: "Google Business Profile",
      description: "Conecta tu ficha de empresa y sincroniza reseñas.",
      brandIconSrc: "/platform-icons/google-business.png",
      brandIconAlt: "Google Business",
    },
    {
      key: "calendar",
      name: "Google Calendar",
      description: "Sincroniza citas y disponibilidad con Google Calendar.",
      brandIconSrc: "/platform-icons/google-calendar.png",
      brandIconAlt: "Google Calendar",
    },
    {
      key: "whatsapp",
      name: "WhatsApp",
      description:
        "Centraliza conversaciones y automatiza respuestas con WhatsApp.",
      brandIconSrc: "/platform-icons/whatsapp.png",
      brandIconAlt: "WhatsApp",
    },
    {
      key: "facebook",
      name: "Facebook",
      description:
        "Conecta tu página para centralizar reseñas y mensajes en un único panel.",
      brandIconSrc: "/platform-icons/facebook.png",
      brandIconAlt: "Facebook",
    },
    {
      key: "gmail",
      name: "Gmail",
      description: "Conecta tu bandeja de entrada para leer y gestionar emails.",
      brandIconSrc: "/platform-icons/gmail.png",
      brandIconAlt: "Gmail",
    },
  ];

  // Próximamente / en desarrollo
  const upcoming: Provider[] = [
    {
      key: "instagram",
      name: "Instagram",
      description:
        "Gestiona mensajes y comentarios desde tu cuenta profesional.",
      brandIconSrc: "/platform-icons/instagram.png",
      brandIconAlt: "Instagram",
      comingSoon: true,
    },
    {
      key: "tripadvisor",
      name: "TripAdvisor",
      description: "Sincroniza reseñas y responde desde Crussader.",
      brandIconSrc: "/platform-icons/tripadvisor.png",
      brandIconAlt: "TripAdvisor",
      comingSoon: true,
    },
    {
      key: "trustpilot",
      name: "Trustpilot",
      description: "Importa valoraciones y analiza tendencias.",
      brandIconSrc: "/platform-icons/trustpilot.png",
      brandIconAlt: "Trustpilot",
      comingSoon: true,
    },
    {
      key: "yelp",
      name: "Yelp",
      description:
        "Centraliza tus reseñas de Yelp y automatiza respuestas con IA.",
      brandIconSrc: "/platform-icons/yelp.png",
      brandIconAlt: "Yelp",
      comingSoon: true,
    },
    {
      key: "booking",
      name: "Booking.com",
      description: "Conecta tu alojamiento y gestiona reseñas y reservas.",
      brandIconSrc: "/platform-icons/booking.png",
      brandIconAlt: "Booking",
      comingSoon: true,
    },
  ];

  return (
    <PageShell
      title="Integraciones"
      description="Escaparate de integraciones disponibles y próximas para tu cuenta."
      titleIconName="Plug"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Integraciones
          </CardTitle>
          <CardDescription>
            Consulta qué plataformas puedes conectar hoy y cuáles llegarán
            próximamente.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Bloque: Plataformas disponibles */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-foreground">
              Plataformas disponibles
            </h3>
            <p className="text-sm text-muted-foreground">
              Estas integraciones ya están o estarán operativas en Crussader.
            </p>
          </div>
          <IntegrationsGridClient providers={available} />

          {/* Separador visual */}
          <div className="my-6 h-px bg-border" />

          {/* Bloque: Próximamente */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-foreground">
              Próximamente
            </h3>
            <p className="text-sm text-muted-foreground">
              Integraciones en desarrollo que se irán activando en los
              próximos meses.
            </p>
          </div>
          <IntegrationsGridClient providers={upcoming} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
