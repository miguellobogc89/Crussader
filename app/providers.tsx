"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

// Si usas shadcn/ui y tienes TooltipProvider, descomenta e incluye:
// import { TooltipProvider } from "@/components/ui/tooltip";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {/* <TooltipProvider delayDuration={200}> */}
        {children}
        <Toaster richColors />
      {/* </TooltipProvider> */}
    </SessionProvider>
  );
}
