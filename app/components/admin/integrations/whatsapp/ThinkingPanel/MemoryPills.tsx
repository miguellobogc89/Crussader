// app/components/admin/integrations/whatsapp/ThinkingPanel/MemoryPills.tsx
"use client";

export default function MemoryPills({
  values,
}: {
  values: string[];
}) {
  return (
    <div className="pt-3">
      <div className="text-[11px] text-muted-foreground">Memoria</div>

      <div className="mt-2 flex flex-wrap gap-2">
        {values.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            Sin datos en memoria todavía.
          </div>
        ) : (
          values.map((value) => (
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