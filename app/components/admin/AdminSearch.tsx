"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  name: "uq" | "cq" | "lq";
  placeholder: string;
  defaultValue?: string;
  hiddenParams?: Record<string, string | number | undefined>;
  debounceMs?: number; // default 300
  onChange?: (value: string) => void; // ✅ añadido
};

export default function AdminSearch({
  name, placeholder, defaultValue = "", hiddenParams = {}, debounceMs = 300, onChange,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      // set / delete term
      const term = value.trim();
      if (term) params.set(name, term); else params.delete(name);

      // reset page asociada
      const pageParam = name === "uq" ? "upage" : name === "cq" ? "cpage" : "lpage";
      params.set(pageParam, "1");

      // preservar extras
      Object.entries(hiddenParams).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") params.delete(k);
        else params.set(k, String(v));
      });

        const currentPath = typeof window !== "undefined" ? window.location.pathname : "/admin";
        router.replace(`${currentPath}?${params.toString()}`);
    }, debounceMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => {
        const newValue = e.target.value;
        setValue(newValue);
        onChange?.(newValue); // ✅ nuevo comportamiento opcional
      }}
      placeholder={placeholder}
      className="w-80 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
    />
  );
}
