// app/components/admin/integrations/whatsapp/templates/TemplateDetailsPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Edit3,
  Plus,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

import type {
  TemplateCategory,
  TemplateStatus,
  TemplateUse,
  WaTemplate,
} from "./types";

import { extractVars } from "./utils";

type VariableValue = {
  key: string;
  label: string;
  value: string;
};

function statusLabel(status: TemplateStatus) {
  if (status === "approved") return "Aprobada";
  if (status === "pending") return "En revisión";
  if (status === "rejected") return "Rechazada";
  return "Borrador";
}

function statusIcon(status: TemplateStatus) {
  if (status === "approved") return CheckCircle2;
  if (status === "pending") return Clock;
  return XCircle;
}

function statusClass(status: TemplateStatus) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "pending") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (status === "rejected") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function categoryLabel(category: TemplateCategory) {
  if (category === "marketing") return "Marketing";
  if (category === "utility") return "Utilidad";
  return "Autenticación";
}

function useLabel(use?: TemplateUse) {
  if (use === "start_conversation") return "Puede iniciar conversación";
  return "Dentro de ventana 24h";
}

function cleanName(name: string) {
  return name.replaceAll("_", " ");
}

function defaultLabel(index: number) {
  const labels = [
    "Nombre cliente",
    "Fecha",
    "Hora",
    "Servicio",
    "Clínica",
    "Profesional",
  ];

  return labels[index] || `Dato ${index + 1}`;
}

function defaultValue(index: number) {
  const values = [
    "María",
    "mié 19/03",
    "17:30",
    "Limpieza dental",
    "Clínica Moderna",
    "Dr. Martínez",
  ];

  return values[index] || `Ejemplo ${index + 1}`;
}

function buildInitialVariables(body: string): VariableValue[] {
  return extractVars(body).map((key, index) => ({
    key,
    label: defaultLabel(index),
    value: defaultValue(index),
  }));
}

function renderBodyWithPills(body: string, variables: VariableValue[]) {
  const parts: Array<string | VariableValue> = [];
  let remaining = body;

  while (remaining.length > 0) {
    const match = remaining.match(/\{\{\d+\}\}/);

    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }

    if (match.index > 0) {
      parts.push(remaining.slice(0, match.index));
    }

    const variable = variables.find((item) => item.key === match[0]);

    if (variable) {
      parts.push(variable);
    } else {
      parts.push(match[0]);
    }

    remaining = remaining.slice(match.index + match[0].length);
  }

  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === "string") {
          return <span key={index}>{part}</span>;
        }

        return (
          <span
            key={`${part.key}-${index}`}
            className="mx-0.5 inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
          >
            {part.label}
          </span>
        );
      })}
    </>
  );
}

function renderPreview(body: string, variables: VariableValue[]) {
  let result = body;

  variables.forEach((variable) => {
    result = result.replaceAll(variable.key, variable.value || variable.label);
  });

  return result;
}

export default function TemplateDetailsPanel({
  selected,
}: {
  selected: WaTemplate | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [variables, setVariables] = useState<VariableValue[]>([]);

  useEffect(() => {
    if (!selected) {
      setVariables([]);
      setIsEditing(false);
      return;
    }

    setVariables(buildInitialVariables(selected.body));
    setIsEditing(false);
  }, [selected]);

  const previewBody = useMemo(() => {
    if (!selected) return "";
    return renderPreview(selected.body, variables);
  }, [selected, variables]);

  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f8fafc] p-6">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            Selecciona una plantilla
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Verás aquí el mensaje y su estado en WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcon(selected.status);

  function updateVariable(index: number, patch: Partial<VariableValue>) {
    setVariables((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex === index) {
          return {
            ...item,
            ...patch,
          };
        }

        return item;
      }),
    );
  }

  function addVariable() {
    const nextIndex = variables.length;
    const nextKey = `{{${nextIndex + 1}}}`;

    setVariables((current) => [
      ...current,
      {
        key: nextKey,
        label: defaultLabel(nextIndex),
        value: defaultValue(nextIndex),
      },
    ]);
  }

return (
  <div className="flex h-full min-h-0 flex-col bg-white">
    <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-950">
            {selected.title || cleanName(selected.name)}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                statusClass(selected.status),
              ].join(" ")}
            >
              <StatusIcon className="h-3 w-3" />
              {statusLabel(selected.status)}
            </span>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {categoryLabel(selected.category)}
            </span>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {selected.language.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
<Button
  type="button"
  variant="outline"
  onClick={() => setIsEditing(true)}
  disabled={isEditing}
  className="h-8 rounded-lg px-3 text-xs disabled:opacity-50"
>
  <Edit3 className="mr-1.5 h-3.5 w-3.5" />
  Editar
</Button>

          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-lg border-rose-200 px-3 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>

    <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Contenido del mensaje
            </p>

            <div className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800">
              {renderBodyWithPills(selected.body, variables)}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Variables
              </p>
            </div>

            {variables.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Esta plantilla no necesita datos variables.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {variables.map((variable, index) => (
                  <div
                    key={variable.key}
                    className="grid min-h-[42px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:grid-cols-[70px_1fr_1fr]"
                  >
                    <span className="w-fit rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                      {variable.key}
                    </span>

                    {isEditing ? (
                      <Input
                        value={variable.label}
                        onChange={(event) =>
                          updateVariable(index, {
                            label: event.target.value,
                          })
                        }
                        className="h-8 rounded-lg bg-white text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-800">
                        {variable.label}
                      </p>
                    )}

                    {isEditing ? (
                      <Input
                        value={variable.value}
                        onChange={(event) =>
                          updateVariable(index, {
                            value: event.target.value,
                          })
                        }
                        className="h-8 rounded-lg bg-white text-sm"
                      />
                    ) : (
                      <p className="text-right text-xs italic text-slate-500">
                        ej. "{variable.value}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>


        </section>

<aside>
  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
    Vista previa
  </p>

  <div className="rounded-[24px] border-[7px] border-slate-900 bg-slate-900 shadow-xl">
    <div className="rounded-t-[16px] bg-emerald-700 px-3 py-2.5">
      <p className="text-xs font-semibold text-white">
        Clínica Moderna
      </p>
      <p className="text-[10px] text-emerald-100">
        en línea
      </p>
    </div>

    <div className="min-h-[250px] rounded-b-[16px] bg-[#e7f3df] p-3">
      <div className="max-w-[90%] rounded-xl rounded-tl-sm bg-white p-2.5 shadow-sm">
        <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-slate-800">
          {previewBody}
        </p>

        <p className="mt-1 text-right text-[9px] text-slate-400">
          14:32
        </p>
      </div>
    </div>
  </div>

  <div className="mt-4 flex justify-end gap-2">
  {isEditing ? (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsEditing(false)}
        className="h-9 rounded-xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Cancelar
      </Button>

      <Button
        type="button"
        className="h-9 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Send className="mr-2 h-4 w-4" />
        Enviar a revisión
      </Button>
    </>
  ) : null}
</div>
</aside>

  <div className="mt-4 flex justify-end gap-2">
    {isEditing ? (
      <Button
        type="button"
        variant="outline"
        onClick={addVariable}
        className="h-9 rounded-xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Plus className="mr-2 h-4 w-4" />
        Añadir variable
      </Button>
    ) : null}
  </div>



      </div>
    </div>
  </div>
);
}