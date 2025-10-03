import React from "react";
import { prisma } from "@/lib/prisma";
import { saveSection, assertCompanyOwnership } from "./sections-actions";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import SubmitButton from "@/app/components/ui/SubmitButton";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";

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

  if (!selectedId) {
    const any = await prisma.knowledgeSection.findFirst({
      where: { companyId, isActive: true },
      orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    });
    if (!any) {
      return (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Empieza creando una sección</CardTitle>
            <CardDescription>
              Usa el formulario de la izquierda para añadir tu primera sección.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selecciona una sección</CardTitle>
          <CardDescription>
            Elige una sección en la barra lateral para editar su contenido.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const section = await prisma.knowledgeSection.findUnique({
    where: { id: selectedId },
    select: { id: true, title: true, visibility: true, content: true, updatedAt: true, companyId: true },
  });

  if (!section || section.companyId !== companyId) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Acceso denegado</CardTitle>
          <CardDescription>Esta sección no existe o no pertenece a la empresa seleccionada.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {section.title || "(sin título)"}
          </CardTitle>
          <CardDescription>
            Última edición: {new Date(section.updatedAt!).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <Separator />
        <form key={section.updatedAt?.toISOString()} action={saveSection}>
          <CardContent className="space-y-6 pt-6">
            <input type="hidden" name="id" value={section.id} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" defaultValue={section.title ?? ""} placeholder="Ej. Información general" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Visibilidad</Label>
                <Select name="visibility" defaultValue={section.visibility}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona visibilidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">PUBLIC</SelectItem>
                    <SelectItem value="PRIVATE">PRIVATE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={section.content ?? ""}
                placeholder="Horarios, dirección, servicios, reservas, etc."
                rows={18}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Consejo: puedes usar formato libre/Markdown.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <a
                href={`${basePath}?companyId=${companyId}&sectionId=${section.id}`}
                className="text-sm text-muted-foreground hover:underline"
              >
                Cancelar
              </a>
              <SubmitButton>Guardar cambios</SubmitButton>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
