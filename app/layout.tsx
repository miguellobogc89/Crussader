// app/layout.tsx
import "./globals.css";
import Providers from "./providers";
import QueryProvider from "./providers/QueryProvider";

export const metadata = {
  metadataBase: new URL("https://www.crussader.com"), // ← cambia al dominio real
  title: {
    default: "Crussader — Respuestas de IA para reseñas",
    template: "%s · Crussader",
  },
  description:
    "Gestiona reseñas con IA: voz de marca, notificaciones y reportes. Webchat próximamente.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Crussader — Respuestas de IA para reseñas",
    description: "Configura tu voz de marca y responde reseñas en minutos.",
    url: "https://www.crussader.com",
    siteName: "Crussader",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Crussader" }],
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crussader - Respuestas de IA para reseñas",
    description:
      "Voz de marca, notificaciones y reportes. Webchat próximamente.",
    images: ["/og.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  keywords: [
    "reseñas",
    "ia",
    "google",
    "respuesta automática",
    "negocios",
    "notificaciones",
    "panel",
  ],
  creator: "Crussader",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <QueryProvider>
          <Providers>{children}</Providers>
        </QueryProvider>
        <script
          src="/webchat/wc.js"
          async
          data-key="demo-public-key-123"
          data-color="#10b981"
          data-position="left"
          data-greeting="Hola 👋 soy tu asistente Crussader"
          data-auto-open="false"
          data-greet-on="open"
        />
        <script dangerouslySetInnerHTML={{
          __html: `
            window.crussaderChat && window.crussaderChat('identify', { email: 'demo@cliente.com', name: 'Cliente Demo' });
            console.log('[landing] webchat script insertado');
          `
        }} />

      </body>
    </html>
  );
}
