// app/components/home/HomeWelcomeHeader.tsx
import Image from "next/image";

type HomeWelcomeHeaderProps = {
  name: string;
};

export default function HomeWelcomeHeader({ name }: HomeWelcomeHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-accent to-primary/80 p-8 text-primary-foreground shadow-md">
      <div className="relative z-10">
        <h1 className="mb-2 text-3xl font-bold">
          👋Bienvenido, {name}
        </h1>
        <p className="text-lg text-primary-foreground/90">
          Aquí tienes una vista rápida del estado de tu cuenta, establecimientos y conexiones.
        </p>
      </div>

      {/* Logo como imagen de fondo decorativa */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 opacity-10">
        <Image
          src="/logo/logo.svg"
          alt="Crussader Logo"
          width={256}
          height={256}
          className="h-64 w-64 object-contain"
          priority
        />
      </div>
    </div>
  );
}
