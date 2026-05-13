// app/components/mybusiness/core/EditableDetailField.tsx
"use client";

import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";

const COLOR_OPTIONS = [
  "#64748b",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
];

type Props = {
  label: string;
  value: string;
  type?: "text" | "email" | "tel" | "number" | "color";
  suffix?: string;
  onSave: (nextValue: string) => Promise<void> | void;
};

export default function EditableDetailField({
  label,
  value,
  type = "text",
  suffix,
  onSave,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  useEffect(() => {
  if (!isEditing || type !== "color") {
    return;
  }

  function handlePointerDown() {
    setIsEditing(false);
  }

  window.addEventListener("pointerdown", handlePointerDown, true);

  return () => {
    window.removeEventListener("pointerdown", handlePointerDown, true);
  };
}, [isEditing, type]);

  async function saveValue(nextValue: string) {
    const cleanValue = nextValue.trim();

    setIsEditing(false);

    if (cleanValue === value) {
      return;
    }

    try {
      setStatus("saving");
      await onSave(cleanValue);
      setStatus("saved");

      window.setTimeout(() => {
        setStatus("idle");
      }, 900);
    } catch {
      setStatus("error");
    }
  }

  async function saveIfChanged() {
    await saveValue(draftValue);
  }

  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div
        onClick={() => setIsEditing(true)}
className={[
  "group flex h-8 cursor-text items-center justify-between gap-2 rounded-md border px-2 transition",
  isEditing
    ? "border-blue-300"
    : "border-transparent hover:border-slate-200",
].join(" ")}
        >
        {isEditing && type !== "color" ? (
          <div className="flex w-full items-center gap-2">
            <input
              autoFocus
              type={type}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              onBlur={saveIfChanged}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }

                if (event.key === "Escape") {
                  setDraftValue(value);
                  setIsEditing(false);
                }
              }}
              className="h-6 w-full border-0 bg-transparent p-0 text-[13px] leading-6 text-slate-900 outline-none"
            />

            {suffix ? (
              <span className="text-[13px] text-slate-500">{suffix}</span>
            ) : null}
          </div>
) : type === "color" && isEditing ? (
  <div className="relative flex w-full items-center">
    <span
      className="h-4 w-4 rounded-full border border-slate-200"
      style={{ backgroundColor: value || "#cbd5e1" }}
    />

    <div
        onPointerDown={(event) => event.stopPropagation()}
        className="absolute left-0 top-7 z-30 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
      <div className="grid grid-cols-4 gap-2">
        {COLOR_OPTIONS.map((color) => (
          <button
            key={color}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              saveValue(color);
            }}
            className={[
              "h-5 w-5 rounded-full border transition hover:scale-110",
              value === color
                ? "border-slate-900 ring-2 ring-slate-200"
                : "border-slate-200",
            ].join(" ")}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  </div>
) : (
          <>
            <div className="flex min-w-0 items-center gap-2 text-[13px] text-slate-800">
              {type === "color" ? (
                <span
                  className="h-4 w-4 rounded-full border border-slate-200"
                  style={{ backgroundColor: value || "#cbd5e1" }}
                />
              ) : (
                <span className="truncate">
                  {value || "Sin definir"}
                  {value && suffix ? ` ${suffix}` : ""}
                </span>
              )}
            </div>

            <button
              type="button"
onPointerDown={(event) => {
  if (isEditing && type === "color") {
    event.preventDefault();
    return;
  }

  setDraftValue(value ?? "");
  setIsEditing(true);
}}
              className="opacity-0 transition group-hover:opacity-100"
            >
              <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-slate-700" />
            </button>
          </>
        )}
      </div>

      {status === "saving" && (
        <div className="mt-0.5 text-[11px] text-slate-400">Guardando...</div>
      )}

      {status === "saved" && (
        <div className="mt-0.5 text-[11px] text-emerald-600">Guardado</div>
      )}

      {status === "error" && (
        <div className="mt-0.5 text-[11px] text-red-600">
          No se pudo guardar.
        </div>
      )}
    </div>
  );
}