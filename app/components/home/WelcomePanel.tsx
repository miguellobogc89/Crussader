"use client";

import Image from "next/image";

type Props = {
  name?: string | null;
  firstName?: string | null;
};

export default function WelcomePanel({ name, firstName }: Props) {
  let displayName = "";

  if (firstName && firstName.trim() !== "") {
    displayName = firstName.trim();
  } else if (name && name.trim() !== "") {
    displayName = name.trim().split(/\s+/)[0];
  }

  return (
    <div
      className="
        relative overflow-hidden rounded-xl
        bg-gradient-to-br from-primary via-accent to-primary/80
        p-4 sm:p-6 md:p-8 lg:p-10
        text-primary-foreground shadow-md
      "
    >
      <div className="relative z-10 space-y-3">
        <h1
          className="
            font-bold
            text-[clamp(1.5rem,4.5vw,2.6rem)]
            leading-tight
          "
        >
          {displayName !== ""
            ? `Bienvenido, ${displayName} 👋`
            : "Bienvenido 👋"}
        </h1>

        <p
          className="
            text-[clamp(0.9rem,2.4vw,1.1rem)]
            text-primary-foreground/90
            max-w-2xl
          "
        >
          Aquí tienes una visión clara y rápida del estado de tu reputación
          online.
        </p>
      </div>

      <div className="pointer-events-none absolute -right-12 -bottom-12 opacity-10">
        <Image
          src="/logo/logo.svg"
          alt="Crussader Logo"
          width={300}
          height={300}
          className="object-contain w-[clamp(6rem,26vw,14rem)]"
        />
      </div>
    </div>
  );
}
