// app/dashboard/profile/page.tsx
"use client";

import { useBootstrapData, useBootstrapStatus } from "@/app/providers/bootstrap-store";

export default function Page() {
  return (
    <main>
      <h1 className="text-2xl font-bold">Página principal</h1>

      {/* Aquí va tu test de Tailwind */}
      <div className="mt-8 p-6 bg-red-500 text-white rounded-lg">
        Tailwind está funcionando ✅
      </div>
    </main>
  );
}


