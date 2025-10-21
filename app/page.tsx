"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  MessageSquare,
  Settings as SettingsIcon,
  Bell,
  ShieldCheck,
  Sparkles,
  Rocket,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe,
  Zap,
  Bot,
} from "lucide-react";

export default function MarketingLandingPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const landingOnly = process.env.NEXT_PUBLIC_LANDING_ONLY === "1"; // ← FLAG (no lo tocamos)

  // helpers para next targets
  const nextDashboard = encodeURIComponent("/dashboard");
  const nextReviews = encodeURIComponent("/dashboard/reviews");
  const nextRespSettings = encodeURIComponent("/dashboard/settings/responses");
  const nextReports = encodeURIComponent("/dashboard/reports");

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent"
          >
            Crussader
          </Link>

          <nav className="hidden gap-6 text-sm text-gray-600 md:flex">
            <a href="#features" className="hover:text-gray-900">Características</a>
            <a href="#how" className="hover:text-gray-900">Cómo funciona</a>
            <a href="#contact" className="hover:text-gray-900">Contacto</a>
          </nav>

          <div className="flex gap-3">
            <Link href={isLoggedIn ? "/dashboard" : `/auth/login?next=${nextDashboard}`}>
              <Button variant="outline" className="border-gray-300">
                {isLoggedIn ? "Ir al Dashboard" : "Iniciar sesión"}
              </Button>
            </Link>
            {!isLoggedIn && (
              <Link href={`/auth/register?next=${nextDashboard}`}>
                <Button className="bg-violet-600 hover:bg-violet-700">Registrarse</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-16 text-center">
        <div className="mx-auto max-w-5xl">
          <h1 className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-4xl font-extrabold leading-tight text-transparent md:text-6xl">
            Respuestas de IA para reseñas + ajustes de marca
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Define tu voz (tono, formalidad, emojis), recibe notificaciones inteligentes y gestiona todo desde un panel sencillo.
            Webchat embebible <span className="font-medium text-gray-800">próximamente</span>.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={isLoggedIn ? "/dashboard" : `/auth/register?next=${nextDashboard}`}>
              <Button size="lg" className="bg-violet-600 px-6 text-base hover:bg-violet-700">
                {isLoggedIn ? "Ir al Dashboard" : "Comenzar gratis"}
              </Button>
            </Link>
            <Link href={isLoggedIn ? "/dashboard/reviews" : `/auth/login?next=${nextReviews}`}>
              <Button size="lg" variant="outline" className="px-6 text-base">
                Ver demo
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Cumplimiento GDPR
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Datos cifrados en tránsito
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> Español / EN / PT / FR
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Onboarding en &lt; 5 min
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Características principales</h2>
            <p className="mt-2 text-lg text-gray-600">Todo lo que necesitas para responder mejor y más rápido.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-gray-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-violet-600 text-white">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle>Respuestas con IA</CardTitle>
                <CardDescription>
                  Respuestas coherentes con tu marca para reseñas de 1★ a 5★, con variantes y límites de caracteres.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-violet-600 text-white">
                  <SettingsIcon className="h-6 w-6" />
                </div>
                <CardTitle>Ajustes de voz</CardTitle>
                <CardDescription>
                  Tono, formalidad, emojis, calidez y firma/CTA. Reglas por estrellas y políticas de lenguaje.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-violet-600 text-white">
                  <Bell className="h-6 w-6" />
                </div>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>
                  Siempre, solo malas reseñas (≤2★) o nunca. Email e in-app; instantáneo, diario o semanal.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-violet-600 text-white">
                  <Bot className="h-6 w-6" />
                </div>
                <CardTitle>Webchat (próx.)</CardTitle>
                <CardDescription>
                  Widget flotante para tu web. IA + desvío a WhatsApp/email si es necesario.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-violet-600 text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle>Informes</CardTitle>
                <CardDescription>
                  Uso de respuestas, límites de plan y evolución (reportes en el panel).
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-violet-600 text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle>Privacidad</CardTitle>
                <CardDescription>
                  Bloqueo de palabras, evitar datos sensibles y control de publicación.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="how" className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Cómo funciona</h2>
              <p className="mt-2 text-gray-600">
                Configura tu voz de marca, recibe reseñas y publica respuestas listas en minutos.
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { icon: Sparkles, title: "Configura tu voz", desc: "Tono, formalidad, emojis y reglas por estrellas." },
                  { icon: MessageSquare, title: "Genera respuestas", desc: "Obtén 1–3 variantes y elige la mejor." },
                  { icon: ArrowRight, title: "Publica", desc: "Borrador o autopublicación (Google cuando esté disponible)." },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 rounded-md bg-violet-100 p-2 text-violet-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                <Link href={isLoggedIn ? "/dashboard/settings/responses" : `/auth/login?next=${nextRespSettings}`}>
                  <Button className="bg-violet-600 hover:bg-violet-700">Probar ajustes</Button>
                </Link>
                <Link href={isLoggedIn ? "/dashboard/reports" : `/auth/login?next=${nextReports}`}>
                  <Button variant="outline">Ver reportes</Button>
                </Link>
              </div>
            </div>

            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-600 text-white">
                  <Rocket className="h-8 w-8" />
                </div>
                <h3 className="text-center text-xl font-semibold">Listo en menos de 5 minutos</h3>
                <p className="mt-2 text-center text-gray-600">
                  Onboarding guiado desde el dashboard. Sin dependencias externas para empezar.
                </p>
                <div className="mt-6 grid gap-3 text-sm">
                  {["Sin tarjeta en la prueba", "Importa reseñas existentes", "Control total de tono y CTA"].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Métricas */}
      <section className="px-4 pb-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                99.9%
              </div>
              <p className="mt-1 text-sm text-gray-600">Uptime de la plataforma</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-extrabold">5★</div>
              <p className="mt-1 text-sm text-gray-600">Tono consistente con tu marca</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-extrabold">+70%</div>
              <p className="mt-1 text-sm text-gray-600">Ahorro de tiempo medio (MVP interno)</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center">
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-2xl font-bold text-transparent">
            Crussader
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
            <Link href="/legal/terms" className="hover:text-gray-900">Términos de servicio</Link>
            <span>•</span>
            <Link href="/legal/privacy" className="hover:text-gray-900">Privacidad</Link>
            <span>•</span>
            <Link href="/legal/support" className="hover:text-gray-900">Soporte</Link>
            <span>•</span>
            <a href="mailto:admin@crussader.com" className="hover:text-gray-900">Contacto</a>
          </div>
          <p className="mt-3 text-xs text-gray-500">© {new Date().getFullYear()} Crussader. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
