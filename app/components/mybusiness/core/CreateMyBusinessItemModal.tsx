// app/components/mybusiness/core/CreateMyBusinessItemModal.tsx
"use client";

import { useState } from "react";
import StandardModal from "@/app/components/crussader/StandardModal";
import ColorBubblePicker from "@/app/components/crussader/ColorBubblePicker";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import { useToast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  type: "employees" | "services";
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreateMyBusinessItemModal({
  open,
  type,
  onClose,
  onCreated,
}: Props) {
  const isEmployee = type === "employees";
  const bootstrap = useBootstrapData();
  const { toast } = useToast();

const [title, setTitle] = useState<"Dr" | "Dra" | "">("");
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [email, setEmail] = useState("");
const [jobTitle, setJobTitle] = useState("");
const [color, setColor] = useState("#cbd5e1");
const [isSaving, setIsSaving] = useState(false);
const [errorText, setErrorText] = useState("");


const firstSurname = lastName.trim().split(" ")[0] ?? "";

const publicName = [
  title,
  firstName.trim(),
  firstSurname,
]
  .filter(Boolean)
  .join(" ");

const canCreateEmployee =
  firstName.trim().length > 0 &&
  lastName.trim().length > 0 &&
  email.trim().length > 0 &&
  jobTitle.trim().length > 0 &&
  color.trim().length > 0 &&
  !isSaving;

  async function handleCreateEmployee() {
    setErrorText("");
    try {
      setIsSaving(true);

      const res = await fetch("/api/mybusiness/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          firstName,
          lastName,
          publicName,
          email,
          name: publicName,
          jobTitle,
          color,
          active: true,
          locationIds: bootstrap?.sessionContext?.locationId
            ? [bootstrap.sessionContext.locationId]
            : [],
        }),
      });

const raw = await res.text();

let data: any = null;

try {
  data = raw ? JSON.parse(raw) : null;
} catch {
  data = raw;
}

if (!res.ok) {
  setErrorText(
    data?.error?.includes("email")
      ? "Ya existe un empleado con ese email."
      : "No se pudo crear el empleado.",
  );

  return;
}

toast({
  variant: "success",
  title: "Empleado creado",
  description: "El empleado se ha creado correctamente.",
});

onCreated?.();
onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
<StandardModal
  open={open}
  title={isEmployee ? "Nuevo empleado" : "Nuevo servicio"}
primaryLabel={
  isSaving ? (
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      <span>Creando...</span>
    </div>
  ) : (
    "Crear"
  )
}
  primaryDisabled={isEmployee && !canCreateEmployee}
  onPrimary={() => {
    if (isEmployee && canCreateEmployee) {
      handleCreateEmployee();
    }
  }}
  onClose={onClose}
>

    {errorText && (
  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
    {errorText}
  </div>
)}
    <div className="space-y-4">
        {isEmployee && (
        <>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
                Tratamiento
            </label>

            <select
                value={title}
                onChange={(e) => setTitle(e.target.value as "Dr" | "Dra" | "")}
                className="h-[42px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500"
            >
                <option value="">Ninguno</option>
                <option value="Dr">Dr</option>
                <option value="Dra">Dra</option>
            </select>
            </div>

            <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
                Nombre
            </label>

            <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                placeholder="Ej: Laura"
            />
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
                Apellidos
            </label>

            <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                placeholder="Ej: García"
            />

            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                </label>

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Ej: laura@clinica.com"
                />
            </div>

        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
                Cargo
            </label>

            <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                placeholder="Ej: Veterinaria"
            />
            </div>

            <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
                Color
            </label>

    <ColorBubblePicker
    value={color}
    onChange={setColor}
    />
            </div>
        </div>
        </>
    )}
    </div>
    </StandardModal>
  );
}