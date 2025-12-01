"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function AccessApprovedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-200">
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="h-14 w-14 text-green-500" />

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Acceso aprobado correctamente
          </h1>

          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            El usuario ya puede acceder a la empresa en Crussader.
            Gracias por gestionar la solicitud.
          </p>

          <Link
            href="/auth/login"
            className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            Ir a Crussader
          </Link>
        </div>
      </div>
    </div>
  );
}
