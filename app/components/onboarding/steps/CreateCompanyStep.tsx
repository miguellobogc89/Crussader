// app/components/onboarding/steps/CreateCompanyStep.tsx
"use client";

import * as React from "react";
import type { OnboardingStepProps } from "./index";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";

const EMP_BANDS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;

type ExistingCompany = {
  id: string;
  name: string | null;
};

export function CreateCompanyStep({ state, setState }: OnboardingStepProps) {
  const { companyForm } = state;

  const [checkingCompany, setCheckingCompany] = React.useState(true);
  const [existingCompany, setExistingCompany] =
    React.useState<ExistingCompany | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Dispara el avance al siguiente paso del onboarding
  function goNext() {
    const event = new CustomEvent("onboarding-next-step");
    window.dispatchEvent(event);
  }

  const setCompanyForm = (patch: Partial<typeof companyForm>) => {
    setState({
      companyForm: {
        ...companyForm,
        ...patch,
      },
    });
  };

  // 1) Al montar, miramos si ya hay empresa para este usuario/cuenta
  React.useEffect(() => {
    let cancelled = false;

    async function loadExistingCompany() {
      setCheckingCompany(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/mybusiness/company/status", {
          credentials: "include",
        });

        if (!res.ok) {
          if (!cancelled) {
            setExistingCompany(null);
          }
          return;
        }

        const data = (await res.json()) as {
          company?: { id: string; name: string | null } | null;
        };

        if (!cancelled && data.company) {
          const company: ExistingCompany = {
            id: data.company.id,
            name: data.company.name ?? "",
          };
          setExistingCompany(company);

          // Dejamos el flowState con companyId y nombre relleno
          setState({
            companyId: company.id,
            companyForm: {
              ...companyForm,
              name: company.name ?? "",
            },
          });
        } else if (!cancelled) {
          setExistingCompany(null);
        }
      } catch (err) {
        console.error("[CreateCompanyStep] error loading status:", err);
        if (!cancelled) {
          setExistingCompany(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingCompany(false);
        }
      }
    }

    loadExistingCompany();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectValue =
    companyForm.employeesBand && companyForm.employeesBand.length > 0
      ? companyForm.employeesBand
      : undefined;

  // 2) Crear empresa desde este propio step (cuando aún no existe)
  async function handleCreateCompany() {
    setErrorMsg(null);

    const name = companyForm.name.trim();
    if (!name) {
      setErrorMsg("El nombre de la empresa es obligatorio.");
      return;
    }

    setCreating(true);
    try {
      const { email, phone, address, employeesBand } = companyForm;

      const res = await fetch("/api/mybusiness/company/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          employeesBand,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            company?: { id: string; name: string | null } | null;
            companyId?: string;
          }
        | null;

      if (!res.ok || !data?.ok) {
        console.error("❌ Error creando empresa:", res.status, data);
        setErrorMsg("No se ha podido crear la empresa. Inténtalo de nuevo.");
        return;
      }

      const companyFromApi = data.company;
      const companyIdFromApi =
        data.companyId ?? data.company?.id ?? null;

      if (companyIdFromApi) {
        const finalName = companyFromApi?.name ?? name;

        // PATCH: companyId + companyForm.name
        setState({
          companyId: companyIdFromApi,
          companyForm: {
            ...companyForm,
            name: finalName,
          },
        });

        // A partir de aquí se considera "empresa existente"
        setExistingCompany({
          id: companyIdFromApi,
          name: finalName,
        });
      }
    } catch (err) {
      console.error("❌ Error creando empresa:", err);
      setErrorMsg("Ha ocurrido un error creando la empresa.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Introduce los datos básicos para crear tu empresa en Crussader. 
        Podrás completar más información más adelante.
      </p>

      {/* Estado: ya hay empresa para este usuario/cuenta */}
      {!checkingCompany && existingCompany && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p>
            Tu empresa es:{" "}
            <span className="font-semibold">
              {existingCompany.name || "Sin nombre"}
            </span>
            .
          </p>
          <p className="mt-1 text-xs text-emerald-900/80">
            Puedes continuar al siguiente paso sin necesidad de crear otra
            empresa.
          </p>
        </div>
      )}


      {/* Si no hay empresa existente, mostramos el formulario y el botón de crear */}
      {!existingCompany && (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Nombre de la empresa</Label>
              <Input
                id="company-name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ name: e.target.value })}
                placeholder="Ej. Clínica Dental Sonrisas"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company-email">Email de contacto</Label>
              <Input
                id="company-email"
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ email: e.target.value })}
                placeholder="contacto@tuempresa.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company-phone">Teléfono</Label>
              <Input
                id="company-phone"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ phone: e.target.value })}
                placeholder="+34 600 000 000"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company-address">Dirección</Label>
              <Input
                id="company-address"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ address: e.target.value })}
                placeholder="Calle Ejemplo 123, Madrid"
              />
            </div>

            <div className="grid gap-2">
              <Label>Número de empleados</Label>
              <Select
                value={selectValue}
                onValueChange={(v) =>
                  setCompanyForm({
                    employeesBand: v === "__none__" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una banda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin especificar</SelectItem>
                  {EMP_BANDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b} empleados
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleCreateCompany}
              disabled={creating}
            >
              {creating ? "Creando empresa..." : "Crear empresa"}
            </Button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600">{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}
