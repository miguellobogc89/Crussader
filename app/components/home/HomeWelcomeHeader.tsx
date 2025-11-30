// app/components/home/HomeWelcomeHeader.tsx
import { Crown } from "lucide-react";

type HomeWelcomeHeaderProps = {
  name: string;
};

export default function HomeWelcomeHeader({ name }: HomeWelcomeHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-accent to-primary/80 p-8 text-primary-foreground shadow-md">
      <div className="relative z-10">
        <h1 className="mb-2 text-3xl font-bold">
          Bienvenido de nuevo, {name} 👋
        </h1>
        <p className="text-lg text-primary-foreground/90">
          Aquí tienes una vista rápida del estado de tu reputación y tus conexiones.
        </p>
      </div>
      <div className="pointer-events-none absolute -right-10 -bottom-10 opacity-10">
        <Crown className="h-64 w-64" />
      </div>
    </div>
  );
}

