// app/components/WelcomePanel.tsx
"use client";

import Image from "next/image";

export default function WelcomePanel({ name }: { name: string }) {
  return (
    <div className="
      relative overflow-hidden rounded-xl
      bg-gradient-to-br from-primary via-accent to-primary/80
      p-6 sm:p-8 lg:p-10 text-primary-foreground shadow-md
    ">
      <div className="relative z-10 space-y-2">
        <h1 className="font-bold 
          text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">
          Bienvenido, {name} 👋
        </h1>

        <p className="text-sm sm:text-base lg:text-lg xl:text-xl
          text-primary-foreground/90 max-w-2xl">
          Aquí tienes una visión clara y rápida del estado de tu reputación online.
        </p>
      </div>

      <div className="pointer-events-none absolute -right-16 -bottom-16 opacity-10">
        <Image
          src="/logo/logo.svg"
          alt="Crussader Logo"
          width={300}
          height={300}
          className="w-32 sm:w-48 lg:w-72 xl:w-80 object-contain"
        />
      </div>
    </div>
  );
}
