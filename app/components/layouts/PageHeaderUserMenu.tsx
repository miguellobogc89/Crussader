// app/components/layouts/PageHeaderUserMenu.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function PageHeaderUserMenu() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const userInitial = (
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();

  const providerImage = useMemo(() => {
    return (
      user?.image ||
      user?.avatar ||
      user?.picture ||
      user?.photoURL ||
      null
    );
  }, [user]);

  useEffect(() => {
    if (providerImage) {
      setAvatarUrl(providerImage);
      return;
    }

    if (user?.email) {
      setAvatarUrl(
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.email
        )}&background=6366f1&color=ffffff&size=128`
      );
      return;
    }

    if (user?.name) {
      setAvatarUrl(
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.name
        )}&background=6366f1&color=ffffff&size=128`
      );
      return;
    }

    setAvatarUrl(null);
  }, [providerImage, user?.email, user?.name]);

  useEffect(() => {
    const onClose = () => setUserMenuOpen(false);
    window.addEventListener("click", onClose);
    return () => window.removeEventListener("click", onClose);
  }, []);

  return (
    <div
      className="relative"
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={() => setUserMenuOpen((prev) => !prev)}
        className={[
          "flex items-center rounded-2xl bg-white transition hover:bg-slate-50",
          "gap-1.5 px-2 py-1.5",
          "md:gap-2 md:px-2.5 md:py-1.5",
          "xl2:gap-2.5 xl2:px-3 xl2:py-2",
        ].join(" ")}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.name ?? "Usuario"}
            className="h-7 w-7 shrink-0 rounded-full object-cover xl2:h-9 xl2:w-9"
          />
        ) : (
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary xl2:h-9 xl2:w-9 xl2:text-sm">
            {userInitial}
          </div>
        )}

        <div className="hidden min-w-0 flex-col items-start sm:flex">
          <span className="max-w-[120px] truncate text-[11px] font-semibold text-slate-900 md:max-w-[135px] md:text-xs xl2:max-w-[180px] xl2:text-sm">
            {user?.name ?? "Usuario"}
          </span>
          <span className="max-w-[120px] truncate text-[10px] text-slate-500 md:max-w-[135px] md:text-[11px] xl2:max-w-[180px] xl2:text-xs">
            {user?.email ?? ""}
          </span>
        </div>

        <ChevronDown
          className={[
            "h-3.5 w-3.5 text-slate-500 transition-transform duration-200 xl2:h-4 xl2:w-4",
            userMenuOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {userMenuOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3 sm:hidden">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.name ?? "Usuario"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user?.email ?? ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setUserMenuOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}