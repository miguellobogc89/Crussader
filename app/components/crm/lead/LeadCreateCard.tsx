// app/components/crm/lead/LeadCreateCard.tsx
"use client";

import * as React from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";
import LeadAlert from "./LeadAlert";
import InviteCodePill from "./InviteCodePill";
import type { AlertState, LeadRow, ApiResponse, LeadType } from "./types";

type Props = {
  onLeadCreated: (lead: LeadRow) => void;
  onInviteCreated?: (code: string) => void;

  alert: AlertState;
  setAlert: (a: AlertState) => void;

  lastInviteCode: string | null;
  setLastInviteCode: (c: string | null) => void;
};

export default function LeadCreateCard({
  onLeadCreated,
  alert,
  setAlert,
  lastInviteCode,
  setLastInviteCode,
}: Props) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [type, setType] = React.useState<LeadType>("TEST_USER");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
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

        // si viene INVITE_ALREADY_ACTIVE, guardamos el código para UI
        const ctxCode =
          data.code === "INVITE_ALREADY_ACTIVE" ? (data.context?.code as string | undefined) : undefined;

        if (ctxCode) {
          setLastInviteCode(ctxCode);
        }

        return;
      }

      if (data.code === "LEAD_AND_INVITE_CREATED" && data.lead) {
        onLeadCreated(data.lead as LeadRow);

        const inviteCode =
          data.invite?.code ? String(data.invite.code) : null;

        if (inviteCode) {
          setLastInviteCode(inviteCode);
        }

        setEmail("");
        setName("");
        setType("TEST_USER");

        setAlert({
          variant: "success",
          message: data.message || "Lead e invitación creados correctamente.",
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
  }

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Crear lead</h2>
          <p className="text-xs text-slate-500 mt-1">
            Crea un lead y genera una invitación (beta/register).
          </p>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-slate-500 mb-1 select-none">
            Último invite code
          </div>
          <InviteCodePill code={lastInviteCode} className="justify-end" />
        </div>
      </div>

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
          <Select value={type} onValueChange={(v) => setType(v as LeadType)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEST_USER">Test user (beta cerrada)</SelectItem>
              <SelectItem value="BETA">Beta</SelectItem>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="PARTNER">Partner</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
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

          <LeadAlert alert={alert} />
        </div>
      </form>
    </div>
  );
}
