// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./providers";
import QueryProvider from "./providers/QueryProvider";
import { ToastProvider } from "@/app/components/crussader/UX/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://www.crussader.com"),
  title: {
    default: "Crussader",
    template: "%s · Crussader",
  },
  description: "Gestiona reseñas con IA: voz de marca, notificaciones y reportes.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Crussader",
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
    description: "Voz de marca, notificaciones y reportes.",
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
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground font-sans">
        <QueryProvider>
          <Providers>
            <ToastProvider>{children}</ToastProvider>
          </Providers>
        </QueryProvider>
      </body>
    </html>
  );
}
