"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";

type Props = {
  // opcional, por si quieres esconder "Cerrar cuenta" en algún contexto
  showDeactivateAccountButton?: boolean;
};

export default function AccountDangerZone({
  showDeactivateAccountButton = true,
}: Props) {
  const [loadingUserDelete, setLoadingUserDelete] = useState(false);
  const [loadingDeactivate, setLoadingDeactivate] = useState(false);

  async function handleDeleteUser() {
    const ok = window.confirm(
      "Vas a eliminar tu usuario de esta cuenta.\n\nSi eres el único usuario de la cuenta, deberás cerrar la cuenta en lugar de borrarte.\n\n¿Seguro que quieres continuar?"
    );
    if (!ok) return;

    try {
      setLoadingUserDelete(true);
      const res = await fetch("/api/account/user/delete", {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.error === "ONLY_USER_IN_ACCOUNT") {
          alert(
            "Eres el único usuario de esta cuenta. Primero debes cerrar la cuenta desde la opción 'Cerrar cuenta'."
          );
          return;
        }

        alert(
          data?.message ||
            data?.error ||
            "No se ha podido eliminar el usuario. Inténtalo de nuevo."
        );
        return;
      }

      alert("Tu usuario se ha eliminado correctamente. Te vamos a desconectar.");
      // Forzar signout (lado cliente) por ahora:
      window.location.href = "/api/auth/signout";
    } finally {
      setLoadingUserDelete(false);
    }
  }

  async function handleDeactivateAccount() {
    const ok = window.confirm(
      "Vas a cerrar tu cuenta.\n\nSe desactivará la cuenta y dejará de estar operativa.\n\n¿Seguro que quieres continuar?"
    );
    if (!ok) return;

    try {
      setLoadingDeactivate(true);
      const res = await fetch("/api/account/deactivate", {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(
          data?.message ||
            data?.error ||
            "No se ha podido cerrar la cuenta. Inténtalo de nuevo."
        );
        return;
      }

      alert("Hemos desactivado tu cuenta. Te vamos a desconectar.");
      window.location.href = "/api/auth/signout";
    } finally {
      setLoadingDeactivate(false);
    }
  }

  return (
    <Card className="border-red-200 bg-red-50/70">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <CardTitle className="text-base sm:text-lg text-red-900">
            Zona de peligro
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-red-800/80">
            Aquí puedes eliminar tu usuario o cerrar por completo tu cuenta.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-md border border-red-200 bg-white/60 p-3 sm:p-4">
          <h3 className="text-sm font-semibold text-red-900 mb-1.5">
            Eliminar mi usuario
          </h3>
          <p className="text-xs sm:text-sm text-red-800/90 mb-3">
            Se eliminará solo tu usuario de esta cuenta. Si eres el único
            usuario, tendrás que cerrar la cuenta en lugar de borrarte.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteUser}
            disabled={loadingUserDelete}
          >
            {loadingUserDelete ? "Eliminando…" : "Eliminar mi usuario"}
          </Button>
        </div>

        {showDeactivateAccountButton && (
          <div className="rounded-md border border-red-200 bg-white/60 p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-red-900 mb-1.5">
              Cerrar cuenta
            </h3>
            <p className="text-xs sm:text-sm text-red-800/90 mb-3">
              Se desactivará la cuenta completa. Ningún usuario podrá acceder,
              pero los datos se conservarán internamente.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-red-400 text-red-700 hover:bg-red-100"
              onClick={handleDeactivateAccount}
              disabled={loadingDeactivate}
            >
              {loadingDeactivate ? "Cerrando cuenta…" : "Cerrar cuenta"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
