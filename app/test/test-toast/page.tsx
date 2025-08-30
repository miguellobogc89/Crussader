"use client";

import { toast } from "sonner";

export default function TestToastPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <button
        onClick={() => toast.success("UI lista 🎉")}
        className="rounded-md px-4 py-2 border shadow-glow hover:bg-violet-50"
      >
        Probar toast
      </button>
    </main>
  );
}
