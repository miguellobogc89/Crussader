// app/components/admin/integrations/whatsapp/templates/TemplatesAddDialog.tsx
"use client";

import { useRef, useState } from "react";
import { useBootstrapStore } from "@/app/providers/bootstrap-store";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import TemplateMessagePreview from "./TemplateMessagePreview";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";

import { Plus } from "lucide-react";

type TemplateCategory = "marketing" | "utility" | "authentication";

function slugifyTemplateName(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}

const AVAILABLE_VARIABLES = [
  {
    key: "{{nombre_cliente}}",
    label: "Nombre del cliente",
  },
  {
    key: "{{fecha_cita}}",
    label: "Fecha de la cita",
  },
  {
    key: "{{hora_cita}}",
    label: "Hora de la cita",
  },
  {
    key: "{{nombre_negocio}}",
    label: "Nombre del negocio",
  },
];

function validateTemplate(body: string) {
  const errors: string[] = [];
  const warnings: string[] = [];

  const trimmed = body.trim();

  if (!trimmed) {
    errors.push("El contenido no puede estar vacío.");
  }

  const variables =
    trimmed.match(/\{\{(.*?)\}\}/g) ?? [];

  if (variables.length > 4) {
    errors.push("Solo puedes usar hasta 4 variables.");
  }

  if (/^\s*\{\{.*?\}\}/.test(trimmed)) {
    errors.push("La plantilla no puede empezar por una variable.");
  }

  if (/\{\{.*?\}\}\s*$/.test(trimmed)) {
    errors.push("La plantilla no puede terminar en una variable.");
  }

  if (/ {4,}/.test(trimmed)) {
    errors.push("No se permiten múltiples espacios seguidos.");
  }

  if (trimmed.length < 15) {
    warnings.push("El mensaje es demasiado corto.");
  }

  if (
    variables.length >= 3 &&
    trimmed.length < 40
  ) {
    warnings.push(
      "Hay demasiadas variables para tan poco texto."
    );
  }

  return {
    errors,
    warnings,
  };
}

export default function TemplatesAddDialog({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const companyId = useBootstrapStore(
    (s) => s.data?.activeCompanyResolved?.id ?? null
  );

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("marketing");
  const [bodyPreview, setBodyPreview] = useState("");
  const validation = validateTemplate(bodyPreview);
const canSave = validation.errors.length === 0;

  function resetForm() {
    setTitle("");
    setCategory("marketing");
    setBodyPreview("");
    setError("");
    setSaving(false);
  }

  function insertVariable(token: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      setBodyPreview((prev) => `${prev}${token}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = bodyPreview;

    const before = currentValue.slice(0, start);
    const after = currentValue.slice(end);
    const nextValue = `${before}${token}${after}`;

    setBodyPreview(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const nextCursor = start + token.length;
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }

  async function handleSave() {
    if (!companyId) {
      setError("No se ha encontrado la empresa activa.");
      return;
    }

    const cleanTitle = title.trim();
    const cleanTemplateName = slugifyTemplateName(title);
    const cleanBody = bodyPreview.trim();

    if (!cleanTitle) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!cleanBody) {
      setError("El contenido es obligatorio.");
      return;
    }

    if (!cleanTemplateName) {
      setError("No se pudo generar el nombre interno.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/whatsapp/templates/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          title: cleanTitle,
          template_name: cleanTemplateName,
          category,
          body_preview: cleanBody,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let message = "No se pudo crear la plantilla.";

        if (data && typeof data.error === "string" && data.error.length > 0) {
          message = data.error;
        }

        setError(message);
        setSaving(false);
        return;
      }

      if (!data || data.ok !== true) {
        setError("No se pudo crear la plantilla.");
        setSaving(false);
        return;
      }

      resetForm();
      setOpen(false);

      if (onCreated) {
        onCreated();
      }
    } catch (e) {
      console.error("[TemplatesAddDialog]", e);
      setError("Error de red al crear la plantilla.");
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="h-9 shrink-0 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Plantilla
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[920px]">
        <DialogHeader>
          <DialogTitle>Nueva plantilla</DialogTitle>
          <DialogDescription>
            Crea el mensaje y usa variables para personalizarlo sin complicarte.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2 lg:grid-cols-[1fr_260px]">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Recordatorio cita amable"
              />
            </div>

            <div className="grid gap-2">
              <Label>Categoría</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="marketing">Marketing</option>
                <option value="utility">Utility</option>
                <option value="authentication">Authentication</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Mensaje</Label>
              <Textarea
                ref={textareaRef}
                value={bodyPreview}
                onChange={(e) => setBodyPreview(e.target.value)}
                placeholder="Hola {{nombre_cliente}}, te recordamos tu cita el {{fecha_cita}} a las {{hora_cita}}."
                className="min-h-[260px]"
              />
{validation.errors.length > 0 ? (
  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
    {validation.errors.map((error) => (
      <p key={error}>• {error}</p>
    ))}
  </div>
) : validation.warnings.length > 0 ? (
  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
    {validation.warnings.map((warning) => (
      <p key={warning}>• {warning}</p>
    ))}
  </div>
) : null}
              <TemplateMessagePreview body={bodyPreview} />
              <p className="text-xs text-muted-foreground">
                Haz clic en una variable de la derecha para insertarla.
              </p>
            </div>

            {error ? <div className="text-sm text-rose-600">{error}</div> : null}
          </div>

          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold">Variables disponibles</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Inserta datos dinámicos con un clic.
              </p>
            </div>

            <div className="space-y-2">
              {AVAILABLE_VARIABLES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => insertVariable(item.key)}
                  className="w-full rounded-lg border bg-background px-3 py-3 text-left transition hover:bg-muted"
                >
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {item.key}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cerrar
          </Button>

<Button
  onClick={handleSave}
  disabled={saving || !companyId || !canSave}
>
  {saving ? "Guardando..." : "Guardar"}
</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}