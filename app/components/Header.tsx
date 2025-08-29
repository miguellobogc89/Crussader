"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Settings, User, Bell, LogOut } from "lucide-react";

export default function Header() {
  const { data } = useSession();
  const name = data?.user?.name ?? "Usuario";
  const image =
    data?.user?.image ||
    "https://ui-avatars.com/api/?background=EEE&color=7C3AED&name=" +
      encodeURIComponent(name);

  const [open, setOpen] = useState(false);

  return (
    <header className="h-16 w-full border-b border-neutral-200 bg-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <h1 className="text-lg md:text-xl font-bold text-neutral-800 tracking-tight">
        Panel de Control
      </h1>

      <div className="flex items-center gap-4 relative">
        {/* Nombre + avatar */}
        <div className="hidden sm:block text-right">
          <div className="text-sm font-medium text-neutral-800">{name}</div>
        </div>
        <img
          src={image}
          alt="avatar"
          className="w-10 h-10 rounded-full border"
        />

        {/* Botón engranaje */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-full p-2 hover:bg-neutral-100"
        >
          <Settings className="h-5 w-5 text-neutral-700" />
        </button>

        {/* Menú desplegable */}
        {open && (
          <div className="absolute right-0 top-14 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg py-2 z-50">
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => {
                setOpen(false);
                // ejemplo: ir a perfil
              }}
            >
              <User className="h-4 w-4" /> Perfil
            </button>
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => {
                setOpen(false);
                // ejemplo: ir a notificaciones
              }}
            >
              <Bell className="h-4 w-4" /> Notificaciones
            </button>
            <hr className="my-1" />
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
