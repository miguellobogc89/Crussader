// app/dashboard/knowledge/SectionTitleClient.tsx
"use client";

import React, { useState } from "react";
import { Pencil } from "lucide-react";
import SubmitButton from "@/app/components/ui/SubmitButton";
import { Input } from "@/app/components/ui/input";

export function SectionTitleClient({
  title,
  sectionId,
  action,
}: {
  title: string;
  sectionId: string;
  action: (fd: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  if (editing) {
    return (
      <form
        action={action}
        className="flex items-center gap-3"
        onSubmit={() => setEditing(false)}
      >
        <input type="hidden" name="id" value={sectionId} />
        <Input
          name="title"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="h-10 text-2xl sm:text-3xl font-semibold tracking-tight"
        />

        <SubmitButton className="px-3 py-1 h-9">
          Guardar
        </SubmitButton>
      </form>
    );
  }

  return (
    <div
      className="group flex items-center gap-3"
      onMouseLeave={() => setEditing(false)}
    >
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 truncate">
        {value || "(sin título)"}
      </h1>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-slate-400 hover:text-slate-700"
      >
        <Pencil className="h-5 w-5" />
      </button>
    </div>
  );
}