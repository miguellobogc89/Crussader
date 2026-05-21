// app/components/slots/Waitlist/WaitlistCustomerCreate.tsx
"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

type Props = {
  companyId: string | null;
  locationId: string | null;
  initialName?: string;
  onCancel: () => void;
  onCreated: (item: {
    customerId: string;
    displayName: string;
    phone: string | null;
  }) => void;
};

const ENDPOINT = "/api/slots/customers/create";

export function WaitlistCustomerCreate({
  companyId,
  locationId,
  initialName = "",
  onCancel,
  onCreated,
}: Props) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

async function handleSave() {
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();

  if (!companyId || !locationId || !trimmedName || !trimmedPhone) {
    return;
  }

  const parts = trimmedName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");

  try {
    setSaving(true);

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        locationId,
        firstName,
        lastName,
        phone: trimmedPhone,
      }),
    });

    const data = await res.json();

    const rawId =
      data.item?.customerId ??
      data.item?.customer?.id ??
      null;

    const id = rawId ? String(rawId) : "";

    const displayName = String(
      data.item?.customer?.displayName ?? trimmedName
    );

    const rawPhone =
      data.item?.customer?.phone ?? trimmedPhone ?? null;

    const finalPhone = rawPhone ? String(rawPhone) : null;

    onCreated({
      customerId: id,
      displayName,
      phone: finalPhone,
    });
  } catch (e) {
    console.error(e);
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="rounded-xl border bg-card p-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre"
        className="mb-2 h-8"
      />

      <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Teléfono"
        className="mb-3 h-8"
      />

      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancelar
        </Button>

        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="mr-1 h-3.5 w-3.5" />
          )}
          Guardar
        </Button>
      </div>
    </div>
  );
}