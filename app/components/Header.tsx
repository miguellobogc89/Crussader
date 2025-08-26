"use client";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data } = useSession();
  const name = data?.user?.name ?? "Usuario";
  const email = data?.user?.email ?? "";
  const image = data?.user?.image ?? "";

  return (
    <header className="h-16 w-full border-b bg-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <h1 className="text-base md:text-lg font-semibold text-gray-800">
        Panel de Control
      </h1>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-gray-800">{name}</div>
          <div className="text-xs text-gray-500">{email}</div>
        </div>
        <img
          src={image || "https://ui-avatars.com/api/?background=EEE&color=7C3AED&name=" + encodeURIComponent(name)}
          alt="avatar"
          className="w-10 h-10 rounded-full border"
        />
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-lg bg-red-500 text-white px-3 py-1.5 text-sm hover:bg-red-600"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
