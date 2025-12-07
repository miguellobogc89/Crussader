"use client";

import { useState, FormEvent } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/app/components/ui/accordion";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Loader2, LifeBuoy, Mail } from "lucide-react";

// 🔔 Ajusta esta ruta a donde tengas el ToastProvider/useToast
import { useToast } from "@/app/components/crussader/UX/Toast";

export default function SupportPage() {
  const [contactOpen, setContactOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { showToast } = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      showToast({
        variant: "error",
        title: "Mensaje incompleto",
        message: "Rellena el asunto y cuéntanos qué ha pasado.",
      });
      return;
    }

    try {
      setSending(true);

      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      if (!res.ok) {
        throw new Error("Error al enviar el mensaje");
      }

      // Éxito: cerramos modal, reseteamos campos y toast verde
      setContactOpen(false);
      setSubject("");
      setMessage("");

      showToast({
        variant: "success",
        title: "Mensaje enviado",
        message:
          "Hemos recibido tu mensaje de soporte. Te responderemos lo antes posible.",
      });
    } catch {
      showToast({
        variant: "error",
        title: "No se ha podido enviar",
        message:
          "No hemos podido enviar el mensaje. Inténtalo de nuevo en unos minutos.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <PageShell
      title="Soporte"
      titleIconName="LifeBuoy"
      description="Resolvemos tus dudas sobre Crussader y las integraciones."
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {/* Cabecera visual */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
              <LifeBuoy className="h-6 w-6 text-sky-500" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Centro de ayuda de Crussader
              </CardTitle>
              <CardDescription className="text-slate-500">
                Encuentra respuestas rápidas o escríbenos directamente.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Preguntas frecuentes */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              Preguntas frecuentes
            </CardTitle>
            <CardDescription className="text-slate-500">
              Hemos recopilado las dudas más habituales sobre reseñas, IA y
              conexiones con Google.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full space-y-2">
              <AccordionItem
                value="faq-1"
                className="rounded-lg border border-slate-200 px-4"
              >
                <AccordionTrigger className="text-left text-slate-900">
                  ¿Cómo se generan las respuestas automáticas a las reseñas?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">
                  Crussader analiza el texto de la reseña, el rating, el idioma
                  y las preferencias de tu marca (tono, emojis, CTA, etc.) para
                  proponer una respuesta coherente y personalizada. Tú decides
                  si quieres revisarlas antes de publicar o dejarlas en modo
                  autopublicación.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-2"
                className="rounded-lg border border-slate-200 px-4"
              >
                <AccordionTrigger className="text-left text-slate-900">
                  ¿Puedo limitar qué personas de mi equipo pueden responder?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">
                  Sí. Desde la sección de empresa puedes configurar qué usuarios
                  tienen permisos para responder reseñas, configurar la IA o
                  conectar nuevas ubicaciones de Google Business Profile.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-3"
                className="rounded-lg border border-slate-200 px-4"
              >
                <AccordionTrigger className="text-left text-slate-900">
                  ¿Cada cuánto se sincronizan las reseñas nuevas?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">
                  Revisamos periódicamente tus ubicaciones conectadas y traemos
                  las reseñas nuevas para que puedas gestionarlas desde el
                  panel. También puedes forzar una actualización manual en la
                  sección de integraciones.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-4"
                className="rounded-lg border border-slate-200 px-4"
              >
                <AccordionTrigger className="text-left text-slate-900">
                  ¿Qué pasa si desconecto mi cuenta de Google Business?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">
                  Dejaremos de sincronizar reseñas nuevas y no podremos publicar
                  respuestas en tu nombre, pero no borraremos ningún histórico
                  que ya exista en Crussader. Siempre puedes volver a conectar
                  tu cuenta más adelante.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-5"
                className="rounded-lg border border-slate-200 px-4"
              >
                <AccordionTrigger className="text-left text-slate-900">
                  ¿Cómo protegéis los datos de mis clientes?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">
                  Tratamos los datos siguiendo buenas prácticas de seguridad y
                  solo los usamos para prestar el servicio (análisis y
                  respuesta de reseñas). Puedes consultar todos los detalles en
                  nuestra política de privacidad.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* CTA contacto */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardContent className="flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">
                ¿No encuentras lo que necesitas?
              </p>
              <p className="text-sm text-slate-600">
                Escríbenos y cuéntanos qué ha pasado. Te responderemos a tu
                correo con la solución o próximos pasos.
              </p>
            </div>
            <Button
              onClick={() => {
                setContactOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-2 sm:mt-0"
            >
              <Mail className="h-4 w-4" />
              Contacta con nosotros
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de contacto */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="border border-slate-200 bg-white shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              Contactar con soporte
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Este mensaje llegará a nuestro equipo de soporte. Te escribiremos
              de vuelta a tu correo de acceso a Crussader.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Asunto
              </label>
              <Input
                placeholder="Por ejemplo: Problema al conectar Google Business"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Cuéntanos qué ha pasado
              </label>
              <Textarea
                rows={5}
                placeholder="Describe el problema, qué estabas haciendo y cualquier detalle que nos pueda ayudar a reproducirlo."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-white"
              />
            </div>

            <DialogFooter className="mt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-300"
                onClick={() => setContactOpen(false)}
                disabled={sending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  "Enviar mensaje"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
