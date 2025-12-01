"use client";

import { cn } from "@/lib/utils";
import type { OnboardingStepProps } from "./index";

const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function JoinEmailStep({ state, setState }: OnboardingStepProps) {
  const { joinEmailInput, joinEmails } = state;

  function tryAddEmail(raw: string) {
    let value = raw.trim();
    if (!value) return;

    // Quitar comas/puntos sueltos al final
    value = value.replace(/[;,]+$/, "").trim();

    // Validación básica de email
    if (!basicEmailRegex.test(value)) {
      // Más adelante se puede añadir feedback visual
      return;
    }

    // Evitar duplicados (case-insensitive)
    const exists = joinEmails.some(
      (e) => e.toLowerCase() === value.toLowerCase(),
    );
    if (exists) {
      setState({ joinEmailInput: "" });
      return;
    }

    setState({
      joinEmails: [...joinEmails, value],
      joinEmailInput: "",
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Solo actualizamos el texto; la detección de email completo
    // la usa el canGoNext y el blur/Enter/espacio.
    setState({ joinEmailInput: e.target.value });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      tryAddEmail(joinEmailInput);
    }
  }

  function handleBlur() {
    // Si el usuario sale del input y hay algo, intentamos añadirlo también
    if (joinEmailInput.trim().length > 0) {
      tryAddEmail(joinEmailInput);
    }
  }

  function removeEmail(email: string) {
    setState({
      joinEmails: joinEmails.filter((e) => e !== email),
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700">
        Has indicado que tu empresa ya está usando Crussader.
      </p>
      <p className="text-sm text-slate-600">
        No hace falta que tu negocio tenga dominio propio.{" "}
        <span className="font-medium">
          Añade uno o varios correos de personas de tu empresa
        </span>{" "}
        (quien gestiona Google, el correo de reservas, recepción, etc.).
      </p>

      <div className="mt-3 space-y-2">
        <label
          htmlFor="join-email-input"
          className="block text-xs font-medium text-slate-600 uppercase tracking-wide"
        >
          Correos de contacto de tu empresa
        </label>

        <input
          id="join-email-input"
          type="email"
          value={joinEmailInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Escribe un correo y pulsa espacio, Enter o sigue escribiendo…"
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm outline-none transition",
            "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
          )}
        />

        {/* Chips */}
        <div className="min-h-[2rem] rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-2 py-1.5">
          {joinEmails.length === 0 ? (
            <p className="text-xs text-slate-400">
              Aún no has añadido ningún correo. Puedes poner varios; si
              cualquiera de ellos está registrado, contactaremos con esa persona
              para gestionar tu invitación.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {joinEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 border border-indigo-100"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-100 text-indigo-500"
                    aria-label={`Quitar ${email}`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3 w-3"
                      aria-hidden="true"
                    >
                      <path
                        d="M4.5 4.5l7 7m0-7l-7 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Si no estás seguro de qué correo poner, añade varios. Si alguno de
          ellos corresponde a un usuario ya registrado, nos pondremos en
          contacto con esa persona para gestionar tu invitación. No mostraremos
          ninguna información sobre otras empresas.
        </p>
      </div>
    </div>
  );
}
