// app/components/layouts/PageHeader.tsx
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import PageTitle from "./PageTitle";

type Props = {
  title: string;
  description?: string;
  titleIconName?: React.ComponentProps<typeof PageTitle>["iconName"];
  className?: string;
  rightSlot?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  titleIconName,
  className = "",
  rightSlot,
}: Props) {
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
          user.email,
        )}&background=6366f1&color=ffffff&size=128`,
      );
      return;
    }

    if (user?.name) {
      setAvatarUrl(
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.name,
        )}&background=6366f1&color=ffffff&size=128`,
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
    <header
      className={[
        "w-full h-20 flex items-center justify-between gap-4 bg-white px-4 sm:px-6 lg:px-8 border-b border-slate-200",
        className,
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <PageTitle
          title={title}
          subtitle={description}
          iconName={titleIconName}
          size="lg"
          gradient="from-indigo-600 via-violet-600 to-fuchsia-600"
        />
      </div>

      <div className="shrink-0 flex items-center gap-3">
        {rightSlot}

        <div
          className="relative"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-50"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name ?? "Usuario"}
                className="h-9 w-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 text-sm font-semibold">
                {userInitial}
              </div>
            )}

            <div className="hidden sm:flex min-w-0 flex-col items-start">
              <span className="max-w-[180px] truncate text-sm font-semibold text-slate-900">
                {user?.name ?? "Usuario"}
              </span>
              <span className="max-w-[180px] truncate text-xs text-slate-500">
                {user?.email ?? ""}
              </span>
            </div>

            <ChevronDown
              className={[
                "h-4 w-4 text-slate-500 transition-transform duration-200",
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
      </div>
    </header>
  );
}