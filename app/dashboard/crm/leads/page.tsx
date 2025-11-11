// app/dashboard/admin/leads/page.tsx
"use client";

import { useEffect, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

type Lead = {
  id: string;
  email: string | null;
  name: string;
  type: string;
  source: string;
  status: string;
  companyId: string;
  ownerId: string | null;
  createdAt: string;
};

type ApiResponse = {
  ok: boolean;
  code?: string;
  message?: string;
  lead?: Lead;
  leads?: Lead[];
  invite?: {
    id: string;
    code: string;
    expires_at: string | null;
    status: string;
  };
  reused?: boolean;
  context?: any;
};

export default function AdminLeadsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("TEST_USER");
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [alert, setAlert] = useState<{
    variant: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Cargar leads existentes
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/leads");
        const json: ApiResponse = await res.json();
        if (json?.ok && Array.isArray(json.leads)) {
          setLeads(json.leads);
        } else if (!json?.ok && json.message) {
          setAlert({ variant: "error", message: json.message });
        }
      } catch {
        setAlert({
          variant: "error",
          message: "No se han podido cargar los leads.",
        });
      } finally {
        setLoadingLeads(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!email || !name) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, type }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setAlert({
          variant: "error",
          message:
            data.message ||
            "No se ha podido crear el lead. Revisa los datos o inténtalo de nuevo.",
        });
        return;
      }

      if (data.code === "LEAD_AND_INVITE_CREATED" && data.lead) {
        setLeads((prev) => [data.lead!, ...prev]);
        setEmail("");
        setName("");
        setType("TEST_USER");

        const inviteCode = data.invite?.code
          ? ` Código: ${data.invite.code}`
          : "";

        setAlert({
          variant: "success",
          message:
            data.message ||
            `Lead creado y invitación enviada correctamente.${inviteCode}`,
        });
        return;
      }

      if (data.reused && data.code === "INVITE_ALREADY_ACTIVE") {
        const inviteCode = data.context?.code
          ? ` Código existente: ${data.context.code}`
          : "";
        setAlert({
          variant: "info",
          message:
            data.message ||
            `Ya existe una invitación activa para este email.${inviteCode}`,
        });
        return;
      }

      setAlert({
        variant: "success",
        message: data.message || "Lead procesado correctamente.",
      });
    } catch {
      setAlert({
        variant: "error",
        message:
          "Error inesperado al crear el lead. Revisa los logs o inténtalo de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderAlert = () => {
    if (!alert) return null;

    const base =
      "mt-3 inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium";
    const styles =
      alert.variant === "success"
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
        : alert.variant === "error"
        ? "bg-red-50 text-red-700 border border-red-200"
        : "bg-sky-50 text-sky-700 border border-sky-200";

    return <div className={`${base} ${styles}`}>{alert.message}</div>;
  };

  return (
    <PageShell
      title="Leads"
      titleIconName="Users"
      description="Invita negocios de confianza a la beta cerrada y registra su interés."
    >
      <div className="w-full py-8 space-y-8">
        {/* Formulario alta lead */}
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre del lead
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Nombre del negocio o contacto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Correo del lead
                </label>
                <Input
                  type="email"
                  required
                  placeholder="cliente@negocio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de lead
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEST_USER">
                    Test user (beta cerrada)
                  </SelectItem>
                  {/* futuros tipos */}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={saving || !email || !name}
                className="px-6"
              >
                {saving ? "Guardando..." : "Guardar lead"}
              </Button>

              {renderAlert()}
            </div>
          </form>
        </div>

      {/* Tabla de leads */}
      <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800">Leads registrados</h2>
          <span className="text-xs text-slate-500">
            {loadingLeads
              ? "Cargando..."
              : `${leads.length} lead${leads.length === 1 ? "" : "s"}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="px-3 py-2 text-left font-medium">Nombre</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Tipo</th>
                <th className="px-3 py-2 text-left font-medium">Estado</th>
                <th className="px-3 py-2 text-left font-medium">Creado</th>
              </tr>
            </thead>
            <tbody>
              {loadingLeads && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-slate-400"
                  >
                    Cargando leads...
                  </td>
                </tr>
              )}

              {!loadingLeads && leads.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-slate-400"
                  >
                    No hay leads registrados todavía.
                  </td>
                </tr>
              )}

              {!loadingLeads &&
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                  >
                    {/* 🟢 NOMBRE (primera columna) */}
                    <td className="px-3 py-2 text-slate-800 font-medium">
                      {lead.name || "—"}
                    </td>

                    <td className="px-3 py-2 text-slate-700">
                      {lead.email || "—"}
                    </td>

                    <td className="px-3 py-2">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700">
                        {lead.type || "—"}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-xs text-slate-600">
                      {lead.status}
                    </td>

                    <td className="px-3 py-2 text-xs text-slate-500">
                      {new Date(lead.createdAt).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      </div>
    </PageShell>
  );
}
