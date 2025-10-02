// app/components/layouts/PageShell.tsx
"use client";

import { ReactNode, Suspense } from "react";
import PageHeader from "./PageHeader";
import PageBody from "./PageBody";

function BodySkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-24 w-full animate-pulse rounded bg-muted" />
      <div className="h-64 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

export default function PageShell({
  title,
  description,
  breadcrumbs,
  actions,
  toolbar,       // sigue existiendo por si quieres elementos bajo el título
  headerBand,    // NUEVO: banda full-width (ideal para tabs)
  children,
  variant = "default",
}: {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  toolbar?: ReactNode;
  headerBand?: ReactNode; // <— aquí pasaremos el TabsMenu como “banda”
  children: ReactNode;
  variant?: "default" | "full" | "narrow";
}) {
  return (
    <div className="w-full">
      {/* HEADER superior (translúcido), contenido centrado */}
      <div className="w-full bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PageHeader
            title={title}
            description={description}
            breadcrumbs={breadcrumbs}
            actions={actions}
          />
          {toolbar && <div className="mt-4">{toolbar}</div>}
        </div>
      </div>

      {/* BANDA FULL-WIDTH: blanco sólido + borde inferior */}
      {headerBand && (
        <div className="w-full bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            {headerBand}
          </div>
        </div>
      )}

      {/* BODY */}
      <Suspense
        fallback={
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <BodySkeleton />
          </div>
        }
      >
        <PageBody variant={variant}>
          {children}
        </PageBody>
      </Suspense>
    </div>
  );
}
