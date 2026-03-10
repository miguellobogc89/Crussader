// app/components/admin/integrations/whatsapp/ThinkingPanel/MemoryPills.tsx
"use client";

type MemoryEntry = {
  key: string;
  rawValue: string;
};

function parseValue(input: string): MemoryEntry {
  const text = String(input || "").trim();
  const idx = text.indexOf(":");

  if (idx === -1) {
    return {
      key: "",
      rawValue: text,
    };
  }

  return {
    key: text.slice(0, idx).trim(),
    rawValue: text.slice(idx + 1).trim(),
  };
}

function formatReason(value: string): string {
  if (value === "appointment_management") {
    return "Gestionar cita";
  }

  if (value === "information_request") {
    return "Información";
  }

  if (value === "human_handoff") {
    return "Derivar a humano";
  }

  if (value === "complaint_intake") {
    return "Registrar incidencia";
  }

  if (value === "out_of_scope") {
    return "Fuera de alcance";
  }

  return value;
}

function formatSubReason(value: string): string {
  if (value === "new") {
    return "Nueva cita";
  }

  if (value === "change") {
    return "Cambiar cita";
  }

  if (value === "confirm") {
    return "Confirmar cita";
  }

  if (value === "cancel") {
    return "Cancelar cita";
  }

  return value;
}

function formatStep(value: string): string {
  if (value === "awaiting_service") {
    return "Esperando servicio";
  }

  if (value === "awaiting_service_confirmation") {
    return "Confirmando servicio";
  }

  if (value === "awaiting_location") {
    return "Esperando ubicación";
  }

  if (value === "awaiting_datetime") {
    return "Esperando fecha y hora";
  }

  return value;
}

function buildVisiblePills(values: string[]): string[] {
  const entries = values.map(parseValue);

  let hasSubReason = false;
  for (const entry of entries) {
    if (entry.key === "subReason" && entry.rawValue) {
      hasSubReason = true;
      break;
    }
  }

  const pills: string[] = [];

  for (const entry of entries) {
    if (!entry.key) {
      if (entry.rawValue) {
        pills.push(entry.rawValue);
      }
      continue;
    }

    if (entry.key === "reason") {
      if (hasSubReason) {
        continue;
      }

      const label = formatReason(entry.rawValue);
      if (label) {
        pills.push(label);
      }
      continue;
    }

    if (entry.key === "subReason") {
      const label = formatSubReason(entry.rawValue);
      if (label) {
        pills.push(label);
      }
      continue;
    }

    if (entry.key === "step") {
      const label = formatStep(entry.rawValue);
      if (label) {
        pills.push(label);
      }
      continue;
    }

    if (entry.rawValue) {
      pills.push(entry.key + ": " + entry.rawValue);
    }
  }

  return pills;
}

export default function MemoryPills({
  values,
}: {
  values: string[];
}) {
  const visiblePills = buildVisiblePills(values);

  return (
    <div className="pt-3">
      <div className="text-[11px] text-muted-foreground">Memoria</div>

      <div className="mt-2 flex flex-wrap gap-2">
        {visiblePills.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            Sin datos en memoria todavía.
          </div>
        ) : (
          visiblePills.map((value) => (
            <div
              key={value}
              className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-[11px] font-medium"
              title={value}
            >
              {value}
            </div>
          ))
        )}
      </div>
    </div>
  );
}