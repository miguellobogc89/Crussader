// app/dashboard/onboarding/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PageShell from "@/app/components/layouts/PageShell";
import {
  useBootstrapData,
  useBootstrapStatus,
  useBootstrapStore,
} from "@/app/providers/bootstrap-store";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

type Slide = {
  id: string;
  title: string;
  body: string;
  img: string;
  imgAlt: string;
  isFinal?: boolean;
};

export default function OnboardingPage() {
  const data = useBootstrapData();
  const status = useBootstrapStatus();
  const { data: session } = useSession();
  const router = useRouter();
  const fetchFromApi = useBootstrapStore((s) => s.fetchFromApi);

  // Estado actual del onboarding desde bootstrap
  const currentStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" =
    (data as any)?.me?.onboardingStatus ??
    (data as any)?.user?.onboardingStatus ??
    (data as any)?.currentUser?.onboardingStatus ??
    "PENDING";

  // Al entrar: si estaba PENDING, marcar IN_PROGRESS (idempotente)
  useEffect(() => {
    if (status !== "ready") return;
    if (currentStatus !== "PENDING") return;
    (async () => {
      try {
        await fetch("/api/me/onboarding", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        });
        // opcional refrescar bootstrap: await fetchFromApi();
      } catch {
        /* noop */
      }
    })();
  }, [status, currentStatus]);

  // Nombre del usuario (bootstrap o sesión)
  const userName = useMemo(() => {
    const d: any = data ?? {};
    const candidate =
      d.me?.name ??
      d.user?.name ??
      d.currentUser?.name ??
      d.me?.email ??
      d.user?.email ??
      d.currentUser?.email ??
      session?.user?.name ??
      session?.user?.email ??
      "";
    const base = (typeof candidate === "string" && candidate.trim()) || "";
    const name = base.includes("@") ? base.split("@")[0] : base;
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "allí";
  }, [data, session]);

  // Slides (texto + imagen). Coloca los assets en /public/onboarding/*
  const slides: Slide[] = [
    {
      id: "welcome",
      title: `¡Hola, ${userName}!`,
      body:
        "Bienvenido a Crussader. Este asistente te mostrará los primeros pasos para empezar.",
      img: "/onboarding/01-welcome.png",
      imgAlt: "Bienvenida",
    },
    {
      id: "company",
      title: "Conecta tu negocio",
      body:
        "Crea la ficha de tu empresa, únete a una existente o solicita asociación para que te añadan.",
      img: "/onboarding/02-company.png",
      imgAlt: "Conecta tu empresa",
    },
    {
      id: "voice",
      title: "Define tu voz de marca",
      body:
        "Elige tono, formalidad y estilo de tus respuestas con IA. Podrás personalizarlo cuando quieras.",
      img: "/onboarding/03-voice.png",
      imgAlt: "Voz de marca",
    },
    {
      id: "reviews",
      title: "Importa tus reseñas",
      body:
        "Conecta Google Business o sube un CSV. Así podrás responder automáticamente con tu estilo.",
      img: "/onboarding/04-reviews.png",
      imgAlt: "Reseñas conectadas",
    },
    {
      id: "ready",
      title: "Todo listo",
      body:
        "Tu cuenta ya está configurada. Pulsa Comenzar para ir al panel principal.",
      img: "/onboarding/05-ready.png",
      imgAlt: "Listo para empezar",
      isFinal: true,
    },
  ];

  // Slider
  const [index, setIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const current = slides[index];
  const canPrev = index > 0;
  const canNext = index < slides.length - 1;

  function goPrev() {
    if (!canPrev) return;
    setIndex((i) => i - 1);
    setAnimKey((k) => k + 1);
  }
  function goNext() {
    if (!canNext) return;
    setIndex((i) => i + 1);
    setAnimKey((k) => k + 1);
  }

  // Teclado y swipe
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canNext, canPrev]);

  const touchStartX = useRef<number | null>(null);
  const touchMoveX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchMoveX.current = null;
  }
  function onTouchMove(e: React.TouchEvent) {
    touchMoveX.current = e.touches[0].clientX;
  }
  function onTouchEnd() {
    if (touchStartX.current == null || touchMoveX.current == null) return;
    const delta = touchMoveX.current - touchStartX.current;
    if (delta <= -48) goNext();
    if (delta >= 48) goPrev();
  }

  // Botón "Comenzar" → COMPLETED + refresh + redirect
