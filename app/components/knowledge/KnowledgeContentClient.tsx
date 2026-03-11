// app/dashboard/knowledge/KnowledgeContentClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { Textarea } from "@/app/components/ui/textarea";
import { Separator } from "@/app/components/ui/separator";
import SubmitButton from "@/app/components/ui/SubmitButton";
import { Button } from "@/app/components/ui/button";

export function KnowledgeContentClient({
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
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [content, setContent] = useState(initialContent);

  const isDirty = useMemo(() => content !== initialContent, [content, initialContent]);

  if (mode === "view") {
    return (
      <div className="h-full min-h-0 overflow-hidden flex flex-col">
        <div className="px-6 pb-3 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setMode("edit")}>
            Editar
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-10">
          <div className="prose prose-slate max-w-none prose-headings:scroll-mt-20">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {content && content.trim().length > 0 ? content : "_(vacío)_"}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="h-full min-h-0 overflow-hidden flex flex-col"
      onSubmit={() => setMode("view")}
    >
      <input type="hidden" name="id" value={sectionId} />

      <div className="flex-1 min-h-0 overflow-hidden px-6">
        <Textarea
          id="content"
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="bg-slate-50 border-slate-200/70 font-mono text-[13px] leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Escribe en Markdown…"
        />
      </div>

      <div className="sticky bottom-0 z-10 bg-white/92 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="px-6">
          <Separator className="bg-slate-200/70" />
        </div>

        <div className="px-6 py-3 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => setMode("view")}>
            Ver
          </Button>

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