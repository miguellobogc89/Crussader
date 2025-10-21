"use client";

import PageShell from "@/app/components/layouts/PageShell";
import { MessageSquare } from "lucide-react";

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-black/70 text-white text-xs px-2 py-0.5 shadow-sm">
      {label}
    </span>
  );
}

export default function PageUX() {
  return (
    <PageShell
      title="Reseñas"
      titleIconName="MessageSquare"        // icono a color grande
      description="Lee y responde a tus reseñas"
      toolbar={
        <div className="rounded-md border bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <Chip label="Toolbar" /> Esta barra vive dentro del área de encabezado.
        </div>
      }
    >
      {/* ======= BODY: todo lo que pongas aquí vive dentro de PageBody ======= */}
      <div className="space-y-6">
        <div className="relative rounded-lg border bg-blue-50 p-4">
          <div className="absolute left-3 top-3">
            <Chip label="PageHeader (auto-render por PageShell)" />
          </div>
          <p className="mt-8 text-sm text-blue-900">
            El área azul representa el <strong>header</strong> que genera automáticamente <code>PageShell</code> usando
            las props <code>title</code>, <code>description</code> y opcionalmente <code>toolbar</code> /{" "}
            <code>breadcrumbsSlot</code>.
          </p>
        </div>

        <div className="relative rounded-lg border bg-emerald-50 p-4">
          <div className="absolute left-3 top-3">
            <Chip label="PageBody (children de PageShell)" />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold">Bloque A</h3>
              <p className="text-sm text-muted-foreground">
                Cualquier contenido del flujo principal va aquí (cards, tablas, etc.).
              </p>
            </div>
            <div className="rounded-md border bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold">Bloque B</h3>
              <p className="text-sm text-muted-foreground">
                Mantén este layout como plantilla para nuevas páginas del dashboard.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-md border bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold">Notas</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li>
                El chip “Shell Activo” y el estado de cuenta (trial/subscribed/none) aparecen en la barra flotante
                superior.
              </li>
              <li>
                Puedes ocultar el header con <code>hideHeaderArea</code> o el chivato con{" "}
                <code>showAccountStatus</code>.
              </li>
              <li>
                <code>headerBand</code> añade una franja debajo del header para filtros o sub-navegación.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
