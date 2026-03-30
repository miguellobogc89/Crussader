// app/components/slots/SendToContactsModal/SlotsCreateContactForm.tsx
"use client";

import { Loader2, Phone, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

type SlotsCreateContactFormProps = {
  open: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  error: string;
  creating: boolean;
  disabled: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
};

export function SlotsCreateContactForm({
  open,
  firstName,
  lastName,
  phone,
  error,
  creating,
  disabled,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onSubmit,
}: SlotsCreateContactFormProps) {
  if (!open) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="space-y-3 rounded-xl border border-crussader/20 bg-crussader/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Nuevo contacto
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              placeholder="Nombre"
              className="h-9 rounded-lg border-border/60 bg-white pl-9 text-sm"
            />
          </div>

          <Input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Apellidos"
            className="h-9 rounded-lg border-border/60 bg-white text-sm"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+34 600 000 000"
              className="h-9 rounded-lg border-border/60 bg-white pl-9 text-sm"
            />
          </div>

          <Button
            onClick={onSubmit}
            disabled={disabled}
            className="h-9 rounded-lg bg-crussader px-4 text-sm font-medium text-white"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </motion.div>
  );
}