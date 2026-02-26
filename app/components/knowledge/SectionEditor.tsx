// app/components/knowledge/SectionEditor.tsx
import React from "react";
import { prisma } from "@/lib/prisma";
import { saveSection, assertCompanyOwnership } from "./sections-actions";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import SubmitButton from "@/app/components/ui/SubmitButton";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { Globe, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SectionEditor({
  selectedId,
  basePath,
  companyId,
}: {
  selectedId?: string;
  basePath: string;
  companyId: string;
}) {
  await assertCompanyOwnership(companyId);

  // Contenedor full-height para que el scroll quede dentro
  if (!selectedId) {
    const any = await prisma.knowledgeSection.findFirst({
      where: { companyId, isActive: true },
      orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    });

    return (
      <div className="h-full min-h-0 p-6 overflow-hidden">
        <Card className="h-full min-h-0 flex flex-col">
          <CardHeader>
            <CardTitle>
              {any ? "Selecciona una sección" : "Empieza creando una sección"}
            </CardTitle>
            <CardDescription>
              {any
                ? "Elige una sección en la izquierda para editarla."
                : "Usa el panel izquierdo para añadir tu primera sección."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const section = await prisma.knowledgeSection.findUnique({
    where: { id: selectedId },
    select: {
      id: true,
      title: true,
      visibility: true,
      content: true,
      updatedAt: true,
      companyId: true,
    },
  });

  if (!section || section.companyId !== companyId) {
    return (
      <div className="h-full min-h-0 p-6 overflow-hidden">
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Acceso denegado</CardTitle>
            <CardDescription>
              Esta sección no existe o no pertenece a la empresa seleccionada.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isPublic = section.visibility === "PUBLIC";

  return (
    // Scroll SOLO en este panel derecho
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="p-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-xl font-semibold line-clamp-1">
                  {section.title || "(sin título)"}
                </CardTitle>
                <CardDescription className="mt-1">
                  Última edición: {new Date(section.updatedAt!).toLocaleString()}
                </CardDescription>
              </div>

              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs bg-muted/30"
                title={isPublic ? "Visible para el asistente" : "Solo interno"}
              >
                {isPublic ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {isPublic ? "Public" : "Private"}
              </div>
            </div>
          </CardHeader>

          <Separator />

          <form key={section.updatedAt?.toISOString()} action={saveSection}>
            <CardContent className="space-y-6 pt-6">
              <input type="hidden" name="id" value={section.id} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2 lg:col-span-1">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={section.title ?? ""}
                    placeholder="Ej. Información general"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label>Visibilidad</Label>
                  <Select name="visibility" defaultValue={section.visibility}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecciona visibilidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">PUBLIC (Webchat)</SelectItem>
                      <SelectItem value="PRIVATE">PRIVATE (Interno)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    PUBLIC: se puede usar en respuestas externas. PRIVATE: solo
                    en entorno autenticado.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={section.content ?? ""}
                  placeholder="Horarios, dirección, servicios, políticas de reserva..."
                  rows={18}
                  className="font-mono text-[13px] leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">
                  Puedes usar texto libre o Markdown.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <a
                  href={`${basePath}?companyId=${companyId}&sectionId=${section.id}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Cancelar
                </a>
                <SubmitButton className="px-4">Guardar cambios</SubmitButton>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}