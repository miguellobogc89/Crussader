// app/components/admin/integrations/whatsapp/templates/TemplateMessagePreview.tsx
"use client";

type PreviewVariables = {
  nombre_cliente?: string;
  fecha_cita?: string;
  hora_cita?: string;
  nombre_negocio?: string;
};

const DEFAULT_VARIABLES: Required<PreviewVariables> = {
  nombre_cliente: "María",
  fecha_cita: "18 de marzo",
  hora_cita: "10:30",
  nombre_negocio: "Clínica Dental Central",
};

function applyVariables(
  text: string,
  variables?: PreviewVariables
) {
  const merged = {
    ...DEFAULT_VARIABLES,
    ...variables,
  };

  return String(text || "")
    .replaceAll("{{nombre_cliente}}", merged.nombre_cliente)
    .replaceAll("{{fecha_cita}}", merged.fecha_cita)
    .replaceAll("{{hora_cita}}", merged.hora_cita)
    .replaceAll("{{nombre_negocio}}", merged.nombre_negocio);
}

export default function TemplateMessagePreview({
  body,
  variables,
}: {
  body: string;
  variables?: PreviewVariables;
}) {
  const preview = applyVariables(body, variables);

  return (
    <div className="grid gap-2">
      <p className="text-xs font-semibold text-muted-foreground">
        Vista previa
      </p>

        <div className="max-w-[420px] rounded-2xl bg-white px-4 py-3 text-sm leading-6 shadow-sm">
          {preview || "Aquí verás cómo quedará el mensaje final."}
        </div>
    </div>
  );
}