async function handleStart() {
  // 1) dispara el PATCH sin esperar (no bloquea la UI)
  fetch("/api/me/onboarding", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "COMPLETED" }),
    keepalive: true, // ayuda si el usuario navega muy rápido
  }).catch(() => { /* noop */ });

  // 2) (opcional pero recomendado) optimismo local para que cualquier guard client-side no te devuelva
  try {
    // si usas Zustand, puedes ajustar el bootstrap en caliente:
    import("@/app/providers/bootstrap-store").then(({ useBootstrapStore }) => {
      useBootstrapStore.setState((s: any) => {
        const d = s.data ?? {};
        const me =
          d.me ?? d.user ?? d.currentUser ?? {};
        const mergedMe = { ...me, onboardingStatus: "COMPLETED" };
        const nextData =
          d.me ? { ...d, me: mergedMe } :
          d.user ? { ...d, user: mergedMe } :
          d.currentUser ? { ...d, currentUser: mergedMe } :
          d; // si no hay objeto, lo dejamos tal cual
        return { data: nextData };
      });
    });
  } catch {}

  // 3) navega YA (sin await)
  router.replace("/dashboard/home");
}


  if (status !== "ready") {
    return (
      <PageShell title=" " description="">
        <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
      </PageShell>
    );
  }

  return (
    <PageShell title=" " description="">
      <div className="min-h-[70vh] w-full flex items-center justify-center">
        <div
          className="relative w-full max-w-4xl px-4"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Card principal (fade in por key) */}
          <div
            key={animKey}
            className={cn(
              "mx-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden",
              "transition duration-500 ease-out",
              "animate-in fade-in-0 zoom-in-95"
            )}
          >
            <div className="grid md:grid-cols-2">
              {/* Texto */}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                  {current.title}
                </h2>
                <p className="mt-3 text-sm md:text-base leading-relaxed text-gray-600">
                  {current.body}
                </p>

                {current.isFinal ? (
                  <button
                    onClick={handleStart}
                    className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-sky-500 px-6 py-3 text-white font-semibold text-base shadow-md transition hover:scale-105 hover:shadow-lg"
                  >
                    Comenzar
                  </button>
                ) : (
                  // Controles móviles (solo si no es final)
                  <div className="mt-6 flex items-center justify-between md:hidden">
                    <Dots total={slides.length} active={index} />
                    <div className="flex gap-2">
                      <NavButton dir="left" disabled={!canPrev} onClick={goPrev} />
                      <NavButton dir="right" disabled={!canNext} onClick={goNext} />
                    </div>
                  </div>
                )}
              </div>

              {/* Imagen */}
              <div className="relative bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="relative aspect-[4/3] md:h-full">
                  <Image
                    src={current.img}
                    alt={current.imgAlt}
                    fill
                    className="object-contain p-6 md:p-8"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Flechas y dots desktop (si no es final) */}
          {!current.isFinal && (
            <>
              <div className="hidden md:flex absolute inset-y-0 -left-2 items-center">
                <NavButton dir="left" disabled={!canPrev} onClick={goPrev} />
              </div>
              <div className="hidden md:flex absolute inset-y-0 -right-2 items-center">
                <NavButton dir="right" disabled={!canNext} onClick={goNext} />
              </div>
              <div className="hidden md:flex mt-4 w-full items-center justify-center">
                <Dots total={slides.length} active={index} />
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

/* ---------- Subcomponentes ---------- */

function NavButton({
  dir,
  onClick,
  disabled,
}: {
  dir: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
}) {
  const isLeft = dir === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled}
      aria-label={isLeft ? "Anterior" : "Siguiente"}
      className={cn(
        "group inline-flex items-center justify-center rounded-full h-10 w-10 bg-white/90 shadow-md ring-1 ring-black/5",
        "transition hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        className={cn(
          "transition-transform text-gray-700 group-hover:scale-110",
          isLeft ? "" : "rotate-180"
        )}
        aria-hidden="true"
      >
        <path
          d="M15.75 19.5l-7.5-7.5 7.5-7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function Dots({ total, active }: { total: number; active: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block h-2 w-2 rounded-full transition-all",
            i === active ? "bg-gray-900 w-4" : "bg-gray-300"
          )}
        />
      ))}
    </div>
  );
}
