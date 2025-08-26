"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

type Status = { ok: boolean; providers?: { googleBusiness?: { connected: boolean } } };

export default function IntegrationsPage() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/integrations/status")
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus({ ok: false }));
  }, []);

  const connected = !!status?.providers?.googleBusiness?.connected;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Integraciones</h1>
      <p className="text-gray-500 mb-6">Conecta servicios externos</p>

      {/* Card Google Reviews */}
      <div className="bg-white border rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            alt="Google Reviews"
            className="w-10 h-10"
            src="https://www.gstatic.com/ads-hub/images/google_logo.svg"
          />
          <div>
            <div className="font-semibold text-gray-900">Google Reviews</div>
            <div className="text-sm text-gray-500">
              Conecta tu Perfil de Empresa para leer y gestionar reseñas.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge de estado */}
          <span
            className={
              "text-sm px-2.5 py-1 rounded-full border " +
              (connected
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-50 text-gray-600 border-gray-200")
            }
          >
            {connected ? "Conectado" : "No conectado"}
          </span>

          {/* Botón conectar / gestionar */}
          {connected ? (
            <Link
              href="/integrations/google/connected"
              className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
            >
              Gestionar
            </Link>
          ) : (
            <button
              onClick={() => (window.location.href = "/api/connect/google-business/start")}
              className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm"
            >
              Conectar
            </button>

          )}
        </div>
      </div>
    </div>
  );
}
