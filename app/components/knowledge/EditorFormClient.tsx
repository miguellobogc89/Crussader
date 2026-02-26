// app/dashboard/knowledge/EditorFormClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Separator } from "@/app/components/ui/separator";
import SubmitButton from "@/app/components/ui/SubmitButton";

export function EditorFormClient({
  basePath,
  sectionId,
  initialContent,
  action,
}: {
  basePath: string;
  sectionId: string;
  initialContent: string;
  action: (fd: FormData) => void;
}) {
  const [content, setContent] = useState(initialContent);
  const isDirty = useMemo(() => content !== initialContent, [content, initialContent]);

  return (
    <form
      action={action}
      className="h-full min-h-0 flex flex-col"
      onSubmit={(e) => {
        if (!isDirty) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={sectionId} />

      <div className="flex-1 min-h-0 overflow-hidden px-6">
        <div className="space-y-2">
          <Label htmlFor="content" className="text-slate-700">
            Contenido
          </Label>

          <Textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Horarios, dirección, servicios, políticas de reserva..."
            rows={10}
            className="bg-slate-50 border-slate-200/70 font-mono text-[13px] leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <p className="text-[11px] text-muted-foreground">
            Puedes usar texto libre o Markdown.
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 bg-white/92 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="px-6">
          <Separator className="bg-slate-200/70" />
        </div>

        <div className="px-6 py-3 flex items-center justify-end gap-3">
          <a
            href={`${basePath}?sectionId=${sectionId}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            Cancelar
          </a>

          <div className={isDirty ? "" : "pointer-events-none opacity-50"}>
            <SubmitButton className="px-4">Guardar cambios</SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